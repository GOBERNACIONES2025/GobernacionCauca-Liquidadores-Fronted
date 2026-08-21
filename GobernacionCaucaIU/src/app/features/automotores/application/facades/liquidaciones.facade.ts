import { Injectable, inject, signal, computed } from '@angular/core';
import { BaseApiService } from '../../../../core/services/base-api.service';
import { 
  SimulacionLiquidacion, 
  SimularLiquidacionRequest, 
  VigenciaLiquidada 
} from '../../domain/models/liquidacion.model';
import { ApiResponse } from '../../domain/models/vehiculo.model';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

/**
 * Representa un ítem individual de la lista de liquidaciones o parque pendiente.
 */
export interface LiquidacionItem {
  id: number;
  numeroLiquidacion: string;
  placa: string;
  marcaLinea: string;
  modelo?: number;
  contribuyenteNombre: string;
  contribuyenteDocumento: string;
  vigenciaAnio: number;
  baseGravableAvaluo: number;
  impuestoBase: number;
  descuentos: number;
  sancionExtemporaneidad: number;
  interesesMora: number;
  sistematizacionEstampillas: number;
  totalPagar: number;
  fechaCalculo: string;
  fechaVencimiento?: string;
  estado: string;
}

/**
 * Resumen de indicadores métricos KPI del módulo tributario.
 */
export interface LiquidacionKpis {
  totalLiquidaciones: number;
  totalRecaudoProyectado: number;
  totalImpuestoVehicular: number;
  totalSancionesMora: number;
  totalInteresesMora: number;
  totalEnMora: number;
  totalAlDia: number;
}

/**
 * Envoltorio de resultados paginados genéricos de la API.
 */
export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

/**
 * Facade de la capa de aplicación para la gestión del Módulo de Liquidaciones.
 */
@Injectable({
  providedIn: 'root'
})
export class LiquidacionesFacade {
  private api = inject(BaseApiService);

  /** Pestaña activa actual: 'sin-liquidar' (vehículos pendientes con ID nulo) o 'liquidadas' (oficiales emitidas) */
  readonly activeTab = signal<'sin-liquidar' | 'liquidadas'>('sin-liquidar');

  /** Lista reactiva de liquidaciones para la tabla */
  readonly liquidaciones = signal<LiquidacionItem[]>([]);
  readonly kpis = signal<LiquidacionKpis | null>(null);
  readonly loadingTabla = signal<boolean>(false);
  readonly page = signal<number>(1);
  readonly pageSize = signal<number>(10);
  readonly totalCount = signal<number>(0);
  readonly buscar = signal<string>('');
  readonly vigenciaFiltro = signal<number>(0);

  /** Estados del modal de simulación individual */
  readonly isModalOpen = signal<boolean>(false);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  readonly simulacionRaw = signal<SimulacionLiquidacion | null>(null);
  readonly selectedVigenciaAnios = signal<number[]>([2026, 2025, 2024]);

  /** Simulación calculada reactiva según vigencias marcadas por el usuario */
  readonly simulacionCalculada = computed(() => {
    const raw = this.simulacionRaw();
    if (!raw) return null;

    const seleccionados = this.selectedVigenciaAnios();
    const vigenciasFiltradas = raw.vigencias.filter(v => seleccionados.includes(v.anio));

    const subtotalImpuesto = vigenciasFiltradas.reduce((acc, v) => acc + v.valorImpuestoNominal, 0);
    const totalDescuentos = vigenciasFiltradas.reduce((acc, v) => acc + v.descuentoProntoPago, 0);
    const totalSanciones = vigenciasFiltradas.reduce((acc, v) => acc + v.sancionExtemporaneidad, 0);
    const totalIntereses = vigenciasFiltradas.reduce((acc, v) => acc + v.interesesMora, 0);
    const totalSistematizacion = vigenciasFiltradas.reduce((acc, v) => acc + v.derechossistematizacion, 0);

    const totalPagar = (subtotalImpuesto - totalDescuentos) + totalSanciones + totalIntereses + totalSistematizacion;

    return {
      ...raw,
      vigencias: vigenciasFiltradas,
      subtotalImpuesto,
      totalDescuentos,
      totalSanciones,
      totalIntereses,
      totalSistematizacionEstampillas: totalSistematizacion,
      totalPagar
    };
  });

  /**
   * Cambia la pestaña activa entre 'sin-liquidar' (ID nulo) y 'liquidadas' (emitidas).
   */
  setTab(tab: 'sin-liquidar' | 'liquidadas'): void {
    this.activeTab.set(tab);
    this.page.set(1);
    this.cargarLiquidaciones();
  }

  /**
   * Consulta el endpoint REST correspondiente en el backend según la pestaña activa.
   * Utiliza GET /api/liquidaciones/pendientes o GET /api/liquidaciones/emitidas.
   */
  cargarLiquidaciones(): void {
    this.loadingTabla.set(true);
    const params: any = {
      page: this.page(),
      pageSize: this.pageSize(),
      buscar: this.buscar(),
      vigencia: this.vigenciaFiltro() > 0 ? this.vigenciaFiltro() : null
    };

    const endpoint = this.activeTab() === 'sin-liquidar' ? '/liquidaciones/pendientes' : '/liquidaciones/emitidas';

    this.api.get<ApiResponse<PagedResult<LiquidacionItem>>>(endpoint, params).pipe(
      catchError(err => {
        console.warn(`Error al consultar endpoint ${endpoint}:`, err);
        this.loadingTabla.set(false);
        return of(null);
      })
    ).subscribe(res => {
      this.loadingTabla.set(false);
      if (res && res.data) {
        this.liquidaciones.set(res.data.items || []);
        this.totalCount.set(res.data.totalCount || 0);
      }
    });
  }

  /**
   * Consulta los indicadores KPI métricos del módulo en el backend.
   */
  cargarKpis(): void {
    this.api.get<ApiResponse<LiquidacionKpis>>('/liquidaciones/kpis').pipe(
      catchError(err => {
        console.warn('Error al cargar KPIs de liquidaciones:', err);
        return of(null);
      })
    ).subscribe(res => {
      if (res && res.data) {
        this.kpis.set(res.data);
      }
    });
  }

  /** Actualiza la consulta de búsqueda rápida y recarga la tabla */
  setBuscar(query: string): void {
    this.buscar.set(query);
    this.page.set(1);
    this.cargarLiquidaciones();
  }

  /** Actualiza el filtro por vigencia fiscal y recarga la tabla */
  setVigenciaFiltro(vigencia: number): void {
    this.vigenciaFiltro.set(vigencia);
    this.page.set(1);
    this.cargarLiquidaciones();
  }

  /** Cambia la página actual */
  setPage(nuevaPagina: number): void {
    this.page.set(nuevaPagina);
    this.cargarLiquidaciones();
  }

  /**
   * Abre el modal desplegable de simulación y liquidación oficial para una placa específica.
   */
  abrirSimulacion(placa: string): void {
    this.isModalOpen.set(true);
    this.loading.set(true);
    this.error.set(null);

    const req: SimularLiquidacionRequest = {
      placa: placa
    };

    this.api.post<ApiResponse<SimulacionLiquidacion>>('/liquidaciones/simular', req).pipe(
      catchError(err => {
        console.warn('Error al simular liquidación:', err);
        this.error.set('No se pudo conectar con el motor de liquidaciones.');
        this.loading.set(false);
        return of(null);
      })
    ).subscribe(res => {
      this.loading.set(false);
      if (res && res.data) {
        this.simulacionRaw.set(res.data);
        const anios = res.data.vigencias.map(v => v.anio);
        this.selectedVigenciaAnios.set(anios);
      }
    });
  }

  /** Selecciona o deselecciona una vigencia individual dentro de la simulación */
  toggleVigencia(anio: number): void {
    const actuales = this.selectedVigenciaAnios();
    if (actuales.includes(anio)) {
      if (actuales.length > 1) {
        this.selectedVigenciaAnios.set(actuales.filter(a => a !== anio));
      }
    } else {
      this.selectedVigenciaAnios.set([...actuales, anio].sort((a, b) => b - a));
    }
  }

  /** Selecciona o deselecciona todas las vigencias de la simulación */
  toggleSeleccionarTodos(): void {
    const raw = this.simulacionRaw();
    if (!raw) return;

    const todos = raw.vigencias.map(v => v.anio);
    if (this.selectedVigenciaAnios().length === todos.length) {
      this.selectedVigenciaAnios.set([todos[0]]);
    } else {
      this.selectedVigenciaAnios.set(todos);
    }
  }

  /** Cierra el modal de simulación */
  cerrarModal(): void {
    this.isModalOpen.set(false);
    this.simulacionRaw.set(null);
  }
}
