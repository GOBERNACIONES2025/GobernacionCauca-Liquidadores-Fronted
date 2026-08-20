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
export interface CrearEstadoLiquidacionRequest {
  codigo: string;
  nombre: string;
}

/**
 * Payload para actualizar un Estado de Liquidación existente.
 */
export interface ActualizarEstadoLiquidacionRequest {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
}
