import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { VehiculosApiService } from '../../../infrastructure/api/vehiculos-api.service';
import { VehiculoItem } from '../../../domain/models/vehiculo.model';

@Injectable({
  providedIn: 'root',
})
export class VehiculosListFacade {
  private vehiculosApi = inject(VehiculosApiService);

  readonly vehiculos = signal<VehiculoItem[]>([]);
  readonly totalVehiculos = signal<number>(0);
  readonly paginaActual = signal<number>(1);
  readonly pageSize = signal<number>(10);
  readonly totalPaginas = signal<number>(1);

  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // Filtros de búsqueda
  readonly filtroTexto = signal<string>('');
  readonly filtroEstado = signal<string>('Todos');
  readonly filtroTipo = signal<string>('Todos');
  readonly filtroOrden = signal<'recientes' | 'antiguos' | 'alfa_asc' | 'alfa_desc'>('recientes');

  // Expediente seleccionado y panel lateral
  readonly selectedVehiculo = signal<VehiculoItem | null>(null);
  readonly expedienteActual = signal<any | null>(null);
  readonly expedienteLoading = signal<boolean>(false);
  readonly panelTab = signal<'ficha' | 'propietarios' | 'valores'>('ficha');

  readonly paginasDisponibles = computed(() => {
    const total = this.totalPaginas();
    const actual = this.paginaActual();
    if (total <= 1) return [1];

    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages: number[] = [];
    const start = Math.max(1, actual - 2);
    const end = Math.min(total, actual + 2);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  });

  readonly filteredVehiculos = computed(() => {
    const texto = this.filtroTexto().toLowerCase().trim();
    const estado = this.filtroEstado();
    const tipo = this.filtroTipo();
    const orden = this.filtroOrden();

    const normalize = (str?: string | null) => {
      if (!str) return '';
      return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
    };

    const normTipo = normalize(tipo);
    const raizTipo = normTipo.length > 4 && normTipo.endsWith('es') 
      ? normTipo.slice(0, -2) 
      : (normTipo.length > 4 && normTipo.endsWith('s') ? normTipo.slice(0, -1) : normTipo);

    const filtrados = this.vehiculos().filter(v => {
      const matchTexto = !texto || 
        (v.placa && v.placa.toLowerCase().includes(texto)) ||
        (v.propietario?.nombre && v.propietario.nombre.toLowerCase().includes(texto)) ||
        (v.propietario?.numeroDocumento && v.propietario.numeroDocumento.toLowerCase().includes(texto)) ||
        (v.marca && v.marca.toLowerCase().includes(texto)) ||
        (v.linea && v.linea.toLowerCase().includes(texto)) ||
        (v.tituloFichaTecnica && v.tituloFichaTecnica.toLowerCase().includes(texto));

      const vEstadoNorm = normalize(v.estadoMatricula);
      const isActivo = v.estadoMatriculaId === 1 || v.estadoMatriculaId === 0 || (vEstadoNorm.includes('activ') && !vEstadoNorm.includes('inactiv'));
      const matchEstado = estado === 'Todos' || 
        (estado === 'Activo' && isActivo) ||
        (estado === 'Inactivo' && !isActivo) ||
        (vEstadoNorm === normalize(estado));

      const vClaseNorm = normalize(v.clase);
      const vTipoNorm = normalize(v.tipoVehiculo);
      const matchTipo = tipo === 'Todos' || 
        (normTipo.length > 0 && (
          vClaseNorm.includes(normTipo) || vTipoNorm.includes(normTipo) || 
          vClaseNorm.includes(raizTipo) || vTipoNorm.includes(raizTipo) ||
          normTipo.includes(vClaseNorm) || normTipo.includes(vTipoNorm)
        ));

      return matchTexto && matchEstado && matchTipo;
    });

    return filtrados.slice().sort((a, b) => {
      if (orden === 'recientes') {
        const fechaA = a.fechaMatricula ? new Date(a.fechaMatricula).getTime() : 0;
        const fechaB = b.fechaMatricula ? new Date(b.fechaMatricula).getTime() : 0;
        if (fechaA > 0 && fechaB > 0 && fechaA !== fechaB) return fechaB - fechaA;
        if (b.modelo !== a.modelo) return (b.modelo || 0) - (a.modelo || 0);
        return (b.id || 0) - (a.id || 0);
      }
      if (orden === 'antiguos') {
        const fechaA = a.fechaMatricula ? new Date(a.fechaMatricula).getTime() : 0;
        const fechaB = b.fechaMatricula ? new Date(b.fechaMatricula).getTime() : 0;
        if (fechaA > 0 && fechaB > 0 && fechaA !== fechaB) return fechaA - fechaB;
        if (a.modelo !== b.modelo) return (a.modelo || 0) - (b.modelo || 0);
        return (a.id || 0) - (b.id || 0);
      }
      if (orden === 'alfa_asc') {
        const strA = (a.placa || a.marca || '').trim();
        const strB = (b.placa || b.marca || '').trim();
        return strA.localeCompare(strB, 'es', { sensitivity: 'base' });
      }
      if (orden === 'alfa_desc') {
        const strA = (a.placa || a.marca || '').trim();
        const strB = (b.placa || b.marca || '').trim();
        return strB.localeCompare(strA, 'es', { sensitivity: 'base' });
      }
      return 0;
    });
  });

  cargarVehiculos(page: number = 1, pageSize?: number): void {
    this.loading.set(true);
    this.error.set(null);

    const size = pageSize ?? this.pageSize();

    const filtros = {
      page,
      pageSize: size,
      buscar: this.filtroTexto().trim() || undefined,
      estado: this.filtroEstado(),
      tipoVehiculo: this.filtroTipo()
    };

    this.vehiculosApi.getVehiculos(filtros).pipe(
      catchError((err: any) => {
        console.warn('Error cargando vehículos de la API, manteniendo lista local:', err);
        this.error.set('No se pudo conectar con el servidor de vehículos.');
        return of(null);
      })
    ).subscribe((res: any) => {
      this.loading.set(false);
      if (res && res.data) {
        const isPaged = !Array.isArray(res.data) && res.data.items !== undefined;
        const rawItems: any[] = isPaged ? (res.data.items || []) : (Array.isArray(res.data) ? res.data : []);
        const total = isPaged ? (res.data.totalCount ?? rawItems.length) : rawItems.length;
        const totalPags = (isPaged && res.data.totalPages)
          ? res.data.totalPages
          : Math.max(1, Math.ceil(total / size));

        const mapped: VehiculoItem[] = this.mapearItemsVehiculo(rawItems);

        this.vehiculos.set(mapped);
        this.selectedVehiculo.set(null);
        this.totalVehiculos.set(total);
        this.paginaActual.set(page);
        this.pageSize.set(size);
        this.totalPaginas.set(totalPags);
      }
    });
  }

  cambiarPagina(nuevaPagina: number): void {
    if (this.loading()) return;
    if (nuevaPagina < 1 || nuevaPagina > this.totalPaginas()) return;
    if (this.totalVehiculos() === 0) return;
    this.cargarVehiculos(nuevaPagina, this.pageSize());
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

  setFiltroOrden(orden: 'recientes' | 'antiguos' | 'alfa_asc' | 'alfa_desc'): void {
    this.filtroOrden.set(orden);
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

  cargarExpediente(id: number): Observable<any> {
    this.expedienteLoading.set(true);
    return this.vehiculosApi.getExpedienteById(id).pipe(
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

  private mapearItemsVehiculo(rawItems: any[]): VehiculoItem[] {
    return rawItems.map((item: any, idx: number) => {
      let propietarioNombre = item.propietarioNombre || item.propietario?.nombre || 'Sin propietario asignado';
      let tipoDoc = 'CC';
      let numDoc = '';
      let tipoPersona = 'Natural';

      if (item.propietarioDocumento) {
        const partesDoc = String(item.propietarioDocumento).split('·').map((s: string) => s.trim());
        const docRaw = partesDoc[0] || '';
        if (partesDoc[1]) {
          tipoPersona = partesDoc[1];
        } else if (docRaw.toUpperCase().includes('NIT')) {
          tipoPersona = 'Jurídica';
        }

        const tokens = docRaw.split(/\s+/).filter(Boolean);
        const knownTypes = ['CC', 'NIT', 'CE', 'TI', 'PA', 'PAS', 'RC'];
        const typesFound: string[] = [];
        const numbersFound: string[] = [];

        for (const token of tokens) {
          if (knownTypes.includes(token.toUpperCase())) {
            typesFound.push(token.toUpperCase());
          } else {
            numbersFound.push(token);
          }
        }

        if (typesFound.length > 0) {
          tipoDoc = typesFound[typesFound.length - 1];
        } else {
          tipoDoc = item.propietario?.tipoDocumento || (tipoPersona === 'Jurídica' ? 'NIT' : 'CC');
        }

        numDoc = numbersFound.join(' ');
        if (!numDoc && tokens.length > 0) {
          numDoc = tokens[tokens.length - 1];
        }
      } else if (item.propietario) {
        tipoDoc = item.propietario.tipoDocumento || 'CC';
        numDoc = item.propietario.numeroDocumento || '';
        tipoPersona = item.propietario.tipoPersona || (tipoDoc === 'NIT' ? 'Jurídica' : 'Natural');
      }

      const docCompleto = numDoc ? `${tipoDoc} ${numDoc}`.trim() : (propietarioNombre !== 'Sin propietario asignado' ? 'Sin documento' : '');

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
        propietarioId: item.propietarioId,
        propietarioNombre: propietarioNombre,
        propietarioDocumento: docCompleto,
        propietarios: item.propietarios || [],
        propietario: {
          nombre: propietarioNombre,
          tipoDocumento: tipoDoc,
          numeroDocumento: docCompleto,
          tipoPersona: tipoPersona
        }
      };
    });
  }
}
