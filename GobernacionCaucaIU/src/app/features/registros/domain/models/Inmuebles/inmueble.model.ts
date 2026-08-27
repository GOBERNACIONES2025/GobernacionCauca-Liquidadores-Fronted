/**
 * DTO para la entidad AvaluoCatastral asociada a un Inmueble.
 */
export interface AvaluoCatastral {
  id: number;
  vigenciaId: number;
  valor: number;
  fuente?: string | null;
}

/**
 * Payload de comando para crear o actualizar un avalúo catastral dentro de un inmueble.
 */
export interface AvaluoCatastralCommandDto {
  id?: number | null;
  vigenciaId: number;
  valor: number;
  fuente?: string | null;
}

/**
 * DTO principal para la entidad Inmueble.
 */
export interface Inmueble {
  id: number;
  municipioId: number;
  municipioNombre: string;
  matriculaInmobiliaria: string;
  direccion?: string | null;
  createdAt: string;
  avaluos: AvaluoCatastral[];
}

/**
 * Payload para registrar un nuevo Inmueble.
 */
export interface CrearInmuebleRequest {
  municipioId: number;
  matriculaInmobiliaria: string;
  direccion?: string | null;
  avaluos?: AvaluoCatastralCommandDto[];
}

/**
 * Payload para actualizar un Inmueble existente.
 */
export interface ActualizarInmuebleRequest {
  id: number;
  municipioId: number;
  matriculaInmobiliaria: string;
  direccion?: string | null;
  avaluos?: AvaluoCatastralCommandDto[];
}

/**
 * Parámetros para la consulta y filtrado paginado de Inmuebles.
 */
export interface InmuebleQueryParams {
  pageNumber?: number;
  pageSize?: number;
  municipioId?: number;
  matriculaInmobiliaria?: string;
  busqueda?: string;
  search?: string;
  searchTerm?: string;
}
