export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: string[];
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface VigenciaFiscalItem {
  id: number;
  anio: number;
  activa: boolean;
  fechaInicio?: string;
  fechaFin?: string;
}

export interface ParametroTributario {
  id: number;
  vigenciaFiscalId: number;
  normaTributariaId?: number | null;
  codigo: string;
  nombre: string;
  fechaInicioVigencia: string; // YYYY-MM-DD
  fechaFinVigencia?: string | null; // YYYY-MM-DD
  valorDecimal?: number | null;
  valorTexto?: string | null;
  activo: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
  rowVersion?: string | null;
}

export type ParametroTributarioDto = ParametroTributario;

export interface ParametroFilterParams {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  vigenciaFiscalId?: number;
  activo?: boolean;
}

export interface CreateParametroTributarioDto {
  vigenciaFiscalId: number;
  normaTributariaId?: number | null;
  codigo: string;
  nombre: string;
  fechaInicioVigencia: string;
  fechaFinVigencia?: string | null;
  valorDecimal?: number | null;
  valorTexto?: string | null;
  activo: boolean;
}

export type CrearParametroTributarioRequest = CreateParametroTributarioDto;

export interface UpdateParametroTributarioDto {
  id?: number;
  vigenciaFiscalId: number;
  normaTributariaId?: number | null;
  codigo: string;
  nombre: string;
  fechaInicioVigencia: string;
  fechaFinVigencia?: string | null;
  valorDecimal?: number | null;
  valorTexto?: string | null;
  activo: boolean;
  rowVersion?: string | null;
}

export type ActualizarParametroTributarioRequest = UpdateParametroTributarioDto;

export interface CambiarEstadoParametroRequest {
  activo: boolean;
}

export interface CerrarParametroDto {
  id: number;
  fechaFinVigencia: string;
  crearNuevoPeriodo?: boolean;
  nuevaVigenciaFiscalId?: number | null;
  nuevaFechaInicioVigencia?: string | null;
  nuevoValorDecimal?: number | null;
  nuevoValorTexto?: string | null;
}

export type CerrarVigenciaParametroRequest = Omit<CerrarParametroDto, 'id'>;
