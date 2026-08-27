import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../../core/services/base-api.service';
import { ApiResponse, PagedResult } from '../../../../../core/shared/models/shared.model';
import { 
  EstadoPago, 
  CrearEstadoPagoRequest, 
  ActualizarEstadoPagoRequest 
} from '../../../domain/models/Pagos/estado-pago.model';

/**
 * @description
 * Servicio de infraestructura para la gestión de Estados de Pago en Registros.
 * Realiza peticiones HTTP al backend en el módulo de REGISTROS mediante BaseApiService.
 * 
 * @see {@link BaseApiService}
 * @see {@link EstadoPago}
 */
@Injectable({
  providedIn: 'root',
})
export class EstadosPagoApiService {
  private api = inject(BaseApiService);
  private readonly baseUrl = '/EstadosPago';

  /**
   * @description
   * Recupera una lista paginada de estados de pago.
   * 
   * @param {number} [pageNumber=1] - Índice de la página solicitada.
   * @param {number} [pageSize=10] - Cantidad de registros por página.
   * @returns {Observable<ApiResponse<PagedResult<EstadoPago>>>} Respuesta paginada.
   */
  obtenerTodos(
    paramsOrPage: number | any = 1, 
    pageSize: number = 10, 
    searchTerm?: string,
    activo?: boolean,
    filtrosEspecificos?: any
  ): Observable<ApiResponse<PagedResult<EstadoPago>>> {
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
    return this.api.get<ApiResponse<PagedResult<EstadoPago>>>(
      this.baseUrl,
      { params },
      'REGISTROS'
    );
  }

  /**
   * @description
   * Obtiene los detalles de un estado de pago por su identificador.
   * 
   * @param {number} id - Identificador primario del estado.
   * @returns {Observable<ApiResponse<EstadoPago>>} Entidad encontrada.
   */
  obtenerPorId(id: number): Observable<ApiResponse<EstadoPago>> {
    return this.api.get<ApiResponse<EstadoPago>>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }

  /**
   * @description
   * Registra un nuevo estado de pago.
   * 
   * @param {CrearEstadoPagoRequest} command - Datos del nuevo estado.
   * @returns {Observable<ApiResponse<number>>} ID del registro creado.
   */
  crear(command: CrearEstadoPagoRequest): Observable<ApiResponse<number>> {
    return this.api.post<ApiResponse<number>>(this.baseUrl, command, {}, 'REGISTROS');
  }

  /**
   * @description
   * Actualiza un estado de pago existente.
   * 
   * @param {number} id - Identificador a actualizar.
   * @param {ActualizarEstadoPagoRequest} command - Datos actualizados.
   * @returns {Observable<void>}
   */
  actualizar(id: number, command: ActualizarEstadoPagoRequest): Observable<void> {
    return this.api.put<void>(`${this.baseUrl}/${id}`, command, {}, 'REGISTROS');
  }

  /**
   * @description
   * Elimina un estado de pago.
   * 
   * @param {number} id - Identificador a eliminar.
   * @returns {Observable<void>}
   */
  eliminar(id: number): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }
}
