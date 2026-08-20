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
export interface CrearTipoIdentificacionDto {
  codigo: string;
  nombre: string;
}

/**
 * Payload para actualizar un Tipo de Identificación existente.
 */
export interface ActualizarTipoIdentificacionDto {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
}
