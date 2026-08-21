/**
 * DTO para la entidad Tipo de Norma.
 */
export interface TipoNorma {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
}

/**
 * Payload para registrar un nuevo Tipo de Norma.
 */
export interface CrearTipoNormaRequest {
  codigo: string;
  nombre: string;
}

/**
 * Payload para actualizar un Tipo de Norma existente.
 */
export interface ActualizarTipoNormaRequest {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
}
