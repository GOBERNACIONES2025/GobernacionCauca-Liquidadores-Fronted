import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../../core/services/base-api.service';
import { ApiResponse, PagedResult } from '../../../../../core/shared/models/shared.model';
import { TipoCalculoTarifa, CrearTipoCalculoTarifaRequest, ActualizarTipoCalculoTarifaRequest } from '../../../domain/models/Tarifas/tipo-calculo-tarifa.model';

/**
 * @description
 * Servicio de infraestructura para la gestión de Tipos de Cálculo de Tarifa.
 * Realiza peticiones HTTP al backend en el módulo de REGISTROS mediante BaseApiService.
 * 
 * @see {@link BaseApiService}
 * @see {@link TipoCalculoTarifa}
 */
@Injectable({
  providedIn: 'root',
})
export class TiposCalculoTarifaApiService {
  private api = inject(BaseApiService);
  private readonly baseUrl = '/TiposCalculoTarifa';

  /**
   * @description
   * Recupera una lista paginada de tipos de cálculo de tarifa.
   * 
   * @param {number} [pageNumber=1] - Índice de la página solicitada.
   * @param {number} [pageSize=10] - Cantidad de registros por página.
   * @returns {Observable<ApiResponse<PagedResult<TipoCalculoTarifa>>>} Respuesta paginada.
   */
  obtenerTodos(
    paramsOrPage: number | any = 1, 
    pageSize: number = 10, 
    searchTerm?: string,
    activo?: boolean,
    filtrosEspecificos?: any
  ): Observable<ApiResponse<PagedResult<TipoCalculoTarifa>>> {
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
    return this.api.get<ApiResponse<PagedResult<TipoCalculoTarifa>>>(
      this.baseUrl,
      { params },
      'REGISTROS'
    );
  }

  /**
   * @description
   * Obtiene los detalles de un tipo de cálculo de tarifa por su identificador.
   * 
   * @param {number} id - Identificador primario del tipo.
   * @returns {Observable<ApiResponse<TipoCalculoTarifa>>} Entidad encontrada.
   */
  obtenerPorId(id: number): Observable<ApiResponse<TipoCalculoTarifa>> {
    return this.api.get<ApiResponse<TipoCalculoTarifa>>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }

  /**
   * @description
   * Registra un nuevo tipo de cálculo de tarifa.
   * 
   * @param {CrearTipoCalculoTarifaRequest} command - Datos del nuevo tipo.
   * @returns {Observable<ApiResponse<number>>} ID del registro creado.
   */
  crear(command: CrearTipoCalculoTarifaRequest): Observable<ApiResponse<number>> {
    return this.api.post<ApiResponse<number>>(this.baseUrl, command, {}, 'REGISTROS');
  }

  /**
   * @description
   * Actualiza un tipo de cálculo de tarifa existente.
   * 
   * @param {number} id - Identificador a actualizar.
   * @param {ActualizarTipoCalculoTarifaRequest} command - Datos actualizados.
   * @returns {Observable<void>}
   */
  actualizar(id: number, command: ActualizarTipoCalculoTarifaRequest): Observable<void> {
    return this.api.put<void>(`${this.baseUrl}/${id}`, command, {}, 'REGISTROS');
  }

  /**
   * @description
   * Elimina un tipo de cálculo de tarifa.
   * 
   * @param {number} id - Identificador a eliminar.
   * @returns {Observable<void>}
   */
  eliminar(id: number): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }
}
