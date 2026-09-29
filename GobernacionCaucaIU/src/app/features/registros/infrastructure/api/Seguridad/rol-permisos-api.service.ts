import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../../core/services/base-api.service';
import { ApiResponse } from '../../../../../core/shared/models/shared.model';
import { 
  ModuloPermisosGroup, 
  MatrizRolPermiso, 
  SincronizarPermisosRolRequest, 
  CambiarEstadoRolPermisoRequest 
} from '../../../domain/models/Seguridad/rol-permiso.model';

@Injectable({
  providedIn: 'root',
})
export class RolPermisosApiService {
  private api = inject(BaseApiService);
  private readonly baseUrl = '/RolPermisos';

  obtenerPorRol(rolId: number): Observable<ApiResponse<ModuloPermisosGroup[]>> {
    return this.api.get<ApiResponse<ModuloPermisosGroup[]>>(`${this.baseUrl}/rol/${rolId}`, {}, 'REGISTROS');
  }

  obtenerMatriz(): Observable<ApiResponse<MatrizRolPermiso[]>> {
    return this.api.get<ApiResponse<MatrizRolPermiso[]>>(`${this.baseUrl}/matriz`, {}, 'REGISTROS');
  }

  sincronizar(command: SincronizarPermisosRolRequest): Observable<void> {
    return this.api.post<void>(`${this.baseUrl}/sincronizar`, command, {}, 'REGISTROS');
  }

  cambiarEstado(command: CambiarEstadoRolPermisoRequest): Observable<void> {
    return this.api.patch<void>(`${this.baseUrl}/cambiar-estado`, command, {}, 'REGISTROS');
  }
}
