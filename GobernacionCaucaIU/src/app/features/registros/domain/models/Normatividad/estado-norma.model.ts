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
export interface CrearEstadoNormaDto {
  codigo: string;
  nombre: string;
}

/**
 * Payload para actualizar un Estado de Norma existente.
 */
export interface ActualizarEstadoNormaDto {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
}
