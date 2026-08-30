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
  subtotal: number;
  totalDescuentos: number;
  granTotalPagar: number;
  actos: ActoSimuladoDto[];
}
