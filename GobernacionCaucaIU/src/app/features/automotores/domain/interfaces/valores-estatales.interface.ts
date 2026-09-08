export type ValoresEstatalesTab = 'UVT' | 'TASAS' | 'SALARIOS';

/** DTO UVT Histórico */
export interface UvtHistoricoDto {
  idUvt: number;
  anio: number;
  valor: number;
  fuenteLegal?: string;
}

export interface CreateUvtHistoricoRequest {
  anio: number;
  valor: number;
  fuenteLegal?: string;
}

export interface UpdateUvtHistoricoRequest {
  idUvt: number;
  anio: number;
  valor: number;
  fuenteLegal?: string;
}

/** DTO Tasas de Interés */
export interface TasasInteresDto {
  idTasaInteres: number;
  tipoTasaInteres: string;
  periodicidad: string;
  valor: number;
  vigenciaDesde: string;
  vigenciaHasta?: string;
  fuenteLegal?: string;
}

export interface CreateTasaInteresRequest {
  tipoTasaInteres: string;
  periodicidad: string;
  valor: number;
  vigenciaDesde: string;
  vigenciaHasta?: string;
  fuenteLegal?: string;
}

export interface UpdateTasaInteresRequest {
  idTasaInteres: number;
  tipoTasaInteres: string;
  periodicidad: string;
  valor: number;
  vigenciaDesde: string;
  vigenciaHasta?: string;
  fuenteLegal?: string;
}

/** DTO Salario Mínimo */
export interface SalarioMinimoDto {
  idSalario: number;
  anio: number;
  valor: number;
  auxilioTransporte: number;
}

export interface CreateSalarioMinimoRequest {
  anio: number;
  valor: number;
  auxilioTransporte: number;
}

export interface UpdateSalarioMinimoRequest {
  idSalario: number;
  anio: number;
  valor: number;
  auxilioTransporte: number;
}
