export interface ConceptoTributarioDto {
  id: number;
  tipoConceptoTributarioId?: number;
  tipoConceptoCodigo?: string;
  tipoConceptoNombre?: string;
  codigo: string;
  nombre: string;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
  rowVersion?: string;
}

export interface CreateConceptoTributarioRequest {
  tipoConceptoTributarioId: number;
  codigo: string;
  nombre: string;
  activo: boolean;
}

export interface UpdateConceptoTributarioRequest {
  id: number;
  tipoConceptoTributarioId: number;
  codigo: string;
  nombre: string;
  activo: boolean;
  rowVersion?: string;
}

export interface FiltrosConceptoTributario {
  tipoConceptoTributarioId?: number;
  activo?: boolean;
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
}

export interface TipoConceptoTributarioOption {
  id: number;
  nombre: string;
  descripcion?: string;
}
