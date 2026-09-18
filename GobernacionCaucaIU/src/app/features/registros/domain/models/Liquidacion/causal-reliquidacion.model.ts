/**
 * DTO para la entidad Causal de Reliquidación.
 */
export interface CausalReliquidacion {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  requiereWizard: boolean;
  requiereSoporte: boolean;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string | null;
}

/**
 * Payload para registrar una nueva Causal de Reliquidación.
 */
export interface CrearCausalReliquidacionRequest {
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  requiereWizard: boolean;
  requiereSoporte: boolean;
}

/**
 * Payload para actualizar una Causal de Reliquidación existente.
 */
export interface ActualizarCausalReliquidacionRequest {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  requiereWizard: boolean;
  requiereSoporte: boolean;
  activo: boolean;
}
