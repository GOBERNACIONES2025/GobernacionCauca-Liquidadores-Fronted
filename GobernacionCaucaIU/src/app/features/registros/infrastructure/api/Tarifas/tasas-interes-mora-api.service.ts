import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../../core/services/base-api.service';
import { ApiResponse, PagedResult } from '../../../../../core/shared/models/shared.model';
import {
  TasaInteresMora,
  CrearTasaInteresMoraRequest,
  ActualizarTasaInteresMoraRequest,
  TasaInteresMoraQueryParams
} from '../../../domain/models/Tarifas/tasa-interes-mora.model';

/**
 * @description
 * Servicio de infraestructura para la gestión de Tasas de Interés de Mora en Registros.
 * Consume los endpoints REST de TasasInteresMoraController mediante BaseApiService.
 */
@Injectable({
  providedIn: 'root'
})
export class TasasInteresMoraApiService {
  private api = inject(BaseApiService);
  private readonly baseUrl = '/TasasInteresMora';

  /**
   * Obtiene la lista paginada de tasas de interés de mora con filtros opcionales.
   */
  obtenerTodos(
    paramsOrPage: number | TasaInteresMoraQueryParams = 1,
    pageSize: number = 10,
    searchTerm?: string,
    activo?: boolean,
    vigenciaId?: number,
    fecha?: string
  ): Observable<ApiResponse<PagedResult<TasaInteresMora>>> {
    const queryParams: any = {};

    if (typeof paramsOrPage === 'object') {
      queryParams.PageNumber = paramsOrPage.pageNumber ?? 1;
      queryParams.PageSize = paramsOrPage.pageSize ?? 10;
      const term = paramsOrPage.searchTerm ?? paramsOrPage.search;
      if (term && term.trim() !== '') {
        queryParams.SearchTerm = term.trim();
      }
      if (paramsOrPage.activo !== undefined && paramsOrPage.activo !== null) {
        queryParams.Activo = paramsOrPage.activo;
      }
      if (paramsOrPage.vigenciaId) {
        queryParams.VigenciaId = paramsOrPage.vigenciaId;
      }
      if (paramsOrPage.fecha) {
        queryParams.Fecha = paramsOrPage.fecha;
      }
    } else {
      queryParams.PageNumber = paramsOrPage ?? 1;
      queryParams.PageSize = pageSize ?? 10;
      if (searchTerm && searchTerm.trim() !== '') {
        queryParams.SearchTerm = searchTerm.trim();
      }
      if (activo !== undefined && activo !== null) {
        queryParams.Activo = activo;
      }
      if (vigenciaId) {
        queryParams.VigenciaId = vigenciaId;
      }
      if (fecha) {
        queryParams.Fecha = fecha;
      }
    }

    return this.api.get<ApiResponse<PagedResult<TasaInteresMora>>>(
      this.baseUrl,
      { params: queryParams },
      'REGISTROS'
    );
  }

  /**
   * Obtiene una tasa de interés de mora específica por su ID.
   */
  obtenerPorId(id: number): Observable<ApiResponse<TasaInteresMora>> {
    return this.api.get<ApiResponse<TasaInteresMora>>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }

  /**
   * Registra una nueva tasa de interés de mora.
   */
  crear(command: CrearTasaInteresMoraRequest): Observable<ApiResponse<number>> {
    return this.api.post<ApiResponse<number>>(this.baseUrl, command, {}, 'REGISTROS');
  }

  /**
   * Actualiza una tasa de interés de mora existente.
   */
  actualizar(id: number, command: ActualizarTasaInteresMoraRequest): Observable<void> {
    return this.api.put<void>(`${this.baseUrl}/${id}`, command, {}, 'REGISTROS');
  }

  /**
   * Elimina lógicamente una tasa de interés de mora.
   */
  eliminar(id: number): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }
}
