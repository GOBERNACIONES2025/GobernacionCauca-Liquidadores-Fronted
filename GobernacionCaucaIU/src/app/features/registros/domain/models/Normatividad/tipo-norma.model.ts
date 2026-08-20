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
export interface CrearTipoNormaDto {
  codigo: string;
  nombre: string;
}

/**
 * Payload para actualizar un Tipo de Norma existente.
 */
export interface ActualizarTipoNormaDto {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
}
