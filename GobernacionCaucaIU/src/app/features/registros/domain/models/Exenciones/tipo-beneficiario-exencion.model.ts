/**
 * DTO para la entidad Tipo de Beneficiario de Exención.
 */
export interface TipoBeneficiarioExencion {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
}

/**
 * Payload para la creación de un nuevo Tipo de Beneficiario de Exención.
 */
export interface CrearTipoBeneficiarioExencionRequest {
  codigo: string;
  nombre: string;
}

/**
 * Payload para la actualización de un Tipo de Beneficiario de Exención existente.
 */
export interface ActualizarTipoBeneficiarioExencionRequest {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
}
