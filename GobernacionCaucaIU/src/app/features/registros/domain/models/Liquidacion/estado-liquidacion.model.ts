/**
 * DTO para la entidad Estado de Liquidación.
 */
export interface EstadoLiquidacion {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
}

/**
 * Payload para registrar un nuevo Estado de Liquidación.
 */
export interface CrearEstadoLiquidacionDto {
  codigo: string;
  nombre: string;
}

/**
 * Payload para actualizar un Estado de Liquidación existente.
 */
export interface ActualizarEstadoLiquidacionDto {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
}
