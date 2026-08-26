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
    sancionMinima: 497990,
    sancionDescripcion: 'Liquidaciones extemporáneas (10 UVTs)',
    auditadosHoy: 1420,
    auditadosUltimo: 'hace 2 min · admin_user',
    totalVehiculos: 0,
    totalPendientesAprobacion: 0
  });

  // Modal y Gestión de Vehículos Pendientes de Aprobación
  readonly vehiculosPendientesAprobacion = signal<VehiculoItem[]>([]);
  readonly isModalPendientesOpen = signal<boolean>(false);
  readonly cargandoPendientes = signal<boolean>(false);

  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // Filtros de búsqueda
  readonly filtroTexto = signal<string>('');
  readonly filtroEstado = signal<string>('Todos');
  readonly filtroTipo = signal<string>('Todos');

  // Catálogos para el Wizard (Cargados 100% en tiempo real desde la Base de Datos SQL Server)
  readonly marcas = signal<CatalogoMarca[]>([]);
  readonly marcasDisponibles = signal<CatalogoMarca[]>([]);
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
  readonly expedienteActual = signal<any | null>(null);
  readonly expedienteLoading = signal<boolean>(false);
  readonly panelTab = signal<'ficha' | 'propietarios' | 'valores'>('ficha');

  // Modal de Consulta RUNT
  readonly isRuntModalOpen = signal<boolean>(false);
  readonly placaRunt = signal<string>('');
  readonly runtLoading = signal<boolean>(false);

  // Modal de Confirmación de Inactivación
  readonly isInactivarModalOpen = signal<boolean>(false);
  readonly vehiculoAInactivar = signal<VehiculoItem | null>(null);
  readonly inactivandoLoading = signal<boolean>(false);

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
          sancionMinima: Number(d.sancionMinima) || (Number(d.valorUvt) ? Number(d.valorUvt) * 10 : 497990),
          sancionDescripcion: d.sancionMinimaDetalle ?? d.sancionDescripcion ?? 'Liquidaciones extemporáneas (10 UVTs)',
          auditadosHoy: Number(d.auditadosHoy) || 1420,
          auditadosUltimo: d.ultimaAuditoriaDetalle ?? d.auditadosUltimo ?? 'hace 2 min · admin_user',
          totalVehiculos: d.totalVehiculos ?? 0,
          totalVehiculosActivos: d.totalVehiculosActivos ?? 0,
          totalVehiculosInactivos: d.totalVehiculosInactivos ?? 0,
          totalPendientesAprobacion: d.totalPendientesAprobacion ?? 0
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
            pasajeros: item.pasajeros ? Number(item.pasajeros) : undefined,
            organismoTransito: item.organismoTransito || item.organismoTransitoNombre || undefined,
            organismoTransitoId: item.organismoTransitoId || undefined,
            fechaMatricula: item.fechaMatricula || undefined,
            estadoMatricula: item.estadoMatricula || 'Matrícula Activa',
            estadoMatriculaId: item.estadoMatriculaId || 1,
            exencion: item.exencion || undefined,
            seleccionado: false,
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
          this.selectedVehiculo.set(null);
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
    this.cargarPendientesAprobacion();
  }

  cargarPendientesAprobacion(): void {
    this.cargandoPendientes.set(true);
    this.api.get<ApiResponse<any[]>>('/vehiculos/pendientes-aprobacion', {}, 'AUTOMOTORES').pipe(
      catchError(err => {
        console.warn('Error al cargar vehículos pendientes de aprobación:', err);
        this.cargandoPendientes.set(false);
        return of(null);
      })
    ).subscribe(res => {
      this.cargandoPendientes.set(false);
      if (res && res.data) {
        const mapped: VehiculoItem[] = res.data.map((item: any) => ({
          id: item.id,
          placa: item.placa || '',
          marca: item.marca || '',
          linea: item.linea || '',
          modelo: item.modelo || 2024,
          cilindraje: item.cilindraje || 1600,
          combustible: item.combustible || 'Gasolina',
          tipoVehiculo: item.tipoVehiculo || 'Automóvil',
          clase: item.clase || 'Automóvil',
          servicio: item.servicio || 'Particular',
          estadoMatricula: item.estadoMatricula || 'Pendiente',
          estadoMatriculaId: item.estadoMatriculaId || 2,
          estadoAprobacion: item.estadoAprobacion || 'PENDIENTE',
          propietario: {
            nombre: item.propietarioNombre || 'Propietario Pendiente',
            tipoDocumento: 'CC',
            numeroDocumento: item.propietarioDocumento || 'Pendiente'
          },
          propietarioNombre: item.propietarioNombre,
          propietarioDocumento: item.propietarioDocumento
        }));
        this.vehiculosPendientesAprobacion.set(mapped);
        this.kpis.update(k => ({ ...k, totalPendientesAprobacion: mapped.length }));
      }
    });
  }

  abrirModalPendientes(): void {
    this.isModalPendientesOpen.set(true);
    this.cargarPendientesAprobacion();
  }

  cerrarModalPendientes(): void {
    this.isModalPendientesOpen.set(false);
  }

  cambiarEstadoAprobacion(id: number, nuevoEstado: string): Observable<any> {
    return this.api.put<ApiResponse<any>>(`/vehiculos/${id}/estado-aprobacion?nuevoEstado=${nuevoEstado}`, {}, {}, 'AUTOMOTORES').pipe(
      map(res => {
        this.cargarPendientesAprobacion();
        this.refrescarDashboard();
        return res;
      })
    );
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
  // --------------------------------------------------------------------------
  // CARGA DE CATÁLOGOS DESDE EL BACKEND (100% REAL-TIME DESDE SQL SERVER)
  // --------------------------------------------------------------------------
  cargarCatalogos(): void {
    if (this.catalogosLoaded() || this.catalogosLoading()) return;

    this.catalogosLoading.set(true);

    forkJoin({
      todos: this.api.get<ApiResponse<any>>('/catalogo/todos', {}, 'AUTOMOTORES').pipe(
        map(res => res?.data || {}),
        catchError(() => of({}))
      ),
      departamentos: this.api.get<any>('/departamentos', {}, 'AUTOMOTORES').pipe(
        map(res => (res?.data ? res.data : (Array.isArray(res) ? res : []))),
        catchError(() => of([] as CatalogoDepartamento[]))
      )
    }).subscribe({
      next: (results) => {
        const t = results.todos;
        this.estadosMatricula.set(t.estadosMatricula || []);
        this.serviciosVehiculo.set(t.serviciosVehiculo || []);
        this.tiposVinculo.set(t.tiposVinculo || []);
        this.tiposVehiculo.set(t.tiposVehiculo || []);
        this.combustibles.set(t.combustibles || []);
        this.organismosTransito.set(t.organismosTransito || []);
        this.tiposDocumento.set(t.tiposDocumento || []);
        this.naturalezasJuridicas.set(t.naturalezasJuridicas || []);
        this.departamentos.set(results.departamentos || []);
        this.catalogosLoaded.set(true);
        this.catalogosLoading.set(false);
      },
      error: (err) => {
        console.error('Error cargando catálogos unificados:', err);
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
      const data = res?.data || (Array.isArray(res) ? res : []);
      this.ciudadesDisponibles.set(data);
    });
  }

  cargarMarcasPorTipo(tipoVehiculo?: string): void {
    if (!tipoVehiculo?.trim()) {
      this.marcasDisponibles.set([]);
      this.lineasDisponibles.set([]);
      return;
    }

    const params: Record<string, string> = { tipoVehiculo: tipoVehiculo.trim() };

    this.api.get<ApiResponse<CatalogoMarca[]>>('/catalogo/marcas', { params }, 'AUTOMOTORES').pipe(
      catchError(() => of({ data: [] as CatalogoMarca[] }))
    ).subscribe(res => {
      this.marcasDisponibles.set(res?.data || []);
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

    this.api.get<ApiResponse<CatalogoLinea[]>>('/catalogo/lineas', { params }, 'AUTOMOTORES').pipe(
      catchError(() => of({ data: [] as CatalogoLinea[] }))
    ).subscribe(res => {
      this.lineasDisponibles.set(res?.data || []);
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

  verificarPlacaExistente(placa: string): Observable<boolean> {
    if (!placa || !placa.trim()) return of(false);
    return this.api.get<ApiResponse<any>>(`/vehiculos/placa/${placa.trim()}`, {}, 'AUTOMOTORES').pipe(
      map(res => !!(res && res.success && res.data)),
      catchError(() => of(false))
    );
  }

  // --------------------------------------------------------------------------
  // ACTUALIZACIÓN DE VEHÍCULO (PUT /api/vehiculos/{id})
  // --------------------------------------------------------------------------
  actualizarVehiculo(id: number, payload: any): Observable<ApiResponse<any>> {
    this.registroLoading.set(true);
    return this.api.put<ApiResponse<any>>(`/vehiculos/${id}`, payload, {}, 'AUTOMOTORES').pipe(
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

  cargarExpediente(id: number): Observable<any> {
    this.expedienteLoading.set(true);
    return this.api.get<ApiResponse<any>>(`/vehiculos/${id}/expediente`, {}, 'AUTOMOTORES').pipe(
      map(res => {
        this.expedienteLoading.set(false);
        const data = res.data || res;
        this.expedienteActual.set(data);
        return data;
      }),
      catchError(err => {
        this.expedienteLoading.set(false);
        console.warn('Error cargando expediente:', err);
        return of(null);
      })
    );
  }

  seleccionarVehiculo(v: VehiculoItem): void {
    this.vehiculos.update(list => list.map(item => ({
      ...item,
      seleccionado: item.id === v.id
    })));
    this.selectedVehiculo.set(v);
    if (v.id) {
      this.cargarExpediente(v.id).subscribe();
    }
  }

  deseleccionarVehiculo(): void {
    this.vehiculos.update(list => list.map(item => ({
      ...item,
      seleccionado: false
    })));
    this.selectedVehiculo.set(null);
    this.expedienteActual.set(null);
  }

  abrirInactivar(v: VehiculoItem): void {
    this.vehiculoAInactivar.set(v);
    this.isInactivarModalOpen.set(true);
  }

  cerrarInactivar(): void {
    this.isInactivarModalOpen.set(false);
    this.vehiculoAInactivar.set(null);
  }

  confirmarInactivacion(): void {
    const v = this.vehiculoAInactivar();
    if (!v || !v.id) return;

    this.inactivandoLoading.set(true);
    this.api.delete<ApiResponse<any>>(`/vehiculos/${v.id}`, {}, 'AUTOMOTORES').subscribe({
      next: (res) => {
        this.inactivandoLoading.set(false);
        this.cerrarInactivar();
        this.refrescarDashboard();
      },
      error: (err) => {
        console.error('Error al inactivar vehículo:', err);
        this.inactivandoLoading.set(false);
      }
    });
  }
}
