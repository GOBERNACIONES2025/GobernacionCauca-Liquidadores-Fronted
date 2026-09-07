export interface ExencionAplicadaDto {
  id: number;
  codigo: string;
  nombre: string;
  beneficio: string;
  alcance: string;
  valorDescontado: number;
}

export interface ExencionEvaluadaDto {
  id: number;
  codigo: string;
  nombre: string;
  beneficio: string;
  alcance: string;
  fueAplicada: boolean;
  estado: string;
}

export interface IntervinienteSimuladoDto {
  contribuyenteId?: number | null;
  rolIntervinienteId: number;
  nombreRol: string;
  porcentajeParticipacion: number;
}

export interface ActoSimuladoDto {
  tipoActoRegistroId: number;
  codigoTipoActo: string;
  nombreTipoActo: string;
  valorActo?: number;
  baseDeclarada?: number;
  baseCalculo: number;
  tarifaAplicada: number;
  valorBruto?: number;
  valorDescontado: number;
  valorPagar: number;
  exencionAplicada?: ExencionAplicadaDto | null;
  exencionesEvaluadas?: ExencionEvaluadaDto[];
  intervinientes?: IntervinienteSimuladoDto[];
}

export interface LiquidacionSimuladaResponse {
  numeroLiquidacion: string;
  fechaExpedicionDocumento?: string;
  fechaRadicacion?: string;
  fechaLimiteOportuna?: string;
  fechaVencimiento?: string;
  diasPlazoPermitido?: number;
  diasTranscurridos?: number;
  tipoEntidadDestino?: string;
  subtotal: number;
  totalDescuentos: number;
  sancionExtemporaneidad?: number;
  interesesMora?: number;
  totalMora?: number;
  diasMora?: number;
  mesesMora?: number;
  esExtemporaneo?: boolean;
  tasaInteresDiariaAplicada?: number;
  tasaInteresMensualAplicada?: number;
  porcentajeSancionAplicado?: number;
  granTotalPagar: number;
  actos: ActoSimuladoDto[];
}
