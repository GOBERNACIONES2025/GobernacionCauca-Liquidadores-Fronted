import { Rol } from './rol.model';

/**
 * DTO para la entidad Usuario de Seguridad.
 */
export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  activo?: boolean | null;
  roles: Rol[];
  departamentoId?: number | null;
  departamentoNombre?: string | null;
  municipioId?: number | null;
  municipioNombre?: string | null;
  entidadRegistroId?: number | null;
  entidadRegistroNombre?: string | null;
}

/**
 * Payload para registrar un nuevo Usuario.
 */
export interface CrearUsuarioRequest {
  nombre: string;
  email: string;
  password: string;
  rolesIds: number[];
  departamentoId?: number | null;
  municipioId?: number | null;
  entidadRegistroId?: number | null;
}

/**
 * Payload para actualizar un Usuario existente.
 */
export interface ActualizarUsuarioRequest {
  id: number;
  nombre: string;
  email: string;
  activo: boolean;
  rolesIds: number[];
  password?: string | null;
  departamentoId?: number | null;
  municipioId?: number | null;
  entidadRegistroId?: number | null;
}

/**
 * Parámetros para consultar el listado paginado de usuarios.
 */
export interface UsuarioQueryParams {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  searchTerm?: string;
  sort?: string;
  activo?: boolean;
  rolId?: number;
}
