/**
 * DTO para la entidad Rol de Seguridad.
 */
export interface Rol {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
}

/**
 * Payload para registrar un nuevo Rol de Seguridad.
 */
export interface CrearRolRequest {
  codigo: string;
  nombre: string;
}

/**
 * Payload para actualizar un Rol de Seguridad existente.
 */
export interface ActualizarRolRequest {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
}
