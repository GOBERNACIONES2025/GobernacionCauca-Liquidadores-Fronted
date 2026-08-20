/**
 * DTO para la entidad Estado de Norma.
 */
export interface EstadoNorma {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
}

/**
 * Payload para registrar un nuevo Estado de Norma.
 */
export interface CrearEstadoNormaRequest {
  codigo: string;
  nombre: string;
}

/**
 * Payload para actualizar un Estado de Norma existente.
 */
export interface ActualizarEstadoNormaRequest {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
}
