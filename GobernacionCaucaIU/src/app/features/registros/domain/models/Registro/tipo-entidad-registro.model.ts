/**
 * DTO para la entidad Tipo de Entidad de Registro.
 */
export interface TipoEntidadRegistro {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
}

/**
 * Payload para registrar un nuevo Tipo de Entidad de Registro.
 */
export interface CrearTipoEntidadRegistroRequest {
  codigo: string;
  nombre: string;
}

/**
 * Payload para actualizar un Tipo de Entidad de Registro existente.
 */
export interface ActualizarTipoEntidadRegistroRequest {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
}
