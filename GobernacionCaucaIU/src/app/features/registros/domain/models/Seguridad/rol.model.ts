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
export interface CrearRolDto {
  codigo: string;
  nombre: string;
}

/**
 * Payload para actualizar un Rol de Seguridad existente.
 */
export interface ActualizarRolDto {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
}
