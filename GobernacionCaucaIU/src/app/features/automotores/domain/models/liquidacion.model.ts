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
  mensaje: string;
}
