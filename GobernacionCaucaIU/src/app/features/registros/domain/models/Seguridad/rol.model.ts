/**
 * DTO para la entidad Rol de Seguridad.
 */
export interface Rol {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
  tipoRolId: number;
  tipoRolNombre?: string;
  tipoRolCodigo?: string;
}

/**
 * Payload para registrar un nuevo Rol de Seguridad.
 */
export interface CrearRolRequest {
  codigo: string;
  nombre: string;
  tipoRolId: number;
}

/**
 * Payload para actualizar un Rol de Seguridad existente.
 */
export interface ActualizarRolRequest {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
  tipoRolId: number;
}

