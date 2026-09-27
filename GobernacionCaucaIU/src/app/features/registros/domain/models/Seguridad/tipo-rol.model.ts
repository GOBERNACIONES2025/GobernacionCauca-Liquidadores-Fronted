/**
 * DTO para la entidad Tipo de Rol de Seguridad.
 */
export interface TipoRol {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  activo: boolean;
  createdAt?: string;
  createdBy?: number | null;
  updatedAt?: string | null;
  updatedBy?: number | null;
}

/**
 * Payload para registrar un nuevo Tipo de Rol de Seguridad.
 */
export interface CrearTipoRolRequest {
  codigo: string;
  nombre: string;
  descripcion?: string | null;
}

/**
 * Payload para actualizar un Tipo de Rol de Seguridad existente.
 */
export interface ActualizarTipoRolRequest {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  activo: boolean;
}

/**
 * Parámetros para consultar el listado paginado de tipos de rol.
 */
export interface TipoRolQueryParams {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  searchTerm?: string;
  activo?: boolean;
}
