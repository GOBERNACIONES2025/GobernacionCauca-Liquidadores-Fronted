export interface RolPermisoItem {
  id?: number | null;
  rolId: number;
  permisoId: number;
  modulo: string;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  asignado: boolean;
  permisoActivo: boolean;
}

export interface ModuloPermisosGroup {
  modulo: string;
  totalPermisos: number;
  permisosAsignados: number;
  permisos: RolPermisoItem[];
}

export interface SincronizarPermisosRolRequest {
  rolId: number;
  permisosIds: number[];
}

export interface CambiarEstadoRolPermisoRequest {
  rolId: number;
  permisoId: number;
  activo: boolean;
}

export interface MatrizRolPermiso {
  rolId: number;
  rolNombre: string;
  rolCodigo: string;
  permisosCodigos: string[];
}
