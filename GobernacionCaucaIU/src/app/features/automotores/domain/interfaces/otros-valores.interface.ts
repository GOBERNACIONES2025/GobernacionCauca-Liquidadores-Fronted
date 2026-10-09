export interface OtroValorDto {
  id: number;
  vigenciaFiscalId: number;
  vigenciaAnio?: number;
  conceptoTributarioId: number;
  conceptoCodigo?: string;
  conceptoNombre?: string;
  valor: number;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
  rowVersion?: string;
}

export interface CreateOtroValorRequest {
  vigenciaFiscalId: number;
  conceptoTributarioId: number;
  valor: number;
  activo: boolean;
}

export interface UpdateOtroValorRequest extends CreateOtroValorRequest {
  id: number;
  rowVersion?: string;
}

export interface ConceptoTributarioDto {
  id: number;
  tipoConceptoTributarioId?: number;
  codigo: string;
  nombre: string;
  activo?: boolean;
  createdAt?: string;
  updatedAt?: string;
  rowVersion?: string;
}

export interface FiltrosOtroValor {
  vigenciaFiscalId?: number;
  conceptoTributarioId?: number;
  activo?: boolean;
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
}
