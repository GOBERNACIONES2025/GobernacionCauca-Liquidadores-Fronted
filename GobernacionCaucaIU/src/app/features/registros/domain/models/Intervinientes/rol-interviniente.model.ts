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
export interface CrearRolIntervinienteDto {
  codigo: string;
  nombre: string;
}

/**
 * Payload para actualizar un Rol de Interviniente existente.
 */
export interface ActualizarRolIntervinienteDto {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
}
