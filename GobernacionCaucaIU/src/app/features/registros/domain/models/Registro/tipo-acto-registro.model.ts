import { CategoriaActo } from './categoria-acto.model';
import { NaturalezaActo } from './naturaleza-acto.model';

/**
 * DTO para la entidad Tipo de Acto de Registro.
 */
export interface TipoActoRegistro {
  id: number;
  categoriaActo: CategoriaActo;
  naturalezaActo: NaturalezaActo;
  codigo: string;
  nombre: string;
  requiereAvaluo: boolean;
  activo: boolean;
}

/**
 * Payload para registrar un nuevo Tipo de Acto de Registro.
 */
export interface CrearTipoActoRegistroRequest {
  categoriaActoId: number;
  naturalezaActoId: number;
  codigo: string;
  nombre: string;
  requiereAvaluo?: boolean;
}

/**
 * Payload para actualizar un Tipo de Acto de Registro existente.
 */
export interface ActualizarTipoActoRegistroRequest {
  id: number;
  categoriaActoId: number;
  naturalezaActoId: number;
  codigo: string;
  nombre: string;
  requiereAvaluo?: boolean;
  activo: boolean;
}
