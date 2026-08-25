/**
 * DTO para la entidad Rol de Interviniente.
 */
export interface RolInterviniente {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
}

/**
 * Payload para crear un nuevo Rol de Interviniente.
 */
export interface CrearRolIntervinienteRequest {
  codigo: string;
  nombre: string;
}

/**
 * Payload para actualizar un Rol de Interviniente existente.
 */
export interface ActualizarRolIntervinienteRequest {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
}
