export interface SimularLiquidacionRequest {
  placa: string;
  vigencias?: number[];
  fechaProyeccion?: string;
}

export interface ConceptoDetalle {
  codigo: string;
  nombre: string;
  valor: number;
  orden: number;
}

export interface VigenciaLiquidada {
  anio: number;
  baseGravableAvaluo: number;
  tarifaPorcentaje: number;
  valorImpuestoNominal: number;
  descuentoProntoPago: number;
  sancionExtemporaneidad: number;
  mesesRetardo: number;
  interesesMora: number;
  diasMora: number;
  derechossistematizacion: number;
  totalVigencia: number;
  estado: string; // "PRONTO PAGO (-10%)", "AL DIA (NORMAL)", "EN MORA", "PRESCRITA"
  parametrosFaltantesEnDb?: boolean;
  advertencia?: string;
  conceptos: ConceptoDetalle[];
}

export interface SimulacionLiquidacion {
  vehiculoId: number;
  placa: string;
  marca: string;
  linea: string;
  modelo?: number;
  cilindraje?: number;
  tipoVehiculo: string;
  clase: string;
  combustible: string;
  propietarioNombre: string;
  propietarioDocumento: string;
  fechaProyeccion: string;

  // Parámetros Estatales Vigentes (2026)
  valorUvtVigente: number;
  smlmvVigente: number;
  sancionMinimaVigente: number;
  tasaUsuraEfectivaAnual: number;
  tasaInteresMoraAplicada: number;

  vigencias: VigenciaLiquidada[];

  // Totales generales
  subtotalImpuesto: number;
  totalSanciones: number;
  totalIntereses: number;
  totalDescuentos: number;
  totalSistematizacionEstampillas: number;
  totalPagar: number;
}

export interface LiquidacionMasivaRequest {
  placas?: string[];
  vigencia?: number;
  fechaProyeccion?: string;
}

export interface LiquidacionMasivaResultado {
  totalVehiculosProcesados: number;
  totalVigenciasLiquidadas: number;
  totalRecaudoGenerado: number;
  numerosLiquidacionGenerados: string[];
  detalleLiquidaciones?: any[];
  mensaje: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// MÓDULO: VEHÍCULOS OMISOS POR EMPLAZAMIENTO
// Base legal: Ley 488/1998 Art.147 | ETN Arts.715, 642, 643, 817, 634-635
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Semáforo de urgencia de mora según días de retardo.
 * Clasificación operativa para priorización de gestión de cobro.
 *   RECIENTE   → 1 – 90 días    (amarillo) — gestión amigable
 *   EMPLAZABLE → 91 – 365 días  (naranja)  — emplazamiento formal ETN Art.715
 *   CRITICO    → > 365 días     (rojo)     — cobro coactivo / riesgo prescripción 5 años
 */
export type NivelMoraOmiso = 'RECIENTE' | 'EMPLAZABLE' | 'CRITICO';

/** Calcula el nivel del semáforo dado los días de mora acumulados. */
export function calcularNivelMora(diasMora: number): NivelMoraOmiso {
  if (diasMora <= 90)  return 'RECIENTE';
  if (diasMora <= 365) return 'EMPLAZABLE';
  return 'CRITICO';
}

/** Representa un vehículo identificado como omiso en el módulo de cobro. */
export interface VehiculoOmiso {
  vehiculoId: number;
  placa: string;
  marca: string;
  linea: string;
  modelo: number;
  tipoVehiculo?: string;
  clase?: string;
  propietarioNombre: string;
  propietarioDocumento: string;
  propietarioTipoDocumento?: string;
  /** Primer año fiscal sin declarar/pagar */
  vigenciaMasAntigua: number;
  /** Lista de todos los años fiscales con deuda activa */
  vigenciasPendientes: number[];
  /** Cantidad de vigencias sin pagar */
  totalVigencias: number;
  /** Días de mora de la vigencia más antigua (base del semáforo) */
  diasMoraMaximo: number;
  /** Promedio de días de mora entre todas las vigencias */
  diasMoraPromedio: number;
  /** Meses de mora de la vigencia más antigua */
  mesesMoraMaximo: number;
  /** Intereses de mora acumulados en todas las vigencias */
  interesesMoraAcumulados: number;
  /** Sanciones por extemporaneidad acumuladas */
  sancionesAcumuladas: number;
  /** Impuesto base acumulado sin sanciones ni intereses */
  impuestoBaseAcumulado: number;
  /** Total de la deuda estimada (impuesto + sanciones + intereses) */
  totalDeudaEstimada: number;
  /** Estado del proceso de emplazamiento */
  estadoEmplazamiento: 'SIN_NOTIFICAR' | 'NOTIFICADO' | 'COBRO_COACTIVO';
  fechaUltimaGestion?: string;
  numeroActoEmplazamiento?: string;
  /** Nivel de semáforo derivado de diasMoraMaximo */
  nivelMora: NivelMoraOmiso;
  /** Desglose detallado por cada vigencia adeudada para acordeón */
  detalleVigencias?: VigenciaOmisoDetalle[];
}

/** Detalle de deuda y mora por vigencia individual */
export interface VigenciaOmisoDetalle {
  anio: number;
  diasMora: number;
  impuestoBase: number;
  sancion: number;
  intereses: number;
  totalDeuda: number;
  estadoEmplazamiento: 'SIN_NOTIFICAR' | 'NOTIFICADO' | 'COBRO_COACTIVO' | string;
  numeroActoEmplazamiento?: string;
}

/** KPIs del panel de omisos para las tarjetas de indicadores. */
export interface OmisosKpis {
  totalVehiculosOmisos: number;
  totalDeudaEnMora: number;
  totalImpuestoBase: number;
  totalInteresesMora: number;
  totalSanciones: number;
  promedioDiasMora: number;
  porcentajeParqueVehicular: number;
  totalRecientes: number;
  totalEmplazables: number;
  totalCriticos: number;
  totalSinNotificar: number;
  totalNotificados: number;
  totalEnCobroCoactivo: number;
}

/** Filtros de consulta para la tabla de vehículos omisos. */
export interface OmisosFiltros {
  page?: number;
  pageSize?: number;
  buscar?: string;
  diasMoraMinimo?: number;
  vigencia?: number;
  nivelMora?: NivelMoraOmiso | '';
  estadoEmplazamiento?: 'SIN_NOTIFICAR' | 'NOTIFICADO' | 'COBRO_COACTIVO' | '';
  ordenarPor?: 'diasMora' | 'totalDeuda' | 'vigenciaMasAntigua';
  ordenDesc?: boolean;
}

export interface FacturaPreview {
  placa: string;
  numeroLiquidacion: string;
  vigenciaAnio: number;
  propietarioNombre: string;
  propietarioDocumento: string;
  totalPagar: number;
  fechaEmision: string;
  fechaLimitePago: string;
  barcodeRawData: string;
  barcodeFormattedText: string;
  barcodeSvg: string;
  htmlContent: string;
}
