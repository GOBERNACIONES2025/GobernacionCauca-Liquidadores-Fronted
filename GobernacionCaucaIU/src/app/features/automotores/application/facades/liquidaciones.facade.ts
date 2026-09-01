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
import { generatePdfBlobFromHtml, downloadPdfFromHtml } from '../../../../shared/utils/pdf-exporter.util';
import { catchError, map } from 'rxjs/operators';
import { of, forkJoin } from 'rxjs';

export interface PropietarioItem {
  completeName: string;
  identification: string;
  typeIdentification: string;
}

/**
 * Representa un ítem individual de la lista de liquidaciones o parque pendiente.
 */
export interface LiquidacionItem {
  id: number;
  numeroLiquidacion: string;
  placa: string;
  marcaLinea: string;
  modelo?: number;
  propietario: PropietarioItem[];
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
  propietario: PropietarioItem[];
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
  propietario: PropietarioItem[];
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
    sistematizacionEstampillas: number;
    totalPagar: number;
  }[];
}

/**
 * Resumen de indicadores métricos KPI del módulo tributario.
 */
export interface LiquidacionKpis {
  totalVehiculosActivos: number;
  vehiculosPendientesLiquidar: number;
  vehiculosConLiquidacionesEmitidas: number;
  totalLiquidacionesEmitidas: number;
  totalRecaudoEmitido: number;
  totalImpuestoBaseEmitido: number;
  totalSancionesExtemporaneidad: number;
  interesesMoratoriosLiquidados: number;
  interesesMoratoriosPendientes: number;
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
  readonly pageSize = signal<number>(7);
  readonly totalCount = signal<number>(0);
  readonly buscar = signal<string>('');
  readonly vigenciaFiltro = signal<number>(0);

  /** Estados del modal de simulación individual */
  readonly isModalOpen = signal<boolean>(false);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  readonly simulacion = signal<SimulacionLiquidacion | null>(null);
  readonly simulacionCalculada = computed(() => this.simulacion());
  readonly simulacionRaw = computed(() => this.simulacion());
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
  /** Agrupación y acordeón para pestaña de Emitidas */
  readonly placasExpandidasEmitidas = signal<string[]>([]);

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
          propietario: item.propietario || [],
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

  /** Selección individual de vigencias por vehículo en el proceso masivo */
  readonly selectedVigenciasMasivasMap = signal<Record<string, number[]>>({});
  readonly vigenciaFiltroMasivo = signal<number>(0); // 0 = Todas, 2026, 2025, etc.

  /** Total Lote Masivo Proyectado en tiempo real */
  readonly totalLoteMasivoProyectado = computed(() => {
    const sims = this.preSimulacionesMasivo();
    if (!sims || sims.length === 0) return 0;
    const mapa = this.selectedVigenciasMasivasMap();
    return sims.reduce((sum, s) => {
      const aniosSeleccionados = mapa[s.placa] || [];
      const subtotalVeh = s.vigencias
        .filter(v => aniosSeleccionados.includes(v.anio) && !v.parametrosFaltantesEnDb)
        .reduce((vSum, v) => vSum + v.totalVigencia, 0);
      return sum + subtotalVeh;
    }, 0);
  });

  /** Calcula el subtotal individual para un vehículo en el modal masivo */
  calcularSubtotalSimulacion(sim: SimulacionLiquidacion): number {
    if (!sim || !sim.vigencias) return 0;
    const aniosSeleccionados = this.selectedVigenciasMasivasMap()[sim.placa] || [];
    return sim.vigencias
      .filter(v => aniosSeleccionados.includes(v.anio) && !v.parametrosFaltantesEnDb)
      .reduce((sum, v) => sum + v.totalVigencia, 0);
  }

  /** Activa o desactiva una vigencia individual para un vehículo en la lista masiva */
  toggleVigenciaMasivaVehiculo(placa: string, anio: number): void {
    const currMap = { ...this.selectedVigenciasMasivasMap() };
    let anios = currMap[placa] ? [...currMap[placa]] : [];
    if (anios.includes(anio)) {
      anios = anios.filter(a => a !== anio);
    } else {
      anios.push(anio);
    }
    currMap[placa] = anios;
    this.selectedVigenciasMasivasMap.set(currMap);
  }

  /** Aplica el filtro maestro por vigencia para todos los vehículos en el lote masivo */
  setVigenciaFiltroMasivo(vigencia: number): void {
    this.vigenciaFiltroMasivo.set(vigencia);
    const sims = this.preSimulacionesMasivo();
    const newMap: Record<string, number[]> = {};

    for (const s of sims) {
      const validas = s.vigencias
        .filter(v => !v.parametrosFaltantesEnDb && v.totalVigencia > 0)
        .map(v => v.anio);

      if (vigencia > 0) {
        newMap[s.placa] = validas.filter(a => a === vigencia);
      } else {
        newMap[s.placa] = validas;
      }
    }
    this.selectedVigenciasMasivasMap.set(newMap);
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
    if (nuevaPagina < 1 || nuevaPagina > this.totalPaginas()) return;
    this.page.set(nuevaPagina);
    this.cargarLiquidaciones();
  }

  /** Cambia el tamaño de página y recarga */
  setPageSize(nuevoTamano: number): void {
    this.pageSize.set(nuevoTamano);
    this.page.set(1);
    this.cargarLiquidaciones();
  }

  readonly totalPaginas = computed(() => Math.ceil(this.totalCount() / this.pageSize()) || 1);
  readonly rangoInicio = computed(() => this.totalCount() === 0 ? 0 : (this.page() - 1) * this.pageSize() + 1);
  readonly rangoFin = computed(() => Math.min(this.page() * this.pageSize(), this.totalCount()));

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
        console.log("Liquidacion" , res.data);
        this.simulacion.set(res.data);
        const validas = (res.data.vigencias || [])
          .filter(v => !v.parametrosFaltantesEnDb)
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
    this.selectedVigenciasMasivasMap.set({});
    this.vigenciaFiltroMasivo.set(0);

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

      const initMap: Record<string, number[]> = {};
      for (const s of validSims) {
        initMap[s.placa] = s.vigencias
          .filter(v => !v.parametrosFaltantesEnDb && v.totalVigencia > 0)
          .map(v => v.anio);
      }
      this.selectedVigenciasMasivasMap.set(initMap);
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
    this.selectedVigenciasMasivasMap.set({});
  }

  /**
   * Ejecuta la liquidación masiva a través del Backend API (.NET 10) con persistencia en BD.
   */
  ejecutarLiquidacionMasiva(): void {
    this.ejecutandoMasivo.set(true);
    this.resultadoMasivo.set(null);

    const sims = this.preSimulacionesMasivo();
    const mapVigencias = this.selectedVigenciasMasivasMap();

    const requests = sims.map(sim => {
      const aniosOficializar = mapVigencias[sim.placa] || [];
      if (aniosOficializar.length === 0) return of([]);

      const req: SimularLiquidacionRequest = {
        placa: sim.placa,
        vigencias: aniosOficializar
      };
      return this.api.post<ApiResponse<LiquidacionItem[]>>('/liquidaciones/oficializar', req).pipe(
        map(res => res?.data || []),
        catchError(() => of([]))
      );
    });

    forkJoin(requests).subscribe(results => {
      this.ejecutandoMasivo.set(false);
      const todosItems = results.flat().filter((i): i is LiquidacionItem => i !== null);
      
      const totalRecaudo = todosItems.reduce((sum, item) => sum + item.totalPagar, 0);
      const placasProcesadas = new Set(todosItems.map(i => i.placa)).size;

      this.resultadoMasivo.set({
        totalVehiculosProcesados: placasProcesadas,
        totalVigenciasLiquidadas: todosItems.length,
        totalRecaudoGenerado: totalRecaudo,
        numerosLiquidacionGenerados: todosItems.map(i => i.numeroLiquidacion),
        detalleLiquidaciones: todosItems,
        mensaje: `Se expedieron exitosamente ${todosItems.length} liquidación(es) oficial(es) en BD para ${placasProcesadas} vehículo(s) por un valor total de $${totalRecaudo.toLocaleString('es-CO')}.`
      });

      this.selectedPlacas.set([]);
      this.cargarLiquidaciones();
      this.cargarKpis();
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
