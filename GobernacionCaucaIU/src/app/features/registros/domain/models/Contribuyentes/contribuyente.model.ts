import { TipoPersona } from './tipo-persona.model';
import { TipoIdentificacion } from './tipo-identificacion.model';

/**
 * DTO para la entidad Contribuyente.
 */
export interface Contribuyente {
  id: number;
  tipoPersona: TipoPersona;
  tipoIdentificacion: TipoIdentificacion;
  numeroIdentificacion: string;
  nombre: string;
  direccion?: string | null;
  telefono?: string | null;
  email?: string | null;
}

/**
 * Payload para registrar un nuevo Contribuyente.
 */
export interface CrearContribuyenteDto {
  tipoPersonaId: number;
  tipoIdentificacionId: number;
  numeroIdentificacion: string;
  nombre: string;
  direccion?: string | null;
  telefono?: string | null;
  email?: string | null;
}

/**
 * Payload para actualizar un Contribuyente existente.
 */
export interface ActualizarContribuyenteDto {
  id: number;
  tipoPersonaId: number;
  tipoIdentificacionId: number;
  numeroIdentificacion: string;
  nombre: string;
  direccion?: string | null;
  telefono?: string | null;
  email?: string | null;
}
