export interface Permiso {
  id: number;
  modulo: string;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  activo: boolean;
  createdAt?: string;
}

export interface CrearPermisoRequest {
  modulo: string;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
}

export interface ActualizarPermisoRequest {
  id: number;
  modulo: string;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  activo: boolean;
}
