/**
 * DTO para la entidad Naturaleza de Acto.
 */
export interface NaturalezaActo {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  esSinCuantia: boolean;
  activo: boolean;
}

/**
 * Payload para registrar una nueva Naturaleza de Acto.
 */
export interface CrearNaturalezaActoRequest {
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  esSinCuantia?: boolean;
}

/**
 * Payload para actualizar una Naturaleza de Acto existente.
 */
export interface ActualizarNaturalezaActoRequest {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  esSinCuantia?: boolean;
  activo: boolean;
}
