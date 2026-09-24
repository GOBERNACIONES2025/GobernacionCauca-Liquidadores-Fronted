/**
 * Modelos e interfaces compartidas del módulo de Liquidaciones.
 * Importar desde aquí en todos los sub-facades y componentes relacionados.
 */

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

  // ── Diagnóstico y Trazabilidad de Mora ──
  diasMora?: number;
  fechaLimitePago?: string;
  fechaCalculoMora?: string;
  esCalculoHoy?: boolean;
  motivoMora?: string;
  tasaMoraAplicada?: number;
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

  // Diagnóstico y fechas consolidadas
  estadoConsolidado: string;
  diasMoraMaximo: number;
  fechaLimitePago?: string;
  fechaCalculoMora?: string;
  esCalculoHoy: boolean;
  motivoMoraConsolidado: string;
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
