import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../../core/services/base-api.service';
import { ApiResponse, PagedResult } from '../../../../../core/shared/models/shared.model';
import { 
  Contribuyente, 
  CrearContribuyenteRequest, 
  ActualizarContribuyenteRequest 
} from '../../../domain/models/Contribuyentes/contribuyente.model';

/**
 * @description
 * Servicio de infraestructura para la gestión de Contribuyentes en Registros.
 * Realiza peticiones HTTP al backend en el módulo de REGISTROS mediante BaseApiService.
 * 
 * @see {@link BaseApiService}
 * @see {@link Contribuyente}
 */
@Injectable({
  providedIn: 'root',
})
export class ContribuyentesApiService {
  private api = inject(BaseApiService);
  private readonly baseUrl = '/Contribuyentes';

  /**
   * @description
   * Recupera una lista paginada de contribuyentes.
   * 
   * @param {number} [pageNumber=1] - Índice de la página solicitada.
   * @param {number} [pageSize=10] - Cantidad de registros por página.
   * @returns {Observable<ApiResponse<PagedResult<Contribuyente>>>} Respuesta paginada.
   */
  obtenerTodos(
    paramsOrPage: number | any = 1, 
    pageSize: number = 10, 
    searchTerm?: string,
    activo?: boolean,
    filtrosEspecificos?: any
  ): Observable<ApiResponse<PagedResult<Contribuyente>>> {
    const params: any = {};
    if (typeof paramsOrPage === 'object') {
      params.PageNumber = paramsOrPage.pageNumber ?? 1;
      params.PageSize = paramsOrPage.pageSize ?? 10;
      const term = paramsOrPage.searchTerm ?? paramsOrPage.search;
      if (term && term.trim() !== '') params.SearchTerm = term.trim();
      if (paramsOrPage.activo !== undefined && paramsOrPage.activo !== null) params.Activo = paramsOrPage.activo;
      if (paramsOrPage.tipoIdentificacionId) params.TipoIdentificacionId = paramsOrPage.tipoIdentificacionId;
      if (paramsOrPage.tipoPersonaId) params.TipoPersonaId = paramsOrPage.tipoPersonaId;
      if (paramsOrPage.numeroIdentificacion) params.NumeroIdentificacion = paramsOrPage.numeroIdentificacion;
    } else {
      params.PageNumber = paramsOrPage ?? 1;
      params.PageSize = pageSize ?? 10;
      if (searchTerm && searchTerm.trim() !== '') params.SearchTerm = searchTerm.trim();
      if (activo !== undefined && activo !== null) params.Activo = activo;
      if (filtrosEspecificos) Object.assign(params, filtrosEspecificos);
    }
    return this.api.get<ApiResponse<PagedResult<Contribuyente>>>(
      this.baseUrl,
      { params },
      'REGISTROS'
    );
  }

  /**
   * @description
   * Obtiene los detalles de un contribuyente por su identificador.
   * 
   * @param {number} id - Identificador primario del contribuyente.
   * @returns {Observable<ApiResponse<Contribuyente>>} Entidad encontrada.
   */
  obtenerPorId(id: number): Observable<ApiResponse<Contribuyente>> {
    return this.api.get<ApiResponse<Contribuyente>>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }

  /**
   * @description
   * Registra un nuevo contribuyente.
   * 
   * @param {CrearContribuyenteRequest} command - Datos del nuevo contribuyente.
   * @returns {Observable<ApiResponse<number>>} ID del contribuyente creado.
   */
  crear(command: CrearContribuyenteRequest): Observable<ApiResponse<number>> {
    return this.api.post<ApiResponse<number>>(this.baseUrl, command, {}, 'REGISTROS');
  }

  /**
   * @description
   * Actualiza un contribuyente existente.
   * 
   * @param {number} id - Identificador a actualizar.
   * @param {ActualizarContribuyenteRequest} command - Datos actualizados.
   * @returns {Observable<void>}
   */
  actualizar(id: number, command: ActualizarContribuyenteRequest): Observable<void> {
    return this.api.put<void>(`${this.baseUrl}/${id}`, command, {}, 'REGISTROS');
  }

  /**
   * @description
   * Elimina un contribuyente.
   * 
   * @param {number} id - Identificador a eliminar.
   * @returns {Observable<void>}
   */
  eliminar(id: number): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }
}
