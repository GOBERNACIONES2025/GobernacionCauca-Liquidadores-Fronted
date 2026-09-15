import { Injectable, inject, signal, computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import * as XLSX from 'xlsx';
import { ReportesApiService } from '../../infrastructure/api/reportes-api.service';
import { TipoReporte, ReporteVehiculoFiltros, ReporteContribuyenteFiltros } from '../../domain/models/reporte.model';
import { VehiculoItemDto } from '../../domain/interfaces/vehiculo.interface';
import { PropietarioDto } from '../../domain/interfaces/propietario.interface';

@Injectable({
  providedIn: 'root'
})
export class ReportesFacade {
  private reportesApi = inject(ReportesApiService);

  // Tab activo
  readonly activeTab = signal<TipoReporte>('VEHICULOS');

  // Estado general
  readonly loading = signal<boolean>(false);
  readonly descargandoExcel = signal<boolean>(false);
  readonly mensajeFeedback = signal<{ tipo: 'success' | 'error' | 'info'; texto: string } | null>(null);

  // Paginación (10 registros por página según lineamiento de UX)
  readonly pageSize = signal<number>(10);

  // ── Sección Vehículos ───────────────────────────────────────────
  readonly vehiculos = signal<VehiculoItemDto[]>([]);
  readonly totalVehiculos = signal<number>(0);
  readonly paginaVehiculos = signal<number>(1);

  readonly filtroVehiculoTexto = signal<string>('');
  readonly filtroVehiculoEstado = signal<string>('Todos');
  readonly filtroVehiculoTipo = signal<string>('Todos');

  // ── Sección Contribuyentes ──────────────────────────────────────
  readonly contribuyentes = signal<PropietarioDto[]>([]);
  readonly totalContribuyentes = signal<number>(0);
  readonly paginaContribuyentes = signal<number>(1);

  readonly filtroContribuyenteTexto = signal<string>('');
  readonly filtroContribuyenteEstado = signal<string>('Todos');
  readonly filtroContribuyenteNaturaleza = signal<number>(0);
  readonly filtroContribuyenteSituacion = signal<string>('Todos');

  // ── Computados de Paginación ────────────────────────────────────
  readonly paginaActual = computed(() => {
    return this.activeTab() === 'VEHICULOS' 
      ? this.paginaVehiculos() 
      : this.paginaContribuyentes();
  });

  readonly totalRegistros = computed(() => {
    return this.activeTab() === 'VEHICULOS' 
      ? this.totalVehiculos() 
      : this.totalContribuyentes();
  });

  readonly totalPaginas = computed(() => {
    const total = this.totalRegistros();
    const size = this.pageSize();
    return Math.max(1, Math.ceil(total / size));
  });

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

  // ── Inicialización y Carga ──────────────────────────────────────
  constructor() {
    this.cargarDatos();
  }

  cambiarTab(tab: TipoReporte): void {
    if (this.activeTab() === tab) return;
    this.activeTab.set(tab);
    this.cargarDatos();
  }

  async cargarDatos(): Promise<void> {
    this.loading.set(true);
    this.mensajeFeedback.set(null);

    try {
      if (this.activeTab() === 'VEHICULOS') {
        await this.cargarVehiculos();
      } else {
        await this.cargarContribuyentes();
      }
    } catch (error) {
      console.error('Error al cargar previsualización de reporte:', error);
      this.mensajeFeedback.set({
        tipo: 'error',
        texto: 'No fue posible cargar los datos de previsualización. Intenta nuevamente.'
      });
    } finally {
      this.loading.set(false);
    }
  }

  private async cargarVehiculos(): Promise<void> {
    const filtros: ReporteVehiculoFiltros = {
      buscar: this.filtroVehiculoTexto(),
      estado: this.filtroVehiculoEstado(),
      tipoVehiculo: this.filtroVehiculoTipo(),
      page: this.paginaVehiculos(),
      pageSize: this.pageSize()
    };

    const resp = await firstValueFrom(this.reportesApi.getVehiculosPreview(filtros));
    if (resp?.data) {
      this.vehiculos.set(resp.data.items || []);
      this.totalVehiculos.set(resp.data.totalCount || 0);
    } else {
      this.vehiculos.set([]);
      this.totalVehiculos.set(0);
    }
  }

  private async cargarContribuyentes(): Promise<void> {
    const filtros: ReporteContribuyenteFiltros = {
      buscar: this.filtroContribuyenteTexto(),
      estado: this.filtroContribuyenteEstado(),
      page: this.paginaContribuyentes(),
      pageSize: this.pageSize()
    };

    const resp = await firstValueFrom(this.reportesApi.getContribuyentesPreview(filtros));
    if (resp?.data) {
      let items = resp.data.items || [];

      // Filtros adicionales en memoria para naturaleza o situación si aplica
      if (this.filtroContribuyenteNaturaleza() > 0) {
        items = items.filter(c => c.naturalezaJuridicaId === this.filtroContribuyenteNaturaleza());
      }
      if (this.filtroContribuyenteSituacion() === 'Al Día') {
        items = items.filter(c => (c.cantidadDeudas || 0) === 0);
      } else if (this.filtroContribuyenteSituacion() === 'Con Deuda') {
        items = items.filter(c => (c.cantidadDeudas || 0) > 0);
      }

      this.contribuyentes.set(items);
      this.totalContribuyentes.set(resp.data.totalCount || 0);
    } else {
      this.contribuyentes.set([]);
      this.totalContribuyentes.set(0);
    }
  }

  cambiarPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas()) return;

    if (this.activeTab() === 'VEHICULOS') {
      this.paginaVehiculos.set(pagina);
    } else {
      this.paginaContribuyentes.set(pagina);
    }
    this.cargarDatos();
  }

  aplicarFiltros(): void {
    if (this.activeTab() === 'VEHICULOS') {
      this.paginaVehiculos.set(1);
    } else {
      this.paginaContribuyentes.set(1);
    }
    this.cargarDatos();
  }

  limpiarFiltros(): void {
    if (this.activeTab() === 'VEHICULOS') {
      this.filtroVehiculoTexto.set('');
      this.filtroVehiculoEstado.set('Todos');
      this.filtroVehiculoTipo.set('Todos');
      this.paginaVehiculos.set(1);
    } else {
      this.filtroContribuyenteTexto.set('');
      this.filtroContribuyenteEstado.set('Todos');
      this.filtroContribuyenteNaturaleza.set(0);
      this.filtroContribuyenteSituacion.set('Todos');
      this.paginaContribuyentes.set(1);
    }
    this.cargarDatos();
  }

  // ── Descarga de Excel (.xlsx) Resiliente ─────────────────────────
  async descargarReporteActual(): Promise<void> {
    if (this.descargandoExcel()) return;

    this.descargandoExcel.set(true);
    this.mensajeFeedback.set(null);

    const esVehiculo = this.activeTab() === 'VEHICULOS';

    try {
      if (esVehiculo) {
        await this.ejecutarDescargaVehiculos();
      } else {
        await this.ejecutarDescargaContribuyentes();
      }
      this.mensajeFeedback.set({
        tipo: 'success',
        texto: `Informe de ${esVehiculo ? 'Parque Automotor' : 'Directorio de Contribuyentes'} descargado exitosamente.`
      });
    } catch (error) {
      console.warn('Fallo en endpoint backend de streaming. Activando exportación fallback cliente...', error);
      try {
        if (esVehiculo) {
          await this.exportarFallbackVehiculos();
        } else {
          await this.exportarFallbackContribuyentes();
        }
        this.mensajeFeedback.set({
          tipo: 'success',
          texto: `Informe generado y descargado exitosamente.`
        });
      } catch (fallbackErr) {
        console.error('Error definitivo al generar informe:', fallbackErr);
        this.mensajeFeedback.set({
          tipo: 'error',
          texto: 'Ocurrió un inconveniente al generar el archivo Excel. Por favor reintenta en unos instantes.'
        });
      }
    } finally {
      this.descargandoExcel.set(false);
    }
  }

  private async ejecutarDescargaVehiculos(): Promise<void> {
    const filtros: ReporteVehiculoFiltros = {
      buscar: this.filtroVehiculoTexto(),
      estado: this.filtroVehiculoEstado(),
      tipoVehiculo: this.filtroVehiculoTipo()
    };

    const blob = await firstValueFrom(this.reportesApi.descargarVehiculosExcel(filtros));
    this.descargarBlobEnNavegador(blob, `Reporte_Parque_Automotor_${this.obtenerTimestamp()}.xlsx`);
  }

  private async ejecutarDescargaContribuyentes(): Promise<void> {
    const filtros: ReporteContribuyenteFiltros = {
      buscar: this.filtroContribuyenteTexto(),
      estado: this.filtroContribuyenteEstado(),
      naturalezaJuridicaId: this.filtroContribuyenteNaturaleza(),
      situacion: this.filtroContribuyenteSituacion()
    };

    const blob = await firstValueFrom(this.reportesApi.descargarContribuyentesExcel(filtros));
    this.descargarBlobEnNavegador(blob, `Reporte_Directorio_Contribuyentes_${this.obtenerTimestamp()}.xlsx`);
  }

  private async exportarFallbackVehiculos(): Promise<void> {
    const filtros: ReporteVehiculoFiltros = {
      buscar: this.filtroVehiculoTexto(),
      estado: this.filtroVehiculoEstado(),
      tipoVehiculo: this.filtroVehiculoTipo()
    };

    const resp = await firstValueFrom(this.reportesApi.getTodosVehiculosParaExportar(filtros));
    const items = resp?.data?.items || [];

    const data = items.map(v => ({
      'PLACA': v.placa || '',
      'ESTADO MATRÍCULA': v.estadoMatricula || 'Desconocido',
      'TIPO VEHÍCULO': v.tipoVehiculo || '',
      'MARCA': v.marca || '',
      'LÍNEA': v.linea || '',
      'MODELO': v.modelo ?? '',
      'CILINDRAJE (CC)': v.cilindraje ?? '',
      'COMBUSTIBLE': v.combustible || '',
      'CLASE': v.clase || '',
      'SERVICIO': v.servicio || '',
      'MUNICIPIO / TRÁNSITO': v.organismoTransito || '',
      'PROPIETARIO ACTUAL': v.propietarioNombre || 'Sin propietario asignado',
      'DOCUMENTO PROPIETARIO': v.propietarioDocumento || '',
      'EXENCIÓN': v.exencion || 'Sin exención'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Parque Automotor');
    XLSX.writeFile(wb, `Reporte_Parque_Automotor_${this.obtenerTimestamp()}.xlsx`);
  }

  private async exportarFallbackContribuyentes(): Promise<void> {
    const filtros: ReporteContribuyenteFiltros = {
      buscar: this.filtroContribuyenteTexto(),
      estado: this.filtroContribuyenteEstado(),
      naturalezaJuridicaId: this.filtroContribuyenteNaturaleza(),
      situacion: this.filtroContribuyenteSituacion()
    };

    const resp = await firstValueFrom(this.reportesApi.getTodosContribuyentesParaExportar(filtros));
    let items = resp?.data?.items || [];

    if (this.filtroContribuyenteNaturaleza() > 0) {
      items = items.filter(c => c.naturalezaJuridicaId === this.filtroContribuyenteNaturaleza());
    }
    if (this.filtroContribuyenteSituacion() === 'Al Día') {
      items = items.filter(c => (c.cantidadDeudas || 0) === 0);
    } else if (this.filtroContribuyenteSituacion() === 'Con Deuda') {
      items = items.filter(c => (c.cantidadDeudas || 0) > 0);
    }

    const data = items.map(c => {
      const tipoDoc = c.tipoDocumentoId === 1 ? 'CC' :
                      c.tipoDocumentoId === 2 ? 'NIT' :
                      c.tipoDocumentoId === 3 ? 'CE' :
                      c.tipoDocumentoId === 4 ? 'PASAPORTE' :
                      c.tipoDocumentoId === 5 ? 'TI' : 'DOC';

      const docCompleto = c.digitoVerificacion
        ? `${c.numeroDocumento}-${c.digitoVerificacion}`
        : c.numeroDocumento;

      const nombre = c.razonSocial || [c.primerNombre, c.segundoNombre, c.primerApellido, c.segundoApellido].filter(Boolean).join(' ');
      const situacion = (c.cantidadDeudas || 0) > 0 ? `Con Deuda (${c.cantidadDeudas})` : 'Al Día';
      const placas = c.placasAsociadas || (c.placas && c.placas.length > 0 ? c.placas.join(', ') : 'Ninguno');

      return {
        'TIPO DOCUMENTO': tipoDoc,
        'NÚMERO DOCUMENTO': docCompleto,
        'NOMBRE / RAZÓN SOCIAL': nombre,
        'TIPO PERSONA': c.naturalezaJuridicaId === 2 ? 'Jurídica' : 'Natural',
        'ESTADO': c.activo ? 'Activo' : 'Inactivo',
        'SITUACIÓN TRIBUTARIA': situacion,
        'TOTAL VEHÍCULOS': c.cantidadVehiculos ?? 0,
        'PLACAS ASOCIADAS': placas,
        'CORREO ELECTRÓNICO': c.correoElectronico || '',
        'TELÉFONO': c.telefono || '',
        'DIRECCIÓN': c.direccion || '',
        'CIUDAD / MUNICIPIO': c.ciudad || ''
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Directorio Contribuyentes');
    XLSX.writeFile(wb, `Reporte_Directorio_Contribuyentes_${this.obtenerTimestamp()}.xlsx`);
  }

  private descargarBlobEnNavegador(blob: Blob, nombreArchivo: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  private obtenerTimestamp(): string {
    const ahora = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${ahora.getFullYear()}${pad(ahora.getMonth() + 1)}${pad(ahora.getDate())}_${pad(ahora.getHours())}${pad(ahora.getMinutes())}`;
  }
}
