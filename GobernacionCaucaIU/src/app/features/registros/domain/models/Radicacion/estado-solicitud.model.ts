/**
 * DTO para la entidad Estado de Solicitud en el flujo de radicación.
 */
export interface EstadoSolicitud {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
}

/**
 * Payload para registrar un nuevo Estado de Solicitud.
 */
export interface CrearEstadoSolicitudRequest {
  codigo: string;
  nombre: string;
}

/**
 * Payload para actualizar un Estado de Solicitud existente.
 */
export interface ActualizarEstadoSolicitudRequest {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
}
