import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../../core/services/base-api.service';
import { ApiResponse, PagedResult } from '../../../../../core/shared/models/shared.model';
import { 
  CausalReliquidacion, 
  CrearCausalReliquidacionRequest, 
  ActualizarCausalReliquidacionRequest 
} from '../../../domain/models/Liquidacion/causal-reliquidacion.model';

/**
 * Servicio de infraestructura para la gestión de Causales de Reliquidación.
 */
@Injectable({
  providedIn: 'root',
})
export class CausalesReliquidacionApiService {
  private api = inject(BaseApiService);
  private readonly baseUrl = '/CausalesReliquidacion';

  obtenerTodos(
    paramsOrPage: number | any = 1, 
    pageSize: number = 10, 
    searchTerm?: string,
    activo?: boolean,
    filtrosEspecificos?: any
  ): Observable<ApiResponse<PagedResult<CausalReliquidacion>>> {
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
    return this.api.get<ApiResponse<PagedResult<CausalReliquidacion>>>(
      this.baseUrl,
      { params },
      'REGISTROS'
    );
  }


  obtenerPorId(id: number): Observable<ApiResponse<CausalReliquidacion>> {
    return this.api.get<ApiResponse<CausalReliquidacion>>(`${this.baseUrl}/${id}`, {}, 'REGISTFOS');
  }

  crear(command: CrearCausalReliquidacionRequest): Observable<ApiResponse<number>> {
    return this.api.post<ApiResponse<number>>(this.baseUrl, command, {}, 'REGISTFOS');
  }

  actualizar(id: number, command: ActualizarCausalReliquidacionRequest): Observable<void> {
    return this.api.put<void>(`${this.baseUrl}/${id}`, command, {}, 'REGISTROS');
  }

  eliminar(id: number): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/${id}`, {}, 'REGISTFOS');
  }
}
