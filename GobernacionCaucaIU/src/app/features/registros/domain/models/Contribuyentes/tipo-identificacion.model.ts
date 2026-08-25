/**
 * DTO para la entidad Tipo de Identificación.
 */
export interface TipoIdentificacion {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
}

/**
 * Payload para registrar un nuevo Tipo de Identificación.
 */
export interface CrearTipoIdentificacionRequest {
  codigo: string;
  nombre: string;
}

/**
 * Payload para actualizar un Tipo de Identificación existente.
 */
export interface ActualizarTipoIdentificacionRequest {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
}
