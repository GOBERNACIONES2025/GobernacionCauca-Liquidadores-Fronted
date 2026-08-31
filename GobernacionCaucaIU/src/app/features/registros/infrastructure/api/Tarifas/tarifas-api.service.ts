import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../../core/services/base-api.service';
import { ApiResponse, PagedResult } from '../../../../../core/shared/models/shared.model';
import { 
  Tarifa, 
  CrearTarifaRequest, 
  ActualizarTarifaRequest, 
  TarifaQueryParams 
} from '../../../domain/models/Tarifas/tarifa.model';

/**
 * @description
 * Servicio de infraestructura para la gestión de Tarifas en Registros.
 * Realiza peticiones HTTP al backend en el módulo de REGISTROS mediante BaseApiService.
 * 
 * @see {@link BaseApiService}
 * @see {@link Tarifa}
 */
@Injectable({
  providedIn: 'root',
})
export class TarifasApiService {
  private api = inject(BaseApiService);
  private readonly baseUrl = '/Tarifas';

  /**
   * @description
   * Recupera una lista paginada de tarifas con filtros opcionales.
   * 
   * @param {TarifaQueryParams} [params] - Parámetros de filtrado y paginación.
   * @returns {Observable<ApiResponse<PagedResult<Tarifa>>>} Respuesta paginada.
   */
  obtenerTodos(
    paramsOrPage: number | TarifaQueryParams = 1,
    pageSize: number = 10,
    searchTerm?: string,
    activo?: boolean,
    filtrosEspecificos?: any
  ): Observable<ApiResponse<PagedResult<Tarifa>>> {
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
      if (paramsOrPage.departamentoId) queryParams.DepartamentoId = paramsOrPage.departamentoId;
      if (paramsOrPage.tipoActoRegistroId) queryParams.TipoActoRegistroId = paramsOrPage.tipoActoRegistroId;
      if (paramsOrPage.vigenciaId) queryParams.VigenciaId = paramsOrPage.vigenciaId;
      if (paramsOrPage.normaId) queryParams.NormaId = paramsOrPage.normaId;
      if (paramsOrPage.tipoCalculoTarifaId) queryParams.TipoCalculoTarifaId = paramsOrPage.tipoCalculoTarifaId;
    } else {
      queryParams.PageNumber = paramsOrPage ?? 1;
      queryParams.PageSize = pageSize ?? 10;
      if (searchTerm && searchTerm.trim() !== '') {
        queryParams.SearchTerm = searchTerm.trim();
      }
      if (activo !== undefined && activo !== null) {
        queryParams.Activo = activo;
      }
      if (filtrosEspecificos) {
        Object.assign(queryParams, filtrosEspecificos);
      }
    }

    return this.api.get<ApiResponse<PagedResult<Tarifa>>>(
      this.baseUrl,
      { params: queryParams },
      'REGISTROS'
    );
  }

  /**
   * @description
   * Obtiene los detalles de una tarifa por su identificador.
   * 
   * @param {number} id - Identificador primario de la tarifa.
   * @returns {Observable<ApiResponse<Tarifa>>} Entidad encontrada.
   */
  obtenerPorId(id: number): Observable<ApiResponse<Tarifa>> {
    return this.api.get<ApiResponse<Tarifa>>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }

  /**
   * @description
   * Registra una nueva tarifa en el sistema.
   * 
   * @param {CrearTarifaRequest} command - Datos de la nueva tarifa.
   * @returns {Observable<ApiResponse<number>>} ID del registro creado.
   */
  crear(command: CrearTarifaRequest): Observable<ApiResponse<number>> {
    return this.api.post<ApiResponse<number>>(this.baseUrl, command, {}, 'REGISTROS');
  }

  /**
   * @description
   * Actualiza una tarifa existente.
   * 
   * @param {number} id - Identificador a actualizar.
   * @param {ActualizarTarifaRequest} command - Datos actualizados.
   * @returns {Observable<void>}
   */
  actualizar(id: number, command: ActualizarTarifaRequest): Observable<void> {
    return this.api.put<void>(`${this.baseUrl}/${id}`, command, {}, 'REGISTROS');
  }

  /**
   * @description
   * Elimina lógicamente una tarifa (Inactiva).
   * 
   * @param {number} id - Identificador a eliminar.
   * @returns {Observable<void>}
   */
  eliminar(id: number): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }
}
