import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../../core/services/base-api.service';
import { ApiResponse, PagedResult } from '../../../../../core/shared/models/shared.model';
import { 
  CausalAnulacion, 
  CrearCausalAnulacionRequest, 
  ActualizarCausalAnulacionRequest 
} from '../../../domain/models/Liquidacion/causal-anulacion.model';

/**
 * Servicio de infraestructura para la gestión de Causales de Anulación.
 */
@Injectable({
  providedIn: 'root',
})
export class CausalesAnulacionApiService {
  private api = inject(BaseApiService);
  private readonly baseUrl = '/CausalesAnulacion';

  obtenerTodos(
    paramsOrPage: number | any = 1, 
    pageSize: number = 10, 
    searchTerm?: string,
    activo?: boolean,
    filtrosEspecificos?: any
  ): Observable<ApiResponse<PagedResult<CausalAnulacion>>> {
    const params: any = {};
    if (typeof paramsOrPage === 'object') {
      params.PageNumber = paramsOrPage.pageNumber ?? 1;
      params.PageSize = paramsOrPage.pageSize ?? 10;
      const term = paramsOrPage.searchTerm ?? paramsOrPage.search;
      if (term && term.trim() !== '') params.SearchTerm = term.trim();
      if (paramsOrPage.activo !== undefined && paramsOrPage.activo !== null) params.Activo = paramsOrPage.activo;
    } else {
      params.PageNumber = paramsOrPage ?? 1;
      params.PageSize = pageSize ?? 10;
      if (searchTerm && searchTerm.trim() !== '') params.SearchTerm = searchTerm.trim();
      if (activo !== undefined && activo !== null) params.Activo = activo;
      if (filtrosEspecificos) Object.assign(params, filtrosEspecificos);
    }
    return this.api.get<ApiResponse<PagedResult<CausalAnulacion>>>(
      this.baseUrl,
      { params },
      'REGISTROS'
    );
  }


  obtenerPorId(id: number): Observable<ApiResponse<CausalAnulacion>> {
    return this.api.get<ApiResponse<CausalAnulacion>>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }


  crear(command: CrearCausalAnulacionRequest): Observable<ApiResponse<number>> {
    return this.api.post<ApiResponse<number>>(this.baseUrl, command, {}, 'REGISTROS');
  }


  actualizar(id: number, command: ActualizarCausalAnulacionRequest): Observable<void> {
    return this.api.put<void>(`${this.baseUrl}/${id}`, command, {}, 'REGISTFOS');
  }

  eliminar(id: number): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }
}
