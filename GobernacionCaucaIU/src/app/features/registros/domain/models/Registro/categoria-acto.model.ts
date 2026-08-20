/**
 * DTO para la entidad Categoría de Acto.
 */
export interface CategoriaActo {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  activo: boolean;
}

/**
 * Payload para registrar una nueva Categoría de Acto.
 */
export interface CrearCategoriaActoDto {
  codigo: string;
  nombre: string;
  descripcion?: string | null;
}

/**
 * Payload para actualizar una Categoría de Acto existente.
 */
export interface ActualizarCategoriaActoDto {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  activo: boolean;
}
