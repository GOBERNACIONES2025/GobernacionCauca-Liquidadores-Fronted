import { inject, Injectable, signal, computed } from '@angular/core';
import { forkJoin, of, Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { BaseApiService } from '../../../../core/services/base-api.service';
import { 
  ApiResponse,
  VehiculoItem, 
  VehiculoKpis, 
  PagedResult,
  CatalogoItem, 
  CatalogoMarca,
  CatalogoLinea,
  CatalogoTipoDocumento, 
  CatalogoNaturalezaJuridica,
  CatalogoDepartamento,
  CatalogoCiudad,
  RegistrarVehiculoDto 
} from '../../domain/models/vehiculo.model';

@Injectable({
  providedIn: 'root',
})
export class VehiculosFacade {
  private api = inject(BaseApiService);

  // --------------------------------------------------------------------------
  // ESTADOS PRINCIPALES (SIGNALS)
  // --------------------------------------------------------------------------
  readonly vehiculos = signal<VehiculoItem[]>([]);
  readonly totalVehiculos = signal<number>(0);
  readonly paginaActual = signal<number>(1);
  readonly pageSize = signal<number>(10);
  readonly totalPaginas = signal<number>(1);

  readonly kpis = signal<VehiculoKpis>({
    vigenciaFiscal: 2026,
    vigenciaEstado: 'ACTIVA',
    vigenciaFecha: '01/01/2026',
    valorUvt: 49799,
    uvtVariacion: '+2.4%',
    uvtNorma: 'Ord. 004-2026 — UVT_2026',
    sancionMinima: 235000,
    sancionDescripcion: 'Liquidaciones extemporáneas',
    auditadosHoy: 1420,
    auditadosUltimo: 'hace 2 min · admin_user',
    totalVehiculos: 0
  });

  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // Filtros de búsqueda
  readonly filtroTexto = signal<string>('');
  readonly filtroEstado = signal<string>('Todos');
  readonly filtroTipo = signal<string>('Todos');

  // Catálogos para el Wizard
  readonly marcas = signal<CatalogoMarca[]>([]);
  readonly lineas = signal<CatalogoLinea[]>([]);
  readonly lineasDisponibles = signal<CatalogoLinea[]>([]);
  readonly estadosMatricula = signal<CatalogoItem[]>([]);
  readonly serviciosVehiculo = signal<CatalogoItem[]>([]);
  readonly tiposVinculo = signal<CatalogoItem[]>([]);
  readonly tiposVehiculo = signal<CatalogoItem[]>([]);
  readonly combustibles = signal<CatalogoItem[]>([]);
  readonly organismosTransito = signal<CatalogoItem[]>([]);
  readonly tiposDocumento = signal<CatalogoTipoDocumento[]>([]);
  readonly naturalezasJuridicas = signal<CatalogoNaturalezaJuridica[]>([]);
  readonly departamentos = signal<CatalogoDepartamento[]>([]);
  readonly ciudades = signal<CatalogoCiudad[]>([]);
  readonly ciudadesDisponibles = signal<CatalogoCiudad[]>([]);
  readonly catalogosLoading = signal<boolean>(false);
  readonly catalogosLoaded = signal<boolean>(false);
  readonly registroLoading = signal<boolean>(false);

  // Modal / Drawer de Registro / Expediente Multi-Paso
  readonly isDrawerOpen = signal<boolean>(false);
  readonly isNuevoRegistro = signal<boolean>(true);
  readonly currentStep = signal<number>(1);
  readonly activeTab = signal<string>('Datos del Vehículo');
  readonly selectedVehiculo = signal<VehiculoItem | null>(null);
  readonly panelTab = signal<'ficha' | 'propietarios' | 'valores'>('ficha');

  // Modal de Consulta RUNT
  readonly isRuntModalOpen = signal<boolean>(false);
  readonly placaRunt = signal<string>('');
  readonly runtLoading = signal<boolean>(false);

  // Búsqueda de propietario en Step 3
  readonly buscandoPropietario = signal<boolean>(false);
  readonly propietarioEncontrado = signal<any | null>(null);
  readonly busquedaRealizada = signal<boolean>(false);

  readonly tabs = computed(() => {
    return this.isNuevoRegistro()
      ? ['Datos del Vehículo', 'Propietarios', 'Observaciones']
      : ['Datos del Vehículo', 'Propietarios', 'Historial', 'Observaciones'];
  });

  // Lista Filtrada Computada (si se aplica filtro local además de servidor)
  readonly filteredVehiculos = computed(() => {
    const texto = this.filtroTexto().toLowerCase().trim();
    const estado = this.filtroEstado();
    const tipo = this.filtroTipo();

    return this.vehiculos().filter(v => {
      const matchTexto = !texto || 
        (v.placa && v.placa.toLowerCase().includes(texto)) ||
        (v.propietario?.nombre && v.propietario.nombre.toLowerCase().includes(texto)) ||
        (v.propietario?.numeroDocumento && v.propietario.numeroDocumento.toLowerCase().includes(texto)) ||
        (v.marca && v.marca.toLowerCase().includes(texto)) ||
        (v.linea && v.linea.toLowerCase().includes(texto)) ||
        (v.tituloFichaTecnica && v.tituloFichaTecnica.toLowerCase().includes(texto));

      const matchEstado = estado === 'Todos' || 
        (estado === 'Activo' && (v.estadoMatricula === 'Matrícula Activa' || v.estadoMatricula === 'Activo')) ||
        (estado === 'Inactivo' && v.estadoMatricula === 'Inactivo') ||
        v.estadoMatricula === estado;

      const matchTipo = tipo === 'Todos' || v.clase === tipo || v.tipoVehiculo === tipo;

      return matchTexto && matchEstado && matchTipo;
    });
  });

  // --------------------------------------------------------------------------
  // CARGA DE KPIS DEL DASHBOARD (GET /api/vehiculos/kpis)
  // --------------------------------------------------------------------------
  cargarKpis(): void {
    this.api.get<ApiResponse<any>>('/vehiculos/kpis', {}, 'AUTOMOTORES').pipe(
      catchError(err => {
        console.warn('Backend KPIs no disponible, usando métricas base:', err);
        return of(null);
      })
    ).subscribe(res => {
      if (res && res.data) {
        const d = res.data;
        this.kpis.set({
          vigenciaFiscal: d.vigenciaFiscalAnio ?? d.vigenciaFiscal ?? 2026,
          vigenciaEstado: d.vigenciaFiscalEstado ?? d.vigenciaEstado ?? 'ACTIVA',
          vigenciaFecha: d.vigenciaFiscalFechaInicio ?? d.vigenciaFecha ?? '01/01/2026',
          valorUvt: Number(d.valorUvt) || 49799,
          uvtVariacion: d.valorUvtIncremento ?? d.uvtVariacion ?? '+2.4%',
          uvtNorma: d.valorUvtReferencia ?? d.uvtNorma ?? 'Ord. 004-2026 — UVT_2026',
          sancionMinima: Number(d.sancionMinima) || 235000,
          sancionDescripcion: d.sancionMinimaDetalle ?? d.sancionDescripcion ?? 'Liquidaciones extemporáneas',
          auditadosHoy: Number(d.auditadosHoy) || 1420,
          auditadosUltimo: d.ultimaAuditoriaDetalle ?? d.auditadosUltimo ?? 'hace 2 min · admin_user',
          totalVehiculos: d.totalVehiculos ?? 0
        });
      }
    });
  }

  // --------------------------------------------------------------------------
  // CARGA DE VEHÍCULOS DESDE LA BASE DE DATOS (GET /api/vehiculos)
  // --------------------------------------------------------------------------
  cargarVehiculos(page: number = 1, pageSize: number = 20): void {
    this.loading.set(true);
    this.error.set(null);

    const params: Record<string, string | number> = {
      page: page,
      pageSize: pageSize
    };

    if (this.filtroTexto().trim()) {
      params['buscar'] = this.filtroTexto().trim();
    }
    if (this.filtroEstado() !== 'Todos') {
      params['estado'] = this.filtroEstado();
    }
    if (this.filtroTipo() !== 'Todos') {
      params['tipoVehiculo'] = this.filtroTipo();
    }

    this.api.get<ApiResponse<any>>('/vehiculos', { params }, 'AUTOMOTORES').pipe(
      catchError(err => {
        console.warn('Error cargando vehículos de la API, manteniendo lista local:', err);
        this.error.set('No se pudo conectar con el servidor de vehículos.');
        return of(null);
      })
    ).subscribe(res => {
      this.loading.set(false);
      if (res && res.data) {
        const rawItems = Array.isArray(res.data) ? res.data : (res.data.items || []);
        const total = res.data.totalCount ?? rawItems.length;
        const totalPags = res.data.totalPages ?? Math.ceil(total / pageSize);

        const mapped: VehiculoItem[] = rawItems.map((item: any, idx: number) => {
          let propietarioNombre = item.propietarioNombre || item.propietario?.nombre || 'Sin propietario asignado';
          let propietarioDoc = item.propietarioDocumento || item.propietario?.numeroDocumento || '';
          let tipoDoc = item.propietario?.tipoDocumento || 'CC';
          let tipoPersona = item.propietario?.tipoPersona || (propietarioDoc.includes('NIT') ? 'Jurídica' : 'Natural');

          if (item.propietarioDocumento && !item.propietario) {
            const partesDoc = item.propietarioDocumento.split('·');
            propietarioDoc = partesDoc[0]?.trim() || item.propietarioDocumento;
            if (partesDoc[1]) {
              tipoPersona = partesDoc[1].trim();
            }
          }

          return {
            id: item.id || idx + 1,
            placa: item.placa || '',
            marca: item.marca || '',
            linea: item.linea || '',
            modelo: Number(item.modelo) || 2024,
            cilindraje: Number(item.cilindraje) || 1600,
            tipoCombustible: item.combustible || item.tipoCombustible || 'Gasolina',
            combustible: item.combustible || item.tipoCombustible || 'Gasolina',
            clase: item.clase || item.tipoVehiculo || 'Automóvil',
            tipoVehiculo: item.tipoVehiculo || item.clase || 'Automóvil',
            color: item.color || 'Blanco',
            servicio: item.servicio || 'Particular',
            estadoMatricula: item.estadoMatricula || 'Matrícula Activa',
            estadoMatriculaId: item.estadoMatriculaId || 1,
            exencion: item.exencion || undefined,
            seleccionado: idx === 0,
            tituloFichaTecnica: item.tituloFichaTecnica || `${item.marca || ''} ${item.linea || ''}`.trim(),
            subtituloFichaTecnica: item.subtituloFichaTecnica,
            propietario: {
              nombre: propietarioNombre,
              tipoDocumento: tipoDoc,
              numeroDocumento: propietarioDoc,
              tipoPersona: tipoPersona
            }
          };
        });

        if (mapped.length > 0) {
          this.vehiculos.set(mapped);
          this.selectedVehiculo.set(mapped[0]);
          this.totalVehiculos.set(total);
        } else {
          this.vehiculos.set([]);
          this.selectedVehiculo.set(null);
          this.totalVehiculos.set(0);
        }
        this.paginaActual.set(page);
        this.pageSize.set(pageSize);
        this.totalPaginas.set(totalPags);
      }
    });
  }

  refrescarDashboard(): void {
    this.cargarKpis();
    this.cargarVehiculos(this.paginaActual(), this.pageSize());
  }

  setFiltroTexto(texto: string): void {
    this.filtroTexto.set(texto);
    this.cargarVehiculos(1, this.pageSize());
  }

  setFiltroEstado(estado: string): void {
    this.filtroEstado.set(estado);
    this.cargarVehiculos(1, this.pageSize());
  }

  setFiltroTipo(tipo: string): void {
    this.filtroTipo.set(tipo);
    this.cargarVehiculos(1, this.pageSize());
  }

  inactivarVehiculo(id: number): Observable<any> {
    return this.api.delete<ApiResponse<any>>(`/vehiculos/${id}`, {}, 'AUTOMOTORES').pipe(
      map(res => {
        this.refrescarDashboard();
        return res;
      })
    );
  }

  // --------------------------------------------------------------------------
  // CARGA DE CATÁLOGOS DESDE EL BACKEND
  // --------------------------------------------------------------------------
  cargarCatalogos(): void {
    if (this.catalogosLoaded() || this.catalogosLoading()) return;

    this.catalogosLoading.set(true);

    const defaultMarcas: CatalogoMarca[] = [
      { id: 1, nombre: 'TOYOTA' },
      { id: 2, nombre: 'CHEVROLET' },
      { id: 3, nombre: 'RENAULT' },
      { id: 4, nombre: 'MAZDA' },
      { id: 5, nombre: 'NISSAN' },
      { id: 6, nombre: 'HYUNDAI' },
      { id: 7, nombre: 'KIA' },
      { id: 8, nombre: 'FORD' },
      { id: 9, nombre: 'VOLKSWAGEN' },
      { id: 10, nombre: 'HONDA' },
      { id: 11, nombre: 'SUZUKI' },
      { id: 12, nombre: 'YAMAHA' },
      { id: 13, nombre: 'BAJAJ' }
    ];

    const defaultLineas: CatalogoLinea[] = [
      { id: 1, marcaNombre: 'TOYOTA', nombre: 'Corolla XEI', clase: 'Automóvil', cilindraje: 1987, combustible: 'Gasolina' },
      { id: 2, marcaNombre: 'TOYOTA', nombre: 'Corolla Cross', clase: 'Camioneta', cilindraje: 1987, combustible: 'Híbrido' },
      { id: 3, marcaNombre: 'TOYOTA', nombre: 'Hilux D/C 4x4', clase: 'Camioneta', cilindraje: 2755, combustible: 'Diesel' },
      { id: 4, marcaNombre: 'TOYOTA', nombre: 'RAV4', clase: 'Camioneta', cilindraje: 2487, combustible: 'Híbrido' },
      { id: 5, marcaNombre: 'TOYOTA', nombre: 'Land Cruiser Prado', clase: 'Camioneta', cilindraje: 3956, combustible: 'Gasolina' },
      { id: 6, marcaNombre: 'TOYOTA', nombre: 'Yaris', clase: 'Automóvil', cilindraje: 1496, combustible: 'Gasolina' },
      { id: 7, marcaNombre: 'CHEVROLET', nombre: 'Onix Turbo', clase: 'Automóvil', cilindraje: 999, combustible: 'Gasolina' },
      { id: 8, marcaNombre: 'CHEVROLET', nombre: 'Tracker Turbo', clase: 'Camioneta', cilindraje: 1200, combustible: 'Gasolina' },
      { id: 9, marcaNombre: 'CHEVROLET', nombre: 'Sail', clase: 'Automóvil', cilindraje: 1400, combustible: 'Gasolina' },
      { id: 10, marcaNombre: 'CHEVROLET', nombre: 'D-Max 4x4', clase: 'Camioneta', cilindraje: 2999, combustible: 'Diesel' },
      { id: 11, marcaNombre: 'RENAULT', nombre: 'Duster Zen', clase: 'Camioneta', cilindraje: 1600, combustible: 'Gasolina' },
      { id: 12, marcaNombre: 'RENAULT', nombre: 'Sandero Life', clase: 'Automóvil', cilindraje: 1598, combustible: 'Gasolina' },
      { id: 13, marcaNombre: 'RENAULT', nombre: 'Stepway Intens', clase: 'Camioneta', cilindraje: 1598, combustible: 'Gasolina' },
      { id: 14, marcaNombre: 'RENAULT', nombre: 'Logan Life', clase: 'Automóvil', cilindraje: 1598, combustible: 'Gasolina' },
      { id: 15, marcaNombre: 'RENAULT', nombre: 'Kwid', clase: 'Automóvil', cilindraje: 999, combustible: 'Gasolina' },
      { id: 16, marcaNombre: 'MAZDA', nombre: 'CX-5 Grand Touring', clase: 'Camioneta', cilindraje: 2488, combustible: 'Gasolina' },
      { id: 17, marcaNombre: 'MAZDA', nombre: 'CX-30 Grand Touring', clase: 'Camioneta', cilindraje: 1998, combustible: 'Gasolina' },
      { id: 18, marcaNombre: 'MAZDA', nombre: 'Mazda 3 Grand Touring', clase: 'Automóvil', cilindraje: 1998, combustible: 'Gasolina' },
      { id: 19, marcaNombre: 'MAZDA', nombre: 'Mazda 2 Touring', clase: 'Automóvil', cilindraje: 1496, combustible: 'Gasolina' },
      { id: 20, marcaNombre: 'HONDA', nombre: 'CB300R', clase: 'Motocicleta', cilindraje: 286, combustible: 'Gasolina' },
      { id: 21, marcaNombre: 'HONDA', nombre: 'CR-V', clase: 'Camioneta', cilindraje: 1498, combustible: 'Gasolina' },
      { id: 22, marcaNombre: 'HONDA', nombre: 'Civic', clase: 'Automóvil', cilindraje: 1996, combustible: 'Gasolina' },
      { id: 23, marcaNombre: 'HONDA', nombre: 'XR190L', clase: 'Motocicleta', cilindraje: 184, combustible: 'Gasolina' },
      { id: 24, marcaNombre: 'YAMAHA', nombre: 'FZ25', clase: 'Motocicleta', cilindraje: 249, combustible: 'Gasolina' },
      { id: 25, marcaNombre: 'YAMAHA', nombre: 'NMAX Connected', clase: 'Motocicleta', cilindraje: 155, combustible: 'Gasolina' },
      { id: 26, marcaNombre: 'YAMAHA', nombre: 'XTZ 250', clase: 'Motocicleta', cilindraje: 249, combustible: 'Gasolina' }
    ];

    const defaultEstados: CatalogoItem[] = [
      { id: 1, nombre: 'Activo' },
      { id: 2, nombre: 'Inactivo' },
      { id: 3, nombre: 'Traslado' }
    ];

    const defaultServicios: CatalogoItem[] = [
      { id: 1, nombre: 'Particular' },
      { id: 2, nombre: 'Público' },
      { id: 3, nombre: 'Oficial' },
      { id: 4, nombre: 'Diplomático' }
    ];

    const defaultVinculos: CatalogoItem[] = [
      { id: 1, nombre: 'Propietario' },
      { id: 2, nombre: 'Locatario' },
      { id: 3, nombre: 'Poseedor' }
    ];

    const defaultTiposVehiculo: CatalogoItem[] = [
      { id: 1, nombre: 'Automóvil' },
      { id: 2, nombre: 'Camioneta' },
      { id: 3, nombre: 'Motocicleta' },
      { id: 4, nombre: 'Bus' },
      { id: 5, nombre: 'Camión' }
    ];

    const defaultCombustibles: CatalogoItem[] = [
      { id: 1, nombre: 'Gasolina' },
      { id: 2, nombre: 'Diesel' },
      { id: 3, nombre: 'Gas' },
      { id: 4, nombre: 'Híbrido' },
      { id: 5, nombre: 'Eléctrico' }
    ];

    const defaultOrganismos: CatalogoItem[] = [
      { id: 1, nombre: 'Tránsito Municipal Popayán (19001)' },
      { id: 2, nombre: 'Secretaría de Tránsito Santander de Quilichao (19698)' }
    ];

    const defaultTiposDoc: CatalogoTipoDocumento[] = [
      { id: 1, codigo: 'CC', nombre: 'Cédula de Ciudadanía' },
      { id: 2, codigo: 'NIT', nombre: 'NIT' },
      { id: 3, codigo: 'CE', nombre: 'Cédula de Extranjería' },
      { id: 4, codigo: 'PA', nombre: 'Pasaporte' }
    ];

    const defaultNaturalezas: CatalogoNaturalezaJuridica[] = [
      { id: 1, codigo: 'PN', nombre: 'Persona Natural' },
      { id: 2, codigo: 'PJ', nombre: 'Persona Jurídica' }
    ];

    const defaultDepartamentos: CatalogoDepartamento[] = [
      { id: 19, codigo: '19', nombre: 'Cauca' },
      { id: 76, codigo: '76', nombre: 'Valle del Cauca' },
      { id: 52, codigo: '52', nombre: 'Nariño' },
      { id: 11, codigo: '11', nombre: 'Bogotá D.C.' },
      { id: 5, codigo: '05', nombre: 'Antioquia' },
      { id: 41, codigo: '41', nombre: 'Huila' },
      { id: 68, codigo: '68', nombre: 'Santander' },
      { id: 73, codigo: '73', nombre: 'Tolima' },
      { id: 66, codigo: '66', nombre: 'Risaralda' },
      { id: 63, codigo: '63', nombre: 'Quindío' },
      { id: 17, codigo: '17', nombre: 'Caldas' },
      { id: 8, codigo: '08', nombre: 'Atlántico' }
    ];

    const defaultCiudades: CatalogoCiudad[] = [
      { id: 19001, codigo: '19001', nombre: 'Popayán', departamentoId: 19 },
      { id: 19698, codigo: '19698', nombre: 'Santander de Quilichao', departamentoId: 19 },
      { id: 19573, codigo: '19573', nombre: 'Puerto Tejada', departamentoId: 19 },
      { id: 19532, codigo: '19532', nombre: 'Patía (El Bordo)', departamentoId: 19 },
      { id: 19548, codigo: '19548', nombre: 'Piendamó', departamentoId: 19 },
      { id: 19256, codigo: '19256', nombre: 'El Tambo', departamentoId: 19 },
      { id: 19100, codigo: '19100', nombre: 'Bolívar', departamentoId: 19 },
      { id: 19743, codigo: '19743', nombre: 'Silvia', departamentoId: 19 },
      { id: 19807, codigo: '19807', nombre: 'Timbío', departamentoId: 19 },
      { id: 19318, codigo: '19318', nombre: 'Guapi', departamentoId: 19 },
      { id: 76001, codigo: '76001', nombre: 'Cali', departamentoId: 76 },
      { id: 76520, codigo: '76520', nombre: 'Palmira', departamentoId: 76 },
      { id: 52001, codigo: '52001', nombre: 'Pasto', departamentoId: 52 },
      { id: 11001, codigo: '11001', nombre: 'Bogotá D.C.', departamentoId: 11 },
      { id: 5001, codigo: '05001', nombre: 'Medellín', departamentoId: 5 }
    ];

    if (this.catalogosLoaded() || this.catalogosLoading()) {
      return;
    }

    this.catalogosLoading.set(true);

    forkJoin({
      estados: this.api.get<ApiResponse<CatalogoItem[]>>('/catalogo/estados-matricula', {}, 'AUTOMOTORES').pipe(
        map(res => res.data?.length ? res.data : defaultEstados),
        catchError(() => of(defaultEstados))
      ),
      servicios: this.api.get<ApiResponse<CatalogoItem[]>>('/catalogo/servicios-vehiculo', {}, 'AUTOMOTORES').pipe(
        map(res => res.data?.length ? res.data : defaultServicios),
        catchError(() => of(defaultServicios))
      ),
      vinculos: this.api.get<ApiResponse<CatalogoItem[]>>('/catalogo/tipos-vinculo', {}, 'AUTOMOTORES').pipe(
        map(res => res.data?.length ? res.data : defaultVinculos),
        catchError(() => of(defaultVinculos))
      ),
      tiposVehiculo: this.api.get<ApiResponse<CatalogoItem[]>>('/catalogo/tipos-vehiculo', {}, 'AUTOMOTORES').pipe(
        map(res => res.data?.length ? res.data : defaultTiposVehiculo),
        catchError(() => of(defaultTiposVehiculo))
      ),
      combustibles: this.api.get<ApiResponse<CatalogoItem[]>>('/catalogo/combustibles', {}, 'AUTOMOTORES').pipe(
        map(res => res.data?.length ? res.data : defaultCombustibles),
        catchError(() => of(defaultCombustibles))
      ),
      organismos: this.api.get<ApiResponse<CatalogoItem[]>>('/catalogo/organismos-transito', {}, 'AUTOMOTORES').pipe(
        map(res => res.data?.length ? res.data : defaultOrganismos),
        catchError(() => of(defaultOrganismos))
      ),
      tiposDoc: this.api.get<ApiResponse<CatalogoTipoDocumento[]>>('/catalogo/tipos-documento', {}, 'AUTOMOTORES').pipe(
        map(res => res.data?.length ? res.data : defaultTiposDoc),
        catchError(() => of(defaultTiposDoc))
      ),
      naturalezas: this.api.get<ApiResponse<CatalogoNaturalezaJuridica[]>>('/catalogo/naturalezas-juridicas', {}, 'AUTOMOTORES').pipe(
        map(res => res.data?.length ? res.data : defaultNaturalezas),
        catchError(() => of(defaultNaturalezas))
      ),
      departamentos: this.api.get<any>('/departamentos', {}, 'AUTOMOTORES').pipe(
        map(res => (res?.data?.length ? res.data : (Array.isArray(res) && res.length ? res : defaultDepartamentos))),
        catchError(() => of(defaultDepartamentos))
      )
    }).subscribe({
      next: (results) => {
        this.marcas.set(defaultMarcas);
        this.estadosMatricula.set(results.estados);
        this.serviciosVehiculo.set(results.servicios);
        this.tiposVinculo.set(results.vinculos);
        this.tiposVehiculo.set(results.tiposVehiculo);
        this.combustibles.set(results.combustibles);
        this.organismosTransito.set(results.organismos);
        this.tiposDocumento.set(results.tiposDoc);
        this.naturalezasJuridicas.set(results.naturalezas);
        this.departamentos.set(results.departamentos);
        this.ciudades.set(defaultCiudades);
        this.catalogosLoaded.set(true);
        this.catalogosLoading.set(false);
      },
      error: () => {
        this.marcas.set(defaultMarcas);
        this.lineas.set(defaultLineas);
        this.estadosMatricula.set(defaultEstados);
        this.serviciosVehiculo.set(defaultServicios);
        this.tiposVinculo.set(defaultVinculos);
        this.tiposVehiculo.set(defaultTiposVehiculo);
        this.combustibles.set(defaultCombustibles);
        this.organismosTransito.set(defaultOrganismos);
        this.tiposDocumento.set(defaultTiposDoc);
        this.naturalezasJuridicas.set(defaultNaturalezas);
        this.departamentos.set(defaultDepartamentos);
        this.ciudades.set(defaultCiudades);
        this.catalogosLoaded.set(true);
        this.catalogosLoading.set(false);
      }
    });
  }

  cargarCiudadesPorDepartamento(departamentoId: number): void {
    if (!departamentoId) {
      this.ciudadesDisponibles.set([]);
      return;
    }

    this.api.get<any>(`/departamentos/${departamentoId}/ciudades`, {}, 'AUTOMOTORES').pipe(
      catchError(() => of(null))
    ).subscribe(res => {
      const data = res?.data || (Array.isArray(res) ? res : null);
      if (data && data.length > 0) {
        this.ciudadesDisponibles.set(data);
      } else {
        const filtradas = this.ciudades().filter(c => c.departamentoId == departamentoId);
        this.ciudadesDisponibles.set(filtradas);
      }
    });
  }

  cargarMarcasPorTipo(tipoVehiculo?: string): void {
    const params: Record<string, string> = {};
    if (tipoVehiculo?.trim()) {
      params['tipoVehiculo'] = tipoVehiculo.trim();
    }

    this.api.get<ApiResponse<CatalogoMarca[]>>('/catalogo/marcas', { params }, 'AUTOMOTORES').pipe(
      catchError(() => of({ data: [] as CatalogoMarca[] }))
    ).subscribe(res => {
      if (res?.data && res.data.length > 0) {
        this.marcas.set(res.data);
      }
    });
  }

  cargarLineasPorMarca(marcaNombre: string, tipoVehiculo?: string): void {
    const marcaNorm = (marcaNombre || '').toUpperCase().trim();
    if (!marcaNorm) {
      this.lineasDisponibles.set([]);
      return;
    }
    
    const params: Record<string, string> = { marca: marcaNorm };
    if (tipoVehiculo?.trim()) {
      params['tipoVehiculo'] = tipoVehiculo.trim();
    }

    // Consulta al backend por la marca y tipo seleccionados
    this.api.get<ApiResponse<CatalogoLinea[]>>('/catalogo/lineas', { params }, 'AUTOMOTORES').pipe(
      catchError(() => of({ data: [] as CatalogoLinea[] }))
    ).subscribe(res => {
      if (res?.data && res.data.length > 0) {
        this.lineasDisponibles.set(res.data);
      } else {
        const filtradas = this.lineas().filter(l => (l.marcaNombre || '').toUpperCase() === marcaNorm);
        this.lineasDisponibles.set(filtradas);
      }
    });
  }

  // --------------------------------------------------------------------------
  // BÚSQUEDA DE PROPIETARIO POR DOCUMENTO (GET /api/propietarios/documento/...)
  // --------------------------------------------------------------------------
  buscarPropietario(tipo: string | number, numero: string): Observable<any> {
    const numLimpio = (numero || '').replace(/[^0-9a-zA-Z]/g, '').trim();
    if (!numLimpio) {
      this.propietarioEncontrado.set(null);
      this.busquedaRealizada.set(false);
      return of(null);
    }

    this.buscandoPropietario.set(true);
    this.busquedaRealizada.set(true);

    return this.api.get<ApiResponse<any>>(`/propietarios/documento/${tipo}/${numLimpio}`, {}, 'AUTOMOTORES').pipe(
      map(res => {
        this.buscandoPropietario.set(false);
        const data = res.data || res;
        this.propietarioEncontrado.set(data);
        return data;
      }),
      catchError(() => {
        this.buscandoPropietario.set(false);
        this.propietarioEncontrado.set(null);
        return of(null);
      })
    );
  }

  limpiarBusquedaPropietario(): void {
    this.propietarioEncontrado.set(null);
    this.busquedaRealizada.set(false);
  }

  // --------------------------------------------------------------------------
  // CREACIÓN DE VEHÍCULO (POST /api/vehiculos)
  // --------------------------------------------------------------------------
  crearVehiculo(payload: RegistrarVehiculoDto): Observable<ApiResponse<any>> {
    this.registroLoading.set(true);
    return this.api.post<ApiResponse<any>>('/vehiculos', payload, {}, 'AUTOMOTORES').pipe(
      map(res => {
        this.registroLoading.set(false);
        return res;
      }),
      catchError(err => {
        this.registroLoading.set(false);
        throw err;
      })
    );
  }

  // Métodos de Control Registro
  abrirRegistro(): void {
    this.cargarCatalogos();
    this.isNuevoRegistro.set(true);
    this.currentStep.set(1);
    this.activeTab.set(this.tabs()[0]);
    this.isDrawerOpen.set(true);
  }

  abrirExpediente(v: VehiculoItem): void {
    this.cargarCatalogos();
    this.seleccionarVehiculo(v);
    this.isNuevoRegistro.set(false);
    this.currentStep.set(1);
    this.activeTab.set(this.tabs()[0]);
    this.isDrawerOpen.set(true);
  }

  cerrarRegistro(): void {
    this.isDrawerOpen.set(false);
  }

  // Métodos de Control RUNT
  abrirRunt(placa?: string): void {
    if (placa) {
      this.placaRunt.set(placa.replace(/[^a-zA-Z0-9]/g, '').toUpperCase());
    } else {
      this.placaRunt.set('');
    }
    this.isRuntModalOpen.set(true);
  }

  cerrarRunt(): void {
    this.isRuntModalOpen.set(false);
  }

  consultarRunt(): void {
    const placa = this.placaRunt().trim();
    if (!placa) return;

    this.runtLoading.set(true);
    setTimeout(() => {
      this.runtLoading.set(false);
      this.cerrarRunt();
      const found = this.vehiculos().find(v => v.placa.replace('-', '').toUpperCase() === placa.toUpperCase());
      if (found) {
        this.seleccionarVehiculo(found);
      }
    }, 600);
  }

  setStep(stepNumber: number): void {
    const list = this.tabs();
    if (stepNumber >= 1 && stepNumber <= list.length) {
      this.currentStep.set(stepNumber);
      this.activeTab.set(list[stepNumber - 1]);
    }
  }

  setTab(tabName: string): void {
    const list = this.tabs();
    const idx = list.indexOf(tabName);
    if (idx !== -1) {
      this.currentStep.set(idx + 1);
      this.activeTab.set(tabName);
    }
  }

  siguientePaso(): void {
    if (this.currentStep() < this.tabs().length) {
      this.setStep(this.currentStep() + 1);
    }
  }

  anteriorPaso(): void {
    if (this.currentStep() > 1) {
      this.setStep(this.currentStep() - 1);
    }
  }

  seleccionarVehiculo(v: VehiculoItem): void {
    this.vehiculos.update(list => list.map(item => ({
      ...item,
      seleccionado: item.id === v.id
    })));
    this.selectedVehiculo.set(v);
  }

  deseleccionarVehiculo(): void {
    this.vehiculos.update(list => list.map(item => ({
      ...item,
      seleccionado: false
    })));
    this.selectedVehiculo.set(null);
  }
}
