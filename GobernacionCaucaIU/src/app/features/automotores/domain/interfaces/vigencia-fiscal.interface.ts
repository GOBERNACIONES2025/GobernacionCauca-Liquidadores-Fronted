export interface VigenciaFiscalDto {
  id: number;
  anio: number;
  activa: boolean;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface CreateVigenciaFiscalRequest {
  anio: number;
  activa: boolean;
  fechaInicio?: string | null;
  fechaFin?: string | null;
}

export interface UpdateVigenciaFiscalRequest {
  id: number;
  anio: number;
  activa: boolean;
  fechaInicio?: string | null;
  fechaFin?: string | null;
}

export interface FiltrosVigenciaFiscal {
  anio?: number;
  activa?: boolean;
  searchTerm?: string;
  pageNumber?: number;
  pageSize?: number;
}
