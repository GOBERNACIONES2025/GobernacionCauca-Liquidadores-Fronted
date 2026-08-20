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
  activo: boolean;
}

/**
 * Payload para registrar un nuevo Tipo de Acto de Registro.
 */
export interface CrearTipoActoRegistroDto {
  categoriaActoId: number;
  naturalezaActoId: number;
  codigo: string;
  nombre: string;
}

/**
 * Payload para actualizar un Tipo de Acto de Registro existente.
 */
export interface ActualizarTipoActoRegistroDto {
  id: number;
  categoriaActoId: number;
  naturalezaActoId: number;
  codigo: string;
  nombre: string;
  activo: boolean;
}
