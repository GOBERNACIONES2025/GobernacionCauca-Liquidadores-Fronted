import { Injectable, inject, signal, computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import * as XLSX from 'xlsx';
import { GeneracionLiquidacionApiService } from '../../infrastructure/api/Liquidacion/generacion-liquidacion-api.service';
import { EntidadesRegistroApiService } from '../../infrastructure/api/Registro/entidades-registro-api.service';
import { MunicipiosApiService } from '../../infrastructure/api/Territorios/municipios-api.service';
import { TiposActoRegistroApiService } from '../../infrastructure/api/Registro/tipos-acto-registro-api.service';
import { LiquidacionListadoDto } from '../../domain/models/Liquidacion/generacion-liquidacion.model';
import { ToastService } from '../../../../core/services/toast.service';

export interface ResumenAgrupado {
  nombre: string;
  cantidad: number;
  total: number;
  porcentaje?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReportesRegistrosFacade {
  private liquidacionApi = inject(GeneracionLiquidacionApiService);
  private entidadesApi = inject(EntidadesRegistroApiService);
  private municipiosApi = inject(MunicipiosApiService);
  private tiposActoApi = inject(TiposActoRegistroApiService);
  private toast = inject(ToastService);

  // Filtros reactivos con Signals
  readonly filtroEntidadId = signal<number | null>(null);
  readonly filtroMunicipioId = signal<number | null>(null);
  readonly filtroTipoActoId = signal<number | null>(null);
  readonly filtroEstadoId = signal<number | null>(null);
  readonly filtroFechaDesde = signal<string>('');
  readonly filtroFechaHasta = signal<string>('');
  readonly filtroBusqueda = signal<string>('');

  // Paginación y control de visualización
  readonly pageNumber = signal<number>(1);
  readonly pageSize = signal<number>(10);
  readonly isLoading = signal<boolean>(false);
  readonly isExporting = signal<boolean>(false);

  // Datos principales
  readonly liquidaciones = signal<LiquidacionListadoDto[]>([]);
  readonly totalRegistros = signal<number>(0);

  // Listas para los dropdowns de filtrado
  readonly entidades = signal<any[]>([]);
  readonly municipios = signal<any[]>([]);
  readonly tiposActo = signal<any[]>([]);

  // Estados de liquidación estandarizados
  readonly estadosDisponibles = [
    { id: 0, nombre: 'Todos los estados' },
    { id: 2, nombre: 'Generadas / Pendientes de Pago' },
    { id: 3, nombre: 'Vigentes' },
    { id: 4, nombre: 'Pagadas Oficialmente' },
    { id: 5, nombre: 'Vencidas' },
    { id: 6, nombre: 'Anuladas' },
    { id: 7, nombre: 'Reliquidadas' }
  ];

  // ── COMPUTEDS KPI FINANCIEROS ─────────────────────────────────────────

  readonly kpiTotalRecaudado = computed(() => {
    return this.liquidaciones().reduce((sum, item) => sum + (item.totales?.totalPagar || 0), 0);
  });

  readonly kpiTotalBaseGravable = computed(() => {
    return this.liquidaciones().reduce((sum, item) => sum + (item.totales?.subtotal || 0), 0);
  });

  readonly kpiTotalDescuentos = computed(() => {
    return this.liquidaciones().reduce((sum, item) => sum + (item.totales?.totalDescuentos || 0), 0);
  });

  readonly kpiPromedioLiquidacion = computed(() => {
    const total = this.liquidaciones().length;
    return total > 0 ? this.kpiTotalRecaudado() / total : 0;
  });

  // ── COMPUTEDS AGRUPADOS (ANÁLISIS DE NEGOCIO) ──────────────────────────

  readonly resumenPorEntidad = computed<ResumenAgrupado[]>(() => {
    const mapa = new Map<string, { cantidad: number; total: number }>();
    const totalGral = this.kpiTotalRecaudado();

    for (const item of this.liquidaciones()) {
      const nombre = item.documentoRegistro?.entidadRegistro || 'Despacho No Identificado';
      const actual = mapa.get(nombre) || { cantidad: 0, total: 0 };
      actual.cantidad++;
      actual.total += (item.totales?.totalPagar || 0);
      mapa.set(nombre, actual);
    }

    return Array.from(mapa.entries()).map(([nombre, val]) => ({
      nombre,
      cantidad: val.cantidad,
      total: val.total,
      porcentaje: totalGral > 0 ? (val.total / totalGral) * 100 : 0
    })).sort((a, b) => b.total - a.total);
  });

  readonly resumenPorMunicipio = computed<ResumenAgrupado[]>(() => {
    const mapa = new Map<string, { cantidad: number; total: number }>();
    const totalGral = this.kpiTotalRecaudado();

    for (const item of this.liquidaciones()) {
      const nombre = item.documentoRegistro?.municipioJurisdiccion || 'Cauca';
      const actual = mapa.get(nombre) || { cantidad: 0, total: 0 };
      actual.cantidad++;
      actual.total += (item.totales?.totalPagar || 0);
      mapa.set(nombre, actual);
    }

    return Array.from(mapa.entries()).map(([nombre, val]) => ({
      nombre,
      cantidad: val.cantidad,
      total: val.total,
      porcentaje: totalGral > 0 ? (val.total / totalGral) * 100 : 0
    })).sort((a, b) => b.total - a.total);
  });

  readonly resumenPorEstado = computed<ResumenAgrupado[]>(() => {
    const mapa = new Map<string, { cantidad: number; total: number }>();

    for (const item of this.liquidaciones()) {
      const nombre = item.estado?.nombre || 'Desconocido';
      const actual = mapa.get(nombre) || { cantidad: 0, total: 0 };
      actual.cantidad++;
      actual.total += (item.totales?.totalPagar || 0);
      mapa.set(nombre, actual);
    }

    return Array.from(mapa.entries()).map(([nombre, val]) => ({
      nombre,
      cantidad: val.cantidad,
      total: val.total
    })).sort((a, b) => b.cantidad - a.cantidad);
  });

  // ── MÉTODOS DE CONSULTA Y CARGA ──────────────────────────────────────

  async cargarCatalogosFiltros(): Promise<void> {
    try {
      // 1. Entidades de Registro (Notarías / Cámaras)
      const resEnt = await firstValueFrom(this.entidadesApi.obtenerTodos(1, 200, undefined, undefined, undefined, undefined, true));
      if (resEnt?.data?.items) {
        this.entidades.set(resEnt.data.items);
      }

      // 2. Municipios del Cauca (DepartamentoId = 19 para Cauca si aplica, o todos)
      const resMun = await firstValueFrom(this.municipiosApi.obtenerTodos(1, 100));
      if (resMun?.data?.items) {
        this.municipios.set(resMun.data.items);
      }

      // 3. Tipos de Acto Registral
      const resAct = await firstValueFrom(this.tiposActoApi.obtenerTodos(1, 200, undefined, true));
      if (resAct?.data?.items) {
        this.tiposActo.set(resAct.data.items);
      }
    } catch (e) {
      console.warn('Advertencia al cargar filtros de reportes:', e);
    }
  }

  async consultarReporte(): Promise<void> {
    this.isLoading.set(true);

    try {
      const estadoFiltro = this.filtroEstadoId() === 0 ? null : this.filtroEstadoId();

      const res = await firstValueFrom(
        this.liquidacionApi.listarLiquidaciones(
          this.pageNumber(),
          this.pageSize(),
          this.filtroBusqueda(),
          estadoFiltro,
          this.filtroFechaDesde() || null,
          this.filtroFechaHasta() || null,
          this.filtroEntidadId() || null,
          this.filtroMunicipioId() || null,
          this.filtroTipoActoId() || null
        )
      );

      if (res?.data) {
        this.liquidaciones.set(res.data.items || []);
        this.totalRegistros.set(res.data.totalCount || 0);
      } else {
        this.liquidaciones.set([]);
        this.totalRegistros.set(0);
      }
    } catch (err) {
      this.toast.error('Error al generar la consulta del reporte fiscal');
      this.liquidaciones.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  limpiarFiltros(): void {
    this.filtroEntidadId.set(null);
    this.filtroMunicipioId.set(null);
    this.filtroTipoActoId.set(null);
    this.filtroEstadoId.set(null);
    this.filtroFechaDesde.set('');
    this.filtroFechaHasta.set('');
    this.filtroBusqueda.set('');
    this.pageNumber.set(1);
    this.consultarReporte();
  }

  cambiarPagina(page: number): void {
    this.pageNumber.set(page);
    this.consultarReporte();
  }

  // ── MÉTODOS DE DESCARGA Y EXPORTACIÓN ─────────────────────────────────

  async exportarExcel(): Promise<void> {
    if (this.liquidaciones().length === 0) {
      this.toast.warning('No hay datos disponibles para exportar con los filtros actuales');
      return;
    }

    this.isExporting.set(true);

    try {
      // 1. Obtener el universo completo sin paginación (hasta 5000 registros)
      const estadoFiltro = this.filtroEstadoId() === 0 ? null : this.filtroEstadoId();
      const res = await firstValueFrom(
        this.liquidacionApi.listarLiquidaciones(
          1,
          5000,
          this.filtroBusqueda(),
          estadoFiltro,
          this.filtroFechaDesde() || null,
          this.filtroFechaHasta() || null,
          this.filtroEntidadId() || null,
          this.filtroMunicipioId() || null,
          this.filtroTipoActoId() || null
        )
      );

      const itemsExport = res?.data?.items || this.liquidaciones();

      // 2. Mapear datos detallados
      const datosDetalle = itemsExport.map((item, idx) => ({
        'N°': idx + 1,
        'Liquidación Oficial': item.numeroLiquidacion,
        'N° Radicado': item.radicacion?.numeroRadicado || '-',
        'Fecha Expedición': item.fechaLiquidacion ? item.fechaLiquidacion.substring(0, 10) : '-',
        'Fecha Vencimiento': item.fechaVencimiento ? item.fechaVencimiento.substring(0, 10) : '-',
        'Estado': item.estado?.nombre || 'Vigente',
        'Entidad de Registro': item.documentoRegistro?.entidadRegistro || 'Despacho Notarial',
        'Municipio': item.documentoRegistro?.municipioJurisdiccion || 'Cauca',
        'Documento / Minuta': item.documentoRegistro?.numeroDocumento || 'S/N',
        'Identificación Contribuyente': item.contribuyente?.numeroIdentificacion || '-',
        'Nombre Sujeto Pasivo': item.contribuyente?.nombreCompleto || '-',
        'Base Gravable ($ COP)': item.totales?.subtotal || 0,
        'Beneficio Exenciones ($ COP)': item.totales?.totalDescuentos || 0,
        'Total Liquidado ($ COP)': item.totales?.totalPagar || 0
      }));

      // 3. Crear Libro de Trabajo XLSX
      const wb = XLSX.utils.book_new();

      // Hoja 1: Detalle de Liquidaciones
      const wsDetalle = XLSX.utils.json_to_sheet(datosDetalle);
      XLSX.utils.book_append_sheet(wb, wsDetalle, 'Liquidaciones Oficiales');

      // Hoja 2: Consolidado por Entidad
      const datosEntidades = this.resumenPorEntidad().map(e => ({
        'Entidad Notarial / Registral': e.nombre,
        'Trámites Liquidados': e.cantidad,
        'Total Recaudado ($ COP)': e.total,
        '% de Participación': e.porcentaje ? `${e.porcentaje.toFixed(2)}%` : '0%'
      }));
      const wsEntidades = XLSX.utils.json_to_sheet(datosEntidades);
      XLSX.utils.book_append_sheet(wb, wsEntidades, 'Consolidado por Entidad');

      // Hoja 3: Consolidado por Municipio
      const datosMunicipios = this.resumenPorMunicipio().map(m => ({
        'Municipio Jurisdicción': m.nombre,
        'Trámites Liquidados': m.cantidad,
        'Total Recaudado ($ COP)': m.total,
        '% de Participación': m.porcentaje ? `${m.porcentaje.toFixed(2)}%` : '0%'
      }));
      const wsMunicipios = XLSX.utils.json_to_sheet(datosMunicipios);
      XLSX.utils.book_append_sheet(wb, wsMunicipios, 'Consolidado por Municipio');

      // 4. Descargar archivo
      const fechaHoy = new Date().toISOString().substring(0, 10).replace(/-/g, '');
      const nombreArchivo = `Reporte_Impuesto_Registro_GobernacionCauca_${fechaHoy}.xlsx`;
      XLSX.writeFile(wb, nombreArchivo);

      this.toast.success('Reporte oficial en Excel descargado exitosamente');
    } catch (e) {
      console.error(e);
      this.toast.error('Ocurrió un error al generar el archivo Excel');
    } finally {
      this.isExporting.set(false);
    }
  }

  exportarCSV(): void {
    if (this.liquidaciones().length === 0) {
      this.toast.warning('No hay datos disponibles para exportar');
      return;
    }

    const separador = ';';
    const cabeceras = [
      'Liquidacion',
      'Radicado',
      'Fecha',
      'Estado',
      'Entidad',
      'Municipio',
      'Identificacion',
      'Contribuyente',
      'BaseGravable',
      'DescuentoExenciones',
      'TotalPagar'
    ];

    const filas = this.liquidaciones().map(item => [
      `"${item.numeroLiquidacion}"`,
      `"${item.radicacion?.numeroRadicado || ''}"`,
      `"${item.fechaLiquidacion ? item.fechaLiquidacion.substring(0, 10) : ''}"`,
      `"${item.estado?.nombre || ''}"`,
      `"${item.documentoRegistro?.entidadRegistro || ''}"`,
      `"${item.documentoRegistro?.municipioJurisdiccion || ''}"`,
      `"${item.contribuyente?.numeroIdentificacion || ''}"`,
      `"${item.contribuyente?.nombreCompleto || ''}"`,
      item.totales?.subtotal || 0,
      item.totales?.totalDescuentos || 0,
      item.totales?.totalPagar || 0
    ].join(separador));

    const csvContent = '\uFEFF' + [cabeceras.join(separador), ...filas].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Reporte_Registros_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    this.toast.success('Archivo CSV plano generado');
  }

  imprimirReporte(): void {
    window.print();
  }
}
