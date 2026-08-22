export interface ActoSimuladoDto {
  tipoActoRegistroId: number;
  codigoTipoActo: string;
  nombreTipoActo: string;
  baseCalculo: number;
  tarifaAplicada: number;
  valorDescontado: number;
  valorPagar: number;
}

export interface LiquidacionSimuladaResponse {
  granTotalPagar: number;
  actos: ActoSimuladoDto[];
}
