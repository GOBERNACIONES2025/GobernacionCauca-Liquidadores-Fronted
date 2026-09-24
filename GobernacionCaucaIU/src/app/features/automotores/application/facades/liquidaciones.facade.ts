import { Injectable, inject } from '@angular/core';
import { SimulacionLiquidacion } from '../../domain/models/liquidacion.model';

// ── Sub-facades especializados ────────────────────────────────────
import { LiquidacionListaFacade } from './liquidaciones/liquidacion-lista.facade';
import { LiquidacionSimulacionFacade } from './liquidaciones/liquidacion-simulacion.facade';
import { LiquidacionMasivaFacade } from './liquidaciones/liquidacion-masiva.facade';
import { LiquidacionFacturaFacade } from './liquidaciones/liquidacion-factura.facade';

// ── Re-exportar modelos e interfaces para compatibilidad ──────────
export type {
  PropietarioItem,
  LiquidacionItem,
  GrupoLiquidacionEmitida,
  ReciboModel,
  LiquidacionKpis,
  PagedResult
} from './liquidaciones/liquidaciones.models';

/**
 * Facade orquestador del Módulo de Liquidaciones.
 *
 * Delega en 4 sub-facades especializados manteniendo la MISMA API pública
 * que tenía el facade original — sin romper ningún componente o template existente.
 *
 *   LiquidacionListaFacade      → tabs, paginación, filtros, KPIs, selección de placas
 *   LiquidacionSimulacionFacade → modal individual, vigencias, cálculos, oficialización
 *   LiquidacionMasivaFacade     → modal masivo, pre-simulación en lote, ejecución
 *   LiquidacionFacturaFacade    → visor iframe, descarga PDF, impresión
 */
@Injectable({ providedIn: 'root' })
export class LiquidacionesFacade {

  private lista      = inject(LiquidacionListaFacade);
  private sim        = inject(LiquidacionSimulacionFacade);
  private masiva     = inject(LiquidacionMasivaFacade);
  private factura    = inject(LiquidacionFacturaFacade);

  // ════════════════════════════════════════════════════════════════
  // LISTA — Tabs, paginación, filtros, KPIs, selección de placas
  // ════════════════════════════════════════════════════════════════

  readonly activeTab                    = this.lista.activeTab;
  readonly liquidaciones                = this.lista.liquidaciones;
  readonly kpis                         = this.lista.kpis;
  readonly loadingTabla                 = this.lista.loadingTabla;
  readonly page                         = this.lista.page;
  readonly pageSize                     = this.lista.pageSize;
  readonly totalCount                   = this.lista.totalCount;
  readonly buscar                       = this.lista.buscar;
  readonly vigenciaFiltro               = this.lista.vigenciaFiltro;
  readonly selectedPlacas               = this.lista.selectedPlacas;
  readonly placasExpandidasEmitidas     = this.lista.placasExpandidasEmitidas;
  readonly totalPaginas                 = this.lista.totalPaginas;
  readonly rangoInicio                  = this.lista.rangoInicio;
  readonly rangoFin                     = this.lista.rangoFin;
  readonly liquidacionesEmitidasAgrupadas = this.lista.liquidacionesEmitidasAgrupadas;

  cargarLiquidaciones()                          { this.lista.cargarLiquidaciones(); }
  cargarKpis()                                   { this.lista.cargarKpis(); }
  setTab(tab: 'sin-liquidar' | 'liquidadas')     { this.lista.setTab(tab); }
  setBuscar(query: string)                       { this.lista.setBuscar(query); }
  setVigenciaFiltro(v: number)                   { this.lista.setVigenciaFiltro(v); }
  setPage(p: number)                             { this.lista.setPage(p); }
  setPageSize(t: number)                         { this.lista.setPageSize(t); }
  toggleSelectPlaca(placa: string)               { this.lista.toggleSelectPlaca(placa); }
  toggleSelectAllPlacas()                        { this.lista.toggleSelectAllPlacas(); }
  toggleExpandirPlacaEmitida(placa: string)      { this.lista.toggleExpandirPlacaEmitida(placa); }

  // ════════════════════════════════════════════════════════════════
  // SIMULACIÓN INDIVIDUAL — Modal, vigencias, cálculos, oficializar
  // ════════════════════════════════════════════════════════════════

  readonly isModalOpen                    = this.sim.isModalOpen;
  readonly loading                        = this.sim.loading;
  readonly error                          = this.sim.error;
  readonly simulacion                     = this.sim.simulacion;
  readonly simulacionCalculada            = this.sim.simulacionCalculada;
  readonly simulacionRaw                  = this.sim.simulacionRaw;
  readonly selectedVigenciaAnios          = this.sim.selectedVigenciaAnios;
  readonly totalPagarSeleccionado         = this.sim.totalPagarSeleccionado;
  readonly subtotalImpuestoSeleccionado   = this.sim.subtotalImpuestoSeleccionado;
  readonly descuentosSeleccionado         = this.sim.descuentosSeleccionado;
  readonly sancionesSeleccionado          = this.sim.sancionesSeleccionado;
  readonly interesesSeleccionado          = this.sim.interesesSeleccionado;
  readonly sistematizacionSeleccionado    = this.sim.sistematizacionSeleccionado;
  readonly baseGravableSeleccionada       = this.sim.baseGravableSeleccionada;
  readonly repartoMunicipioSeleccionado   = this.sim.repartoMunicipioSeleccionado;
  readonly repartoDepartamentoSeleccionado = this.sim.repartoDepartamentoSeleccionado;

  abrirSimulacion(placa: string)     { this.sim.abrirSimulacion(placa); }
  toggleVigencia(anio: number)       { this.sim.toggleVigencia(anio); }
  toggleSeleccionarTodos()           { this.sim.toggleSeleccionarTodos(); }
  cerrarModal()                      { this.sim.cerrarModal(); }

  oficializarLiquidacion(): void {
    this.sim.oficializarLiquidacion(() => {
      this.lista.setTab('liquidadas');
      this.lista.cargarKpis();
    });
  }

  // ════════════════════════════════════════════════════════════════
  // LIQUIDACIÓN MASIVA — Modal, pre-simulación en lote, ejecución
  // ════════════════════════════════════════════════════════════════

  readonly isModalMasivoOpen            = this.masiva.isModalMasivoOpen;
  readonly ejecutandoMasivo             = this.masiva.ejecutandoMasivo;
  readonly resultadoMasivo              = this.masiva.resultadoMasivo;
  readonly preSimulacionesMasivo        = this.masiva.preSimulacionesMasivo;
  readonly loadingPreSimulacionMasiva   = this.masiva.loadingPreSimulacionMasiva;
  readonly vehiculoExpandidoMasivo      = this.masiva.vehiculoExpandidoMasivo;
  readonly selectedVigenciasMasivasMap  = this.masiva.selectedVigenciasMasivasMap;
  readonly vigenciaFiltroMasivo         = this.masiva.vigenciaFiltroMasivo;
  readonly totalLoteMasivoProyectado    = this.masiva.totalLoteMasivoProyectado;

  abrirModalMasivo(): void {
    const placasDestino = this.lista.selectedPlacas().length > 0
      ? this.lista.selectedPlacas()
      : this.lista.liquidaciones().map(i => i.placa);
    this.masiva.abrirModalMasivo(placasDestino);
  }

  cerrarModalMasivo()                                    { this.masiva.cerrarModalMasivo(); }
  toggleExpandirVehiculoMasivo(placa: string)            { this.masiva.toggleExpandirVehiculoMasivo(placa); }
  toggleVigenciaMasivaVehiculo(placa: string, anio: number) { this.masiva.toggleVigenciaMasivaVehiculo(placa, anio); }
  setVigenciaFiltroMasivo(v: number)                     { this.masiva.setVigenciaFiltroMasivo(v); }
  calcularSubtotalSimulacion(sim: SimulacionLiquidacion) { return this.masiva.calcularSubtotalSimulacion(sim); }

  ejecutarLiquidacionMasiva(): void {
    this.masiva.ejecutarLiquidacionMasiva(() => {
      this.lista.selectedPlacas.set([]);
      this.lista.cargarLiquidaciones();
      this.lista.cargarKpis();
    });
  }

  // ════════════════════════════════════════════════════════════════
  // FACTURA / VISOR — Previsualización, PDF, impresión
  // ════════════════════════════════════════════════════════════════

  readonly isFacturaModalOpen   = this.factura.isFacturaModalOpen;
  readonly isFacturaLoading     = this.factura.isFacturaLoading;
  readonly facturaPreviewData   = this.factura.facturaPreviewData;
  readonly facturaPreviewHtml   = this.factura.facturaPreviewHtml;

  abrirFacturaPreview(placa: string, vigencia?: number, esUnificado: boolean = false) {
    this.factura.abrirFacturaPreview(placa, vigencia, esUnificado);
  }
  cerrarFacturaModal()   { this.factura.cerrarFacturaModal(); }
  descargarFacturaPdf(placa: string, vigencia?: number, esUnificado: boolean = false) {
    this.factura.descargarFacturaPdf(placa, vigencia, esUnificado);
  }
  imprimirFacturaPreview() { this.factura.imprimirFacturaPreview(); }
}
