/**
 * DTO para la entidad Estado de Pago.
 */
export interface EstadoPago {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
}

/**
 * Payload para registrar un nuevo Estado de Pago.
 */
export interface CrearEstadoPagoRequest {
  codigo: string;
  nombre: string;
}

/**
 * Payload para actualizar un Estado de Pago existente.
 */
export interface ActualizarEstadoPagoRequest {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
}
