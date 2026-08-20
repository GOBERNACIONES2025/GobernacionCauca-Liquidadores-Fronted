/**
 * DTO para la entidad Tipo de Persona.
 */
export interface TipoPersona {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
}

/**
 * Payload para registrar un nuevo Tipo de Persona.
 */
export interface CrearTipoPersonaRequest {
  codigo: string;
  nombre: string;
}

/**
 * Payload para actualizar un Tipo de Persona existente.
 */
export interface ActualizarTipoPersonaRequest {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
}
