import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../../core/services/base-api.service';
import { ApiResponse, PagedResult } from '../../../../../core/shared/models/shared.model';
import { 
  Permiso, 
  CrearPermisoRequest, 
  ActualizarPermisoRequest 
} from '../../../domain/models/Seguridad/permiso.model';

@Injectable({
  providedIn: 'root',
})
export class PermisosApiService {
  private api = inject(BaseApiService);
  private readonly baseUrl = '/Permisos';

  obtenerTodos(
    paramsOrPage: number | any = 1, 
    pageSize: number = 10, 
    searchTerm?: string,
    activo?: boolean,
    filtrosEspecificos?: any
  ): Observable<ApiResponse<PagedResult<Permiso>>> {
    const params: any = {};
    if (typeof paramsOrPage === 'object') {
      params.PageNumber = paramsOrPage.pageNumber ?? 1;
      params.PageSize = paramsOrPage.pageSize ?? 10;
      const term = paramsOrPage.searchTerm ?? paramsOrPage.search;
      if (term && term.trim() !== '') params.SearchTerm = term.trim();
      if (paramsOrPage.activo !== undefined && paramsOrPage.activo !== null) params.Activo = paramsOrPage.activo;
      if (paramsOrPage.modulo && paramsOrPage.modulo.trim() !== '') params.Modulo = paramsOrPage.modulo.trim();
    } else {
      params.PageNumber = paramsOrPage ?? 1;
      params.PageSize = pageSize ?? 10;
      if (searchTerm && searchTerm.trim() !== '') params.SearchTerm = searchTerm.trim();
      if (activo !== undefined && activo !== null) params.Activo = activo;
      if (filtrosEspecificos) Object.assign(params, filtrosEspecificos);
    }
    return this.api.get<ApiResponse<PagedResult<Permiso>>>(
      this.baseUrl,
      { params },
      'REGISTROS'
    );
  }

  obtenerPorId(id: number): Observable<ApiResponse<Permiso>> {
    return this.api.get<ApiResponse<Permiso>>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }

  obtenerModulos(): Observable<ApiResponse<string[]>> {
    return this.api.get<ApiResponse<string[]>>(`${this.baseUrl}/modulos`, {}, 'REGISTROS');
  }

  crear(command: CrearPermisoRequest): Observable<ApiResponse<number>> {
    return this.api.post<ApiResponse<number>>(this.baseUrl, command, {}, 'REGISTROS');
  }

  actualizar(id: number, command: ActualizarPermisoRequest): Observable<void> {
    return this.api.put<void>(`${this.baseUrl}/${id}`, command, {}, 'REGISTROS');
  }

  eliminar(id: number): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }
}
