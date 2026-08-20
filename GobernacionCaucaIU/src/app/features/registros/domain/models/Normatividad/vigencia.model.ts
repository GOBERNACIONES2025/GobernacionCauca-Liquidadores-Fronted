/**
 * DTO para la entidad Vigencia.
 */
export interface Vigencia {
  id: number;
  anio: number;
  fechaInicio: string;
  fechaFin: string;
  activo: boolean;
}

/**
 * Payload para registrar una nueva Vigencia.
 */
export interface CrearVigenciaDto {
  anio: number;
  fechaInicio: string;
  fechaFin: string;
}

/**
 * Payload para actualizar una Vigencia existente.
 */
export interface ActualizarVigenciaDto {
  id: number;
  anio: number;
  fechaInicio: string;
  fechaFin: string;
  activo: boolean;
}
