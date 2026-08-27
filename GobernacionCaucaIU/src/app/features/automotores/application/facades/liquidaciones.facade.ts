import { Injectable, inject, signal, computed } from '@angular/core';
import { BaseApiService } from '../../../../core/services/base-api.service';
import { 
  SimulacionLiquidacion, 
  SimularLiquidacionRequest, 
  VigenciaLiquidada,
  LiquidacionMasivaRequest,
  LiquidacionMasivaResultado
} from '../../domain/models/liquidacion.model';
import { ApiResponse } from '../../domain/models/vehiculo.model';
import { catchError, map } from 'rxjs/operators';
import { of, forkJoin } from 'rxjs';

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
  vigenciasPendientes?: number[];
}

export interface GrupoLiquidacionEmitida {
  placa: string;
  marcaLinea: string;
  modelo?: number;
  contribuyenteNombre: string;
  contribuyenteDocumento: string;
  totalVehiculo: number;
  impuestoTotal: number;
  sancionTotal: number;
  interesesTotal: number;
  vigencias: LiquidacionItem[];
}

export interface ReciboModel {
  esUnificado: boolean;
  placa: string;
  marcaLinea: string;
  modelo?: number;
  contribuyenteNombre: string;
  contribuyenteDocumento: string;
  fechaEmision: Date;
  fechaLimiteTexto: string;
  esFechaInmediata: boolean;
  totalPagar: number;
  items: {
    numeroLiquidacion: string;
    vigenciaAnio: number;
    impuestoBase: number;
    descuentos: number;
    sancionExtemporaneidad: number;
    interesesMora: number;
    totalPagar: number;
  }[];
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

  readonly simulacion = signal<SimulacionLiquidacion | null>(null);
  readonly selectedVigenciaAnios = signal<number[]>([]);

  /** Selección múltiple de placas para liquidación masiva */
  readonly selectedPlacas = signal<string[]>([]);

  /** Estado del modal y proceso de liquidación masiva */
  readonly isModalMasivoOpen = signal<boolean>(false);
  readonly ejecutandoMasivo = signal<boolean>(false);
  readonly resultadoMasivo = signal<LiquidacionMasivaResultado | null>(null);
  readonly preSimulacionesMasivo = signal<SimulacionLiquidacion[]>([]);
  readonly loadingPreSimulacionMasiva = signal<boolean>(false);
  readonly vehiculoExpandidoMasivo = signal<string | null>(null);

  /** Agrupación y acordeón para pestaña de Emitidas */
  readonly placasExpandidasEmitidas = signal<string[]>([]);
  readonly reciboModalData = signal<ReciboModel | null>(null);

  /** Agrupa las liquidaciones emitidas por placa vehicular para la vista de acordeón */
  readonly liquidacionesEmitidasAgrupadas = computed(() => {
    const items = this.liquidaciones();
    if (!items || items.length === 0) return [];

    const gruposMap = new Map<string, GrupoLiquidacionEmitida>();

    for (const item of items) {
      const key = item.placa.toUpperCase();
      if (!gruposMap.has(key)) {
        gruposMap.set(key, {
          placa: item.placa,
          marcaLinea: item.marcaLinea,
          modelo: item.modelo,
          contribuyenteNombre: item.contribuyenteNombre,
          contribuyenteDocumento: item.contribuyenteDocumento,
          totalVehiculo: 0,
          impuestoTotal: 0,
          sancionTotal: 0,
          interesesTotal: 0,
          vigencias: []
        });
      }

      const g = gruposMap.get(key)!;
      g.vigencias.push(item);
      g.totalVehiculo += item.totalPagar;
      g.impuestoTotal += item.impuestoBase;
      g.sancionTotal += item.sancionExtemporaneidad;
      g.interesesTotal += item.interesesMora;
    }

    return Array.from(gruposMap.values());
  });

  /** Expande o colapsa el acordeón de un vehículo en la pestaña de emitidas */
  toggleExpandirPlacaEmitida(placa: string): void {
    let curr = [...this.placasExpandidasEmitidas()];
    if (curr.includes(placa)) {
      curr = curr.filter(p => p !== placa);
    } else {
      curr.push(placa);
    }
    this.placasExpandidasEmitidas.set(curr);
  }

  /** Abre el recibo oficial individual para 1 vigencia específica */
  abrirReciboIndividual(item: LiquidacionItem): void {
    const tieneMora = item.sancionExtemporaneidad > 0 || item.interesesMora > 0 || item.vigenciaAnio < 2026;
    this.reciboModalData.set({
      esUnificado: false,
      placa: item.placa,
      marcaLinea: item.marcaLinea,
      modelo: item.modelo,
      contribuyenteNombre: item.contribuyenteNombre,
      contribuyenteDocumento: item.contribuyenteDocumento,
      fechaEmision: new Date(),
      fechaLimiteTexto: tieneMora ? 'PAGO INMEDIATO (HOY MISMO)' : '31 DE JULIO DE 2026',
      esFechaInmediata: tieneMora,
      totalPagar: item.totalPagar,
      items: [{
        numeroLiquidacion: item.numeroLiquidacion,
        vigenciaAnio: item.vigenciaAnio,
        impuestoBase: item.impuestoBase,
        descuentos: item.descuentos,
        sancionExtemporaneidad: item.sancionExtemporaneidad,
        interesesMora: item.interesesMora,
        totalPagar: item.totalPagar
      }]
    });
  }

  /** Abre el recibo oficial unificado / completo para todas las vigencias emitidas de una placa */
  abrirReciboUnificado(grupo: GrupoLiquidacionEmitida): void {
    const tieneMora = grupo.vigencias.some(v => v.sancionExtemporaneidad > 0 || v.interesesMora > 0 || v.vigenciaAnio < 2026);
    this.reciboModalData.set({
      esUnificado: true,
      placa: grupo.placa,
      marcaLinea: grupo.marcaLinea,
      modelo: grupo.modelo,
      contribuyenteNombre: grupo.contribuyenteNombre,
      contribuyenteDocumento: grupo.contribuyenteDocumento,
      fechaEmision: new Date(),
      fechaLimiteTexto: tieneMora ? 'PAGO INMEDIATO (HOY MISMO)' : '31 DE JULIO DE 2026',
      esFechaInmediata: tieneMora,
      totalPagar: grupo.totalVehiculo,
      items: grupo.vigencias.map(v => ({
        numeroLiquidacion: v.numeroLiquidacion,
        vigenciaAnio: v.vigenciaAnio,
        impuestoBase: v.impuestoBase,
        descuentos: v.descuentos,
        sancionExtemporaneidad: v.sancionExtemporaneidad,
        interesesMora: v.interesesMora,
        totalPagar: v.totalPagar
      }))
    });
  }

  /** Cierra el modal de impresión de recibo */
  cerrarReciboModal(): void {
    this.reciboModalData.set(null);
  }

  /** Total proyectado acumulado del lote masivo habilitado con datos en BD */
  readonly totalLoteMasivoProyectado = computed(() => {
    const sims = this.preSimulacionesMasivo();
    if (!sims || sims.length === 0) return 0;
    return sims.reduce((sum, s) => sum + this.calcularSubtotalSimulacion(s), 0);
  });

  /** Calcula el subtotal liquidable de un vehículo individual en el lote masivo */
  calcularSubtotalSimulacion(sim: SimulacionLiquidacion): number {
    if (!sim || !sim.vigencias) return 0;
    const vf = this.vigenciaFiltro();
    return sim.vigencias
      .filter(v => !v.parametrosFaltantesEnDb && v.totalVigencia > 0 && (vf === 0 || v.anio === vf))
      .reduce((sum, v) => sum + v.totalVigencia, 0);
  }

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

  /** Total acumulado dinámico de las vigencias seleccionadas por el usuario */
  totalPagarSeleccionado = computed(() => {
    const sim = this.simulacion();
    if (!sim) return 0;
    const seleccionadas = this.selectedVigenciaAnios();
    return sim.vigencias
      .filter(v => seleccionadas.includes(v.anio) && !v.parametrosFaltantesEnDb)
      .reduce((sum, v) => sum + v.totalVigencia, 0);
  });

  /**
   * Solicita al Backend (.NET 10 API) el cálculo y simulación tributaria.
   * Todos los cálculos (Impuestos, Sanciones, Intereses, Descuentos, Totales) son 100% procesados por la API.
   */
  private solicitarSimulacion(placa: string): void {
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
        this.simulacion.set(res.data);
        const validas = res.data.vigencias
          .filter(v => !v.parametrosFaltantesEnDb && v.totalVigencia > 0)
          .map(v => v.anio);
        this.selectedVigenciaAnios.set(validas);
      }
    });
  }

  /**
   * Abre el modal desplegable de simulación y liquidación oficial para una placa específica.
   */
  abrirSimulacion(placa: string): void {
    this.isModalOpen.set(true);
    this.selectedVigenciaAnios.set([]);
    this.solicitarSimulacion(placa);
  }

  /** Selecciona o deselecciona una vigencia individual en estado local */
  toggleVigencia(anio: number): void {
    let nuevas = [...this.selectedVigenciaAnios()];
    if (nuevas.includes(anio)) {
      nuevas = nuevas.filter(a => a !== anio);
    } else {
      nuevas = [...nuevas, anio].sort((a, b) => b - a);
    }
    this.selectedVigenciaAnios.set(nuevas);
  }

  /** Selecciona o deselecciona todas las vigencias liquidables válidas */
  toggleSeleccionarTodos(): void {
    const sim = this.simulacion();
    if (!sim) return;

    const validas = sim.vigencias
      .filter(v => !v.parametrosFaltantesEnDb && v.totalVigencia > 0)
      .map(v => v.anio);

    if (this.selectedVigenciaAnios().length === validas.length) {
      this.selectedVigenciaAnios.set([]);
    } else {
      this.selectedVigenciaAnios.set(validas);
    }
  }

  /** Cierra el modal de simulación */
  cerrarModal(): void {
    this.isModalOpen.set(false);
    this.simulacion.set(null);
    this.selectedVigenciaAnios.set([]);
  }

  /** Selecciona o deselecciona una placa en la tabla general de pendientes */
  toggleSelectPlaca(placa: string): void {
    let curr = [...this.selectedPlacas()];
    if (curr.includes(placa)) {
      curr = curr.filter(p => p !== placa);
    } else {
      curr.push(placa);
    }
    this.selectedPlacas.set(curr);
  }

  /** Selecciona o deselecciona todas las placas de la tabla actual */
  toggleSelectAllPlacas(): void {
    const todasPlacas = this.liquidaciones().map(i => i.placa);
    if (this.selectedPlacas().length === todasPlacas.length) {
      this.selectedPlacas.set([]);
    } else {
      this.selectedPlacas.set(todasPlacas);
    }
  }

  /** Abre el modal de proceso de liquidación masiva e inspecciona la pre-revisión desglosada */
  abrirModalMasivo(): void {
    this.isModalMasivoOpen.set(true);
    this.resultadoMasivo.set(null);
    this.preSimulacionesMasivo.set([]);
    this.loadingPreSimulacionMasiva.set(true);
    this.vehiculoExpandidoMasivo.set(null);

    const placasDestino = this.selectedPlacas().length > 0 
      ? this.selectedPlacas() 
      : this.liquidaciones().map(i => i.placa);

    if (placasDestino.length === 0) {
      this.loadingPreSimulacionMasiva.set(false);
      return;
    }

    const requests = placasDestino.map(placa => 
      this.api.post<ApiResponse<SimulacionLiquidacion>>('/liquidaciones/simular', { placa }).pipe(
        map(res => res?.data || null),
        catchError(() => of(null))
      )
    );

    forkJoin(requests).subscribe(sims => {
      this.loadingPreSimulacionMasiva.set(false);
      const validSims = sims.filter((s): s is SimulacionLiquidacion => s !== null);
      this.preSimulacionesMasivo.set(validSims);
    });
  }

  /** Expande o colapsa el detalle desglosado de un vehículo en la pre-revisión masiva */
  toggleExpandirVehiculoMasivo(placa: string): void {
    if (this.vehiculoExpandidoMasivo() === placa) {
      this.vehiculoExpandidoMasivo.set(null);
    } else {
      this.vehiculoExpandidoMasivo.set(placa);
    }
  }

  /** Cierra el modal de liquidación masiva */
  cerrarModalMasivo(): void {
    this.isModalMasivoOpen.set(false);
    this.resultadoMasivo.set(null);
    this.ejecutandoMasivo.set(false);
    this.preSimulacionesMasivo.set([]);
    this.vehiculoExpandidoMasivo.set(null);
  }

  /**
   * Ejecuta la liquidación masiva a través del Backend API (.NET 10).
   */
  ejecutarLiquidacionMasiva(): void {
    this.ejecutandoMasivo.set(true);
    this.resultadoMasivo.set(null);

    const req: LiquidacionMasivaRequest = {
      placas: this.selectedPlacas().length > 0 ? this.selectedPlacas() : undefined,
      vigencia: this.vigenciaFiltro() > 0 ? this.vigenciaFiltro() : undefined
    };

    this.api.post<ApiResponse<LiquidacionMasivaResultado>>('/liquidaciones/masiva', req).pipe(
      catchError(err => {
        console.warn('Error en proceso de liquidación masiva:', err);
        this.ejecutandoMasivo.set(false);
        return of(null);
      })
    ).subscribe(res => {
      this.ejecutandoMasivo.set(false);
      if (res && res.data) {
        this.resultadoMasivo.set(res.data);
        this.selectedPlacas.set([]);
        this.cargarLiquidaciones();
        this.cargarKpis();
      }
    });
  }

  /**
   * Expedir e ingresar oficialmente la liquidación a la base de datos y trasladarla a la pestaña de liquidadas para pagos.
   */
  oficializarLiquidacion(): void {
    const sim = this.simulacion();
    if (!sim || this.selectedVigenciaAnios().length === 0) return;

    this.loading.set(true);
    this.error.set(null);

    const req: SimularLiquidacionRequest = {
      placa: sim.placa,
      vigencias: this.selectedVigenciaAnios()
    };

    this.api.post<ApiResponse<LiquidacionItem[]>>('/liquidaciones/oficializar', req).pipe(
      catchError(err => {
        console.warn('Error al oficializar liquidación:', err);
        this.error.set('No se pudo expedir la liquidación oficial en BD.');
        this.loading.set(false);
        return of(null);
      })
    ).subscribe(res => {
      this.loading.set(false);
      if (res && res.data) {
        this.cerrarModal();
        this.setTab('liquidadas');
        this.cargarKpis();
      }
    });
  }
}
