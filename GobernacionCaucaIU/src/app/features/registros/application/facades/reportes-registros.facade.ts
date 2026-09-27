import { Injectable, inject, signal, computed } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import * as XLSX from 'xlsx';
import { GeneracionLiquidacionApiService } from '../../infrastructure/api/Liquidacion/generacion-liquidacion-api.service';
import { EntidadesRegistroApiService } from '../../infrastructure/api/Registro/entidades-registro-api.service';
import { MunicipiosApiService } from '../../infrastructure/api/Territorios/municipios-api.service';
import { TiposActoRegistroApiService } from '../../infrastructure/api/Registro/tipos-acto-registro-api.service';
import { LiquidacionListadoDto } from '../../domain/models/Liquidacion/generacion-liquidacion.model';
import { ToastService } from '../../../../core/services/toast.service';
import { ApiResponse } from '../../../../core/shared/models/shared.model';

export interface ResumenAgrupado {
  nombre: string;
  cantidad: number;
  total: number;
  promedio: number;
  porcentaje?: number;
  codigo?: string;
  badgeClase?: string;
}

export interface FiltroActivoItem {
  id: string;
  etiqueta: string;
  valor: string;
  remover: () => void;
}

export type RangoFechaRapido = 'hoy' | '7dias' | 'mes' | 'ano' | 'todo' | 'personalizado';

@Injectable({
  providedIn: 'root'
})
export class ReportesRegistrosFacade {
  private liquidacionApi = inject(GeneracionLiquidacionApiService);
  private entidadesApi = inject(EntidadesRegistroApiService);
  private municipiosApi = inject(MunicipiosApiService);
  private tiposActoApi = inject(TiposActoRegistroApiService);
  private toast = inject(ToastService);

  // ── FILTROS REACTIVOS CON SIGNALS ─────────────────────────────────────
  readonly filtroEntidadId = signal<number | null>(null);
  readonly filtroMunicipioId = signal<number | null>(null);
  readonly filtroTipoActoId = signal<number | null>(null);
  readonly filtroEstado = signal<string | null>(null); // 'vigentes' | 'vencidas' | 'pagadas' | 'anuladas' | '2' | '7' | null
  readonly filtroFechaDesde = signal<string>('');
  readonly filtroFechaHasta = signal<string>('');
  readonly filtroBusqueda = signal<string>('');
  readonly filtroRangoFechaRapido = signal<RangoFechaRapido>('todo');

  // ── ESTADO DE INTERFAZ Y PROCESOS ─────────────────────────────────────
  readonly isLoading = signal<boolean>(false);
  readonly isExporting = signal<boolean>(false);
  readonly downloadingPdfId = signal<number | null>(null);

  // ── CONTROL DE ORDENAMIENTO Y PAGINACIÓN ──────────────────────────────
  readonly sortColumn = signal<string>('fechaLiquidacion');
  readonly sortAsc = signal<boolean>(false);
  readonly pageNumber = signal<number>(1);
  readonly pageSize = signal<number>(10);
  readonly pageSizeOptions = [10, 25, 50, 100];

  // ── DATOS CRUDOS Y CATÁLOGOS OFICIALES ────────────────────────────────
  readonly todasLiquidaciones = signal<LiquidacionListadoDto[]>([]);
  readonly entidades = signal<any[]>([]);
  readonly municipios = signal<any[]>([]);
  readonly tiposActo = signal<any[]>([]);

  // Opciones de estados de liquidación con semántica de negocio
  readonly estadosDisponibles = [
    { valor: '', nombre: 'Todos los Estados Operativos' },
    { valor: 'vigentes', nombre: '🟢 Vigentes (Plazo Activo)' },
    { valor: 'vencidas', nombre: '🔴 Vencidas (Con Plazo Expirado)' },
    { valor: 'pagadas', nombre: '🔵 Pagadas Oficialmente' },
    { valor: 'anuladas', nombre: '⚪ Anuladas' },
    { valor: '2', nombre: '🟡 Generadas / En Trámite' },
    { valor: '7', nombre: '🟣 Reliquidadas' }
  ];

  // ── EVALUACIÓN Y SEMÁFORO DE ESTADOS DE NEGOCIO ───────────────────────
  esPagada(item: any): boolean {
    if (!item) return false;
    return item.pago?.estaPagada === true ||
           item.pago?.pagado === true || 
           item.estadoLiquidacionId === 4 ||
           item.estado?.id === 4 ||
           item.estado?.codigo === 'PAGADA' ||
           (item.nombreEstado ? item.nombreEstado.toLowerCase().includes('pagad') : false);
  }

  esAnulada(item: any): boolean {
    if (!item) return false;
    return item.estadoLiquidacionId === 6 ||
           item.estado?.id === 6 ||
           item.estado?.codigo === 'ANULADA' ||
           (item.nombreEstado ? item.nombreEstado.toLowerCase().includes('anulad') : false);
  }

  esReliquidada(item: any): boolean {
    if (!item) return false;
    return item.estadoLiquidacionId === 7 ||
           item.estado?.id === 7 ||
           item.estado?.codigo === 'RELIQUIDADA' ||
           (item.nombreEstado ? item.nombreEstado.toLowerCase().includes('reliquidad') : false);
  }

  esVencida(item: any): boolean {
    if (!item) return false;
    if (this.esPagada(item) || this.esAnulada(item) || this.esReliquidada(item)) return false;
    return item.vencimiento?.estaVencida === true ||
           (item.vencimiento?.diasRestantes !== undefined && item.vencimiento.diasRestantes < 0) ||
           item.estaVencida === true ||
           item.estadoLiquidacionId === 5 ||
           item.estado?.id === 5 ||
           item.estado?.codigo === 'VENCIDA';
  }

  esVigente(item: any): boolean {
    if (!item) return false;
    return !this.esPagada(item) && !this.esAnulada(item) && !this.esReliquidada(item) && !this.esVencida(item);
  }

  getEstadoLabel(item: any): string {
    if (this.esPagada(item)) return 'Pagada';
    if (this.esAnulada(item)) return 'Anulada';
    if (this.esReliquidada(item)) return 'Reliquidada';
    if (this.esVencida(item)) return 'Vencida';
    if (this.esVigente(item)) return 'Vigente';
    return item.estado?.nombre || 'Generada';
  }

  getEstadoBadgeClass(item: any): string {
    if (this.esPagada(item)) {
      return 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-500/20';
    }
    if (this.esAnulada(item)) {
      return 'bg-rose-50 text-rose-800 border-rose-300 ring-1 ring-rose-500/20';
    }
    if (this.esReliquidada(item)) {
      return 'bg-purple-50 text-purple-800 border-purple-300 ring-1 ring-purple-500/20';
    }
    if (this.esVencida(item)) {
      return 'bg-red-50 text-red-800 border-red-300 ring-1 ring-red-500/20';
    }
    return 'bg-blue-50 text-blue-800 border-blue-300 ring-1 ring-blue-500/20';
  }

  // ── COMPUTEDS KPI FINANCIEROS Y OPERATIVOS (UNIVERSO COMPLETO) ─────────
  readonly totalRegistros = computed(() => this.todasLiquidaciones().length);

  readonly registroDesde = computed(() => {
    if (this.totalRegistros() === 0) return 0;
    return (this.pageNumber() - 1) * this.pageSize() + 1;
  });

  readonly registroHasta = computed(() => {
    return Math.min(this.pageNumber() * this.pageSize(), this.totalRegistros());
  });

  readonly kpiTotalRecaudado = computed(() => {
    return this.todasLiquidaciones().reduce((sum, item) => sum + (item.totales?.totalPagar || 0), 0);
  });

  readonly kpiTotalBaseGravable = computed(() => {
    return this.todasLiquidaciones().reduce((sum, item) => sum + (item.totales?.subtotal || 0), 0);
  });

  readonly kpiTotalDescuentos = computed(() => {
    return this.todasLiquidaciones().reduce((sum, item) => sum + (item.totales?.totalDescuentos || 0), 0);
  });

  readonly kpiPromedioLiquidacion = computed(() => {
    const total = this.totalRegistros();
    return total > 0 ? this.kpiTotalRecaudado() / total : 0;
  });

  readonly kpiTotalPagadas = computed(() => {
    return this.todasLiquidaciones().filter(item => this.esPagada(item)).length;
  });

  readonly kpiMontoPagado = computed(() => {
    return this.todasLiquidaciones()
      .filter(item => this.esPagada(item))
      .reduce((sum, item) => sum + (item.totales?.totalPagar || 0), 0);
  });

  readonly kpiTotalVigentes = computed(() => {
    return this.todasLiquidaciones().filter(item => this.esVigente(item)).length;
  });

  readonly kpiTotalVencidas = computed(() => {
    return this.todasLiquidaciones().filter(item => this.esVencida(item)).length;
  });

  readonly kpiTotalAnuladas = computed(() => {
    return this.todasLiquidaciones().filter(item => this.esAnulada(item)).length;
  });

  readonly kpiTasaCumplimiento = computed(() => {
    const total = this.totalRegistros();
    return total > 0 ? (this.kpiTotalPagadas() / total) * 100 : 0;
  });

  // ── CHIPS DE FILTROS ACTIVOS (UX FEEDBACK & RECOVERY) ──────────────────
  readonly filtrosActivos = computed<FiltroActivoItem[]>(() => {
    const activos: FiltroActivoItem[] = [];

    // Entidad
    const entId = this.filtroEntidadId();
    if (entId) {
      const ent = this.entidades().find(e => e.id === entId);
      activos.push({
        id: 'entidad',
        etiqueta: 'Entidad',
        valor: ent ? ent.nombre : `ID #${entId}`,
        remover: () => { this.filtroEntidadId.set(null); this.consultarReporte(); }
      });
    }

    // Municipio
    const munId = this.filtroMunicipioId();
    if (munId) {
      const mun = this.municipios().find(m => m.id === munId);
      activos.push({
        id: 'municipio',
        etiqueta: 'Municipio',
        valor: mun ? mun.nombre : `ID #${munId}`,
        remover: () => { this.filtroMunicipioId.set(null); this.consultarReporte(); }
      });
    }

    // Tipo Acto
    const actoId = this.filtroTipoActoId();
    if (actoId) {
      const acto = this.tiposActo().find(a => a.id === actoId);
      activos.push({
        id: 'tipoActo',
        etiqueta: 'Tipo de Acto',
        valor: acto ? `${acto.codigo} - ${acto.nombre}` : `ID #${actoId}`,
        remover: () => { this.filtroTipoActoId.set(null); this.consultarReporte(); }
      });
    }

    // Estado
    const est = this.filtroEstado();
    if (est) {
      const estObj = this.estadosDisponibles.find(e => e.valor === est);
      activos.push({
        id: 'estado',
        etiqueta: 'Estado',
        valor: estObj ? estObj.nombre.replace(/^[🟢🔴🔵⚪🟡🟣]\s*/, '') : est,
        remover: () => { this.filtroEstado.set(null); this.consultarReporte(); }
      });
    }

    // Fecha Desde
    const fDesde = this.filtroFechaDesde();
    if (fDesde) {
      activos.push({
        id: 'fechaDesde',
        etiqueta: 'Desde',
        valor: fDesde,
        remover: () => { this.filtroFechaDesde.set(''); this.filtroRangoFechaRapido.set('personalizado'); this.consultarReporte(); }
      });
    }

    // Fecha Hasta
    const fHasta = this.filtroFechaHasta();
    if (fHasta) {
      activos.push({
        id: 'fechaHasta',
        etiqueta: 'Hasta',
        valor: fHasta,
        remover: () => { this.filtroFechaHasta.set(''); this.filtroRangoFechaRapido.set('personalizado'); this.consultarReporte(); }
      });
    }

    // Búsqueda de texto
    const q = this.filtroBusqueda().trim();
    if (q) {
      activos.push({
        id: 'busqueda',
        etiqueta: 'Búsqueda',
        valor: `"${q}"`,
        remover: () => { this.filtroBusqueda.set(''); this.consultarReporte(); }
      });
    }

    return activos;
  });

  // ── COMPUTEDS AGRUPADOS (ANÁLISIS DE NEGOCIO Y BI) ────────────────────
  readonly resumenPorEntidad = computed<ResumenAgrupado[]>(() => {
    const mapa = new Map<string, { cantidad: number; total: number }>();
    const totalGral = this.kpiTotalRecaudado();

    for (const item of this.todasLiquidaciones()) {
      const nombre = item.documentoRegistro?.entidadRegistro?.trim() || 'Despacho No Identificado';
      const actual = mapa.get(nombre) || { cantidad: 0, total: 0 };
      actual.cantidad++;
      actual.total += (item.totales?.totalPagar || 0);
      mapa.set(nombre, actual);
    }

    return Array.from(mapa.entries()).map(([nombre, val]) => ({
      nombre,
      cantidad: val.cantidad,
      total: val.total,
      promedio: val.cantidad > 0 ? val.total / val.cantidad : 0,
      porcentaje: totalGral > 0 ? (val.total / totalGral) * 100 : 0
    })).sort((a, b) => b.total - a.total);
  });

  readonly resumenPorMunicipio = computed<ResumenAgrupado[]>(() => {
    const mapa = new Map<string, { cantidad: number; total: number }>();
    const totalGral = this.kpiTotalRecaudado();

    for (const item of this.todasLiquidaciones()) {
      const nombre = item.documentoRegistro?.municipioJurisdiccion?.trim() || 'Cauca';
      const actual = mapa.get(nombre) || { cantidad: 0, total: 0 };
      actual.cantidad++;
      actual.total += (item.totales?.totalPagar || 0);
      mapa.set(nombre, actual);
    }

    return Array.from(mapa.entries()).map(([nombre, val]) => ({
      nombre,
      cantidad: val.cantidad,
      total: val.total,
      promedio: val.cantidad > 0 ? val.total / val.cantidad : 0,
      porcentaje: totalGral > 0 ? (val.total / totalGral) * 100 : 0
    })).sort((a, b) => b.total - a.total);
  });

  readonly resumenPorEstado = computed<ResumenAgrupado[]>(() => {
    const totalGral = this.kpiTotalRecaudado();
    const categorias = [
      { id: 'vigentes', nombre: 'Vigentes (En Plazo Activo)', badgeClase: 'bg-blue-50 text-blue-800 border-blue-200' },
      { id: 'pagadas', nombre: 'Pagadas Oficialmente', badgeClase: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
      { id: 'vencidas', nombre: 'Vencidas (Con Plazo Expirado)', badgeClase: 'bg-red-50 text-red-800 border-red-200' },
      { id: 'anuladas', nombre: 'Anuladas', badgeClase: 'bg-rose-50 text-rose-800 border-rose-200' },
      { id: 'reliquidadas', nombre: 'Reliquidadas', badgeClase: 'bg-purple-50 text-purple-800 border-purple-200' }
    ];

    return categorias.map(cat => {
      const items = this.todasLiquidaciones().filter(item => {
        if (cat.id === 'pagadas') return this.esPagada(item);
        if (cat.id === 'anuladas') return this.esAnulada(item);
        if (cat.id === 'reliquidadas') return this.esReliquidada(item);
        if (cat.id === 'vencidas') return this.esVencida(item);
        if (cat.id === 'vigentes') return this.esVigente(item);
        return false;
      });

      const cantidad = items.length;
      const total = items.reduce((s, it) => s + (it.totales?.totalPagar || 0), 0);

      return {
        codigo: cat.id,
        nombre: cat.nombre,
        cantidad,
        total,
        promedio: cantidad > 0 ? total / cantidad : 0,
        porcentaje: totalGral > 0 ? (total / totalGral) * 100 : 0,
        badgeClase: cat.badgeClase
      };
    });
  });

  // ── COMPUTEDS ORDENAMIENTO Y PAGINACIÓN CLIENT-SIDE ───────────────────
  readonly liquidacionesOrdenadas = computed<LiquidacionListadoDto[]>(() => {
    const items = [...this.todasLiquidaciones()];
    const col = this.sortColumn();
    const asc = this.sortAsc();

    return items.sort((a, b) => {
      let valA: any = '';
      let valB: any = '';

      switch (col) {
        case 'numeroLiquidacion':
          valA = a.numeroLiquidacion || '';
          valB = b.numeroLiquidacion || '';
          break;
        case 'fechaLiquidacion':
          valA = a.fechaLiquidacion || '';
          valB = b.fechaLiquidacion || '';
          break;
        case 'entidad':
          valA = a.documentoRegistro?.entidadRegistro || '';
          valB = b.documentoRegistro?.entidadRegistro || '';
          break;
        case 'municipio':
          valA = a.documentoRegistro?.municipioJurisdiccion || '';
          valB = b.documentoRegistro?.municipioJurisdiccion || '';
          break;
        case 'contribuyente':
          valA = a.contribuyente?.nombreCompleto || '';
          valB = b.contribuyente?.nombreCompleto || '';
          break;
        case 'subtotal':
          valA = a.totales?.subtotal || 0;
          valB = b.totales?.subtotal || 0;
          break;
        case 'totalDescuentos':
          valA = a.totales?.totalDescuentos || 0;
          valB = b.totales?.totalDescuentos || 0;
          break;
        case 'totalPagar':
          valA = a.totales?.totalPagar || 0;
          valB = b.totales?.totalPagar || 0;
          break;
        case 'estado':
          valA = this.getEstadoLabel(a);
          valB = this.getEstadoLabel(b);
          break;
        default:
          valA = a.id || 0;
          valB = b.id || 0;
          break;
      }

      if (typeof valA === 'string') {
        const comp = valA.localeCompare(valB, 'es', { sensitivity: 'base' });
        return asc ? comp : -comp;
      }

      return asc ? (valA > valB ? 1 : valA < valB ? -1 : 0) : (valB > valA ? 1 : valB < valA ? -1 : 0);
    });
  });

  readonly liquidacionesPaginadas = computed<LiquidacionListadoDto[]>(() => {
    const ordenadas = this.liquidacionesOrdenadas();
    const page = this.pageNumber();
    const size = this.pageSize();
    const start = (page - 1) * size;
    return ordenadas.slice(start, start + size);
  });

  // ── SANITIZADORES Y PARSERS SEGUROS (PREVENCIÓN DE ERRORES) ────────────
  private parseId(val: any): number | null {
    if (val === null || val === undefined || val === '' || val === 'null' || isNaN(+val) || +val <= 0) {
      return null;
    }
    return +val;
  }

  setFiltroEntidad(val: any): void {
    this.filtroEntidadId.set(this.parseId(val));
  }

  setFiltroMunicipio(val: any): void {
    this.filtroMunicipioId.set(this.parseId(val));
  }

  setFiltroTipoActo(val: any): void {
    this.filtroTipoActoId.set(this.parseId(val));
  }

  setFiltroEstado(val: any): void {
    if (val === null || val === undefined || val === '' || val === 'null') {
      this.filtroEstado.set(null);
    } else {
      this.filtroEstado.set(String(val).trim());
    }
  }

  setFiltroFechaDesde(val: string): void {
    this.filtroFechaDesde.set(val || '');
    this.filtroRangoFechaRapido.set('personalizado');
  }

  setFiltroFechaHasta(val: string): void {
    this.filtroFechaHasta.set(val || '');
    this.filtroRangoFechaRapido.set('personalizado');
  }

  setFiltroBusqueda(val: string): void {
    this.filtroBusqueda.set(val || '');
  }

  // Preset rápido de fechas
  aplicarRangoFechaRapido(rango: RangoFechaRapido): void {
    this.filtroRangoFechaRapido.set(rango);
    const hoy = new Date();
    const pad = (n: number) => n < 10 ? `0${n}` : `${n}`;
    const formato = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (rango === 'hoy') {
      const hoyStr = formato(hoy);
      this.filtroFechaDesde.set(hoyStr);
      this.filtroFechaHasta.set(hoyStr);
    } else if (rango === '7dias') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      this.filtroFechaDesde.set(formato(d));
      this.filtroFechaHasta.set(formato(hoy));
    } else if (rango === 'mes') {
      const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      this.filtroFechaDesde.set(formato(primerDia));
      this.filtroFechaHasta.set(formato(hoy));
    } else if (rango === 'ano') {
      const primerDiaAno = new Date(hoy.getFullYear(), 0, 1);
      this.filtroFechaDesde.set(formato(primerDiaAno));
      this.filtroFechaHasta.set(formato(hoy));
    } else if (rango === 'todo') {
      this.filtroFechaDesde.set('');
      this.filtroFechaHasta.set('');
    }

    this.consultarReporte();
  }

  ordenarPor(columna: string): void {
    if (this.sortColumn() === columna) {
      this.sortAsc.set(!this.sortAsc());
    } else {
      this.sortColumn.set(columna);
      this.sortAsc.set(true);
    }
  }

  cambiarPagina(page: number): void {
    this.pageNumber.set(page);
  }

  cambiarTamanoPagina(size: number): void {
    this.pageSize.set(size);
    this.pageNumber.set(1);
  }

  // ── MÉTODOS DE CONSULTA Y CARGA ──────────────────────────────────────
  async cargarCatalogosFiltros(): Promise<void> {
    try {
      // 1. Entidades de Registro (Notarías / Cámaras de Comercio del Cauca)
      const resEnt = await firstValueFrom(this.entidadesApi.obtenerTodos(1, 200, undefined, undefined, undefined, undefined, true));
      if (resEnt?.data?.items) {
        this.entidades.set(resEnt.data.items);
      }

      // 2. Municipios del Departamento del Cauca
      const resMun = await firstValueFrom(this.municipiosApi.obtenerTodos(1, 100));
      if (resMun?.data?.items) {
        this.municipios.set(resMun.data.items);
      }

      // 3. Tipos de Acto Registral vigentes
      const resAct = await firstValueFrom(this.tiposActoApi.obtenerTodos(1, 200, undefined, true));
      if (resAct?.data?.items) {
        this.tiposActo.set(resAct.data.items);
      }
    } catch (e) {
      console.warn('Advertencia al sincronizar catálogos de reportes:', e);
    }
  }

  async consultarReporte(): Promise<void> {
    this.isLoading.set(true);

    try {
      const rawEstado = this.filtroEstado();
      let estadoFiltro: string | null = null;
      let estadoId: number | null = null;

      if (rawEstado) {
        if (['vigentes', 'vencidas', 'pagadas', 'anuladas'].includes(rawEstado)) {
          estadoFiltro = rawEstado;
        } else if (!isNaN(+rawEstado)) {
          estadoId = +rawEstado;
        }
      }

      // Se consulta el universo filtrado completo (hasta 2000 registros para analítica departamental precisa)
      const res = await firstValueFrom(
        this.liquidacionApi.listarLiquidaciones(
          1,
          2000,
          this.filtroBusqueda(),
          estadoId,
          this.filtroFechaDesde() || null,
          this.filtroFechaHasta() || null,
          this.filtroEntidadId() || null,
          this.filtroMunicipioId() || null,
          this.filtroTipoActoId() || null,
          estadoFiltro
        )
      );

      if (res?.data?.items) {
        this.todasLiquidaciones.set(res.data.items);
      } else {
        this.todasLiquidaciones.set([]);
      }
      this.pageNumber.set(1);
    } catch (err) {
      this.toast.error('Error al generar la consulta del reporte fiscal departamental');
      this.todasLiquidaciones.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  limpiarFiltros(): void {
    this.filtroEntidadId.set(null);
    this.filtroMunicipioId.set(null);
    this.filtroTipoActoId.set(null);
    this.filtroEstado.set(null);
    this.filtroFechaDesde.set('');
    this.filtroFechaHasta.set('');
    this.filtroBusqueda.set('');
    this.filtroRangoFechaRapido.set('todo');
    this.pageNumber.set(1);
    this.consultarReporte();
    this.toast.info('Filtros restablecidos a la vista general');
  }

  // ── MÉTODOS DE OPERACIÓN SOBRE LIQUIDACIONES INDIVIDUALES ──────────────
  descargarPdf(id: number): Observable<Blob> {
    this.downloadingPdfId.set(id);
    return new Observable<Blob>(observer => {
      this.liquidacionApi.descargarPdf(id).subscribe({
        next: (blob) => {
          this.downloadingPdfId.set(null);
          observer.next(blob);
          observer.complete();
        },
        error: (err) => {
          this.downloadingPdfId.set(null);
          observer.error(err);
        }
      });
    });
  }

  obtenerPago(id: number): Observable<ApiResponse<any>> {
    return this.liquidacionApi.obtenerPago(id);
  }

  descargarSoportePago(id: number, inline: boolean = true): Observable<Blob> {
    return this.liquidacionApi.descargarSoportePago(id, inline);
  }

  // ── EXPORTACIÓN INSTITUCIONAL A EXCEL (.XLSX) ─────────────────────────
  async exportarExcel(): Promise<void> {
    const items = this.todasLiquidaciones();
    if (items.length === 0) {
      this.toast.warning('No hay datos disponibles para exportar con los filtros seleccionados');
      return;
    }

    this.isExporting.set(true);

    try {
      // 1. Mapeo del Detalle Completo de Liquidaciones
      const datosDetalle = items.map((item, idx) => ({
        'N°': idx + 1,
        'Liquidación Oficial': item.numeroLiquidacion,
        'Radicado Trámite': item.radicacion?.numeroRadicado || 'S/R',
        'Fecha Expedición': item.fechaLiquidacion ? item.fechaLiquidacion.substring(0, 10) : '-',
        'Fecha Vencimiento': item.fechaVencimiento ? item.fechaVencimiento.substring(0, 10) : '-',
        'Estado': this.getEstadoLabel(item),
        'Entidad de Registro': item.documentoRegistro?.entidadRegistro || 'Despacho No Identificado',
        'Municipio Jurisdicción': item.documentoRegistro?.municipioJurisdiccion || 'Cauca',
        'N° Documento / Minuta': item.documentoRegistro?.numeroDocumento || 'S/N',
        'Tipo Identificación': item.contribuyente?.tipoIdentificacion || 'C.C.',
        'Identificación Sujeto Pasivo': item.contribuyente?.numeroIdentificacion || '-',
        'Nombre Sujeto Pasivo': item.contribuyente?.nombreCompleto || '-',
        'Base Gravable Total ($ COP)': item.totales?.subtotal || 0,
        'Beneficio Exenciones ($ COP)': item.totales?.totalDescuentos || 0,
        'Total Liquidado ($ COP)': item.totales?.totalPagar || 0,
        '¿Pagada?': this.esPagada(item) ? 'SÍ' : 'NO',
        'Medio de Recaudo': item.pago?.medioPagoNombre || (this.esPagada(item) ? 'Bancos' : 'Pendiente'),
        'Referencia / Aprobación': item.pago?.referenciaPago || '-',
        'Fecha de Recaudo': item.pago?.fechaPago ? item.pago.fechaPago.substring(0, 10) : '-'
      }));

      // 2. Mapeo Hoja 2: Consolidado por Entidad Registral
      const datosEntidades = this.resumenPorEntidad().map((e, idx) => ({
        'Posición': idx + 1,
        'Entidad Notarial / Registral': e.nombre,
        'Trámites Liquidados': e.cantidad,
        'Total Recaudado ($ COP)': e.total,
        'Promedio por Acto ($ COP)': Math.round(e.promedio),
        '% de Participación Departamental': e.porcentaje ? `${e.porcentaje.toFixed(2)}%` : '0.00%'
      }));

      // 3. Mapeo Hoja 3: Consolidado por Municipio
      const datosMunicipios = this.resumenPorMunicipio().map((m, idx) => ({
        'Posición': idx + 1,
        'Municipio Jurisdicción': m.nombre,
        'Cantidad de Trámites': m.cantidad,
        'Recaudo Fiscal Total ($ COP)': m.total,
        'Promedio por Trámite ($ COP)': Math.round(m.promedio),
        '% del Total Departamental': m.porcentaje ? `${m.porcentaje.toFixed(2)}%` : '0.00%'
      }));

      // 4. Mapeo Hoja 4: Distribución por Estados
      const datosEstados = this.resumenPorEstado().map(est => ({
        'Estado de Liquidación': est.nombre,
        'Expedientes': est.cantidad,
        'Total Cuantía ($ COP)': est.total,
        'Promedio ($ COP)': Math.round(est.promedio),
        '% del Recaudo General': est.porcentaje ? `${est.porcentaje.toFixed(2)}%` : '0.00%'
      }));

      // 5. Construcción del Libro de Trabajo XLSX
      const wb = XLSX.utils.book_new();

      const wsDetalle = XLSX.utils.json_to_sheet(datosDetalle);
      XLSX.utils.book_append_sheet(wb, wsDetalle, 'Detalle Liquidaciones');

      const wsEntidades = XLSX.utils.json_to_sheet(datosEntidades);
      XLSX.utils.book_append_sheet(wb, wsEntidades, 'Consolidado por Entidad');

      const wsMunicipios = XLSX.utils.json_to_sheet(datosMunicipios);
      XLSX.utils.book_append_sheet(wb, wsMunicipios, 'Consolidado por Municipio');

      const wsEstados = XLSX.utils.json_to_sheet(datosEstados);
      XLSX.utils.book_append_sheet(wb, wsEstados, 'Distribución por Estados');

      // 6. Descargar archivo
      const fechaHoy = new Date().toISOString().substring(0, 10).replace(/-/g, '');
      const nombreArchivo = `Reporte_Fiscal_GobernacionCauca_${fechaHoy}.xlsx`;
      XLSX.writeFile(wb, nombreArchivo);

      this.toast.success(`Libro Excel descargado exitosamente (${items.length} expedientes)`);
    } catch (e) {
      console.error('Error al generar Excel:', e);
      this.toast.error('Ocurrió un error al compilar el archivo Excel');
    } finally {
      this.isExporting.set(false);
    }
  }

  // ── EXPORTACIÓN PLANA A CSV ───────────────────────────────────────────
  exportarCSV(): void {
    const items = this.todasLiquidaciones();
    if (items.length === 0) {
      this.toast.warning('No hay datos disponibles para exportar');
      return;
    }

    const separador = ';';
    const cabeceras = [
      'Liquidacion',
      'Radicado',
      'FechaExpedicion',
      'FechaVencimiento',
      'Estado',
      'EntidadRegistro',
      'Municipio',
      'NumeroDocumento',
      'IdentificacionContribuyente',
      'NombreContribuyente',
      'BaseGravable',
      'BeneficioExenciones',
      'TotalLiquidado',
      'Pagada',
      'MedioPago',
      'ReferenciaAprobacion',
      'FechaPago'
    ];

    const filas = items.map(item => [
      `"${item.numeroLiquidacion || ''}"`,
      `"${item.radicacion?.numeroRadicado || ''}"`,
      `"${item.fechaLiquidacion ? item.fechaLiquidacion.substring(0, 10) : ''}"`,
      `"${item.fechaVencimiento ? item.fechaVencimiento.substring(0, 10) : ''}"`,
      `"${this.getEstadoLabel(item)}"`,
      `"${(item.documentoRegistro?.entidadRegistro || '').replace(/"/g, '""')}"`,
      `"${(item.documentoRegistro?.municipioJurisdiccion || '').replace(/"/g, '""')}"`,
      `"${(item.documentoRegistro?.numeroDocumento || '').replace(/"/g, '""')}"`,
      `"${item.contribuyente?.numeroIdentificacion || ''}"`,
      `"${(item.contribuyente?.nombreCompleto || '').replace(/"/g, '""')}"`,
      item.totales?.subtotal || 0,
      item.totales?.totalDescuentos || 0,
      item.totales?.totalPagar || 0,
      this.esPagada(item) ? 'SI' : 'NO',
      `"${(item.pago?.medioPagoNombre || '').replace(/"/g, '""')}"`,
      `"${(item.pago?.referenciaPago || '').replace(/"/g, '""')}"`,
      `"${item.pago?.fechaPago ? item.pago.fechaPago.substring(0, 10) : ''}"`
    ].join(separador));

    const csvContent = '\uFEFF' + [cabeceras.join(separador), ...filas].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Reporte_Liquidaciones_Cauca_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    this.toast.success(`Archivo CSV generado (${items.length} registros)`);
  }

  imprimirReporte(): void {
    window.print();
  }
}

