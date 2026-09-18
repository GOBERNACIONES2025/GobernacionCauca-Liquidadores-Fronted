/**
 * DTO para la entidad Causal de Anulación.
 */
export interface CausalAnulacion {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  requiereSoporte: boolean;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string | null;
}

/**
 * Payload para registrar una nueva Causal de Anulación.
 */
export interface CrearCausalAnulacionRequest {
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  requiereSoporte: boolean;
}

/**
 * Payload para actualizar una Causal de Anulación existente.
 */
export interface ActualizarCausalAnulacionRequest {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  requiereSoporte: boolean;
  activo: boolean;
}
