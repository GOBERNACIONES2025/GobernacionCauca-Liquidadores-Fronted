/**
 * DTO para la entidad Tipo de Cálculo de Tarifa.
 */
export interface TipoCalculoTarifa {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
}

/**
 * Payload para registrar un nuevo Tipo de Cálculo de Tarifa.
 */
export interface CrearTipoCalculoTarifaDto {
  codigo: string;
  nombre: string;
}

/**
 * Payload para actualizar un Tipo de Cálculo de Tarifa existente.
 */
export interface ActualizarTipoCalculoTarifaDto {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
}
