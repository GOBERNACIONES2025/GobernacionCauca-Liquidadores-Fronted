import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../../core/services/base-api.service';
import { ApiResponse, PagedResult } from '../../../../../core/shared/models/shared.model';
import { 
  CategoriaActo, 
  CrearCategoriaActoRequest, 
  ActualizarCategoriaActoRequest 
} from '../../../domain/models/Registro/categoria-acto.model';

/**
 * @description
 * Servicio de infraestructura para la gestión de Categorías de Acto.
 * Realiza peticiones HTTP al backend en el módulo de REGISTROS mediante BaseApiService.
 * 
 * @see {@link BaseApiService}
 * @see {@link CategoriaActo}
 */
@Injectable({
  providedIn: 'root',
})
export class CategoriasActoApiService {
  private api = inject(BaseApiService);
  private readonly baseUrl = '/CategoriasActo';

  /**
   * @description
   * Recupera una lista paginada de categorías de acto.
   * 
   * @param {number} [pageNumber=1] - Índice de la página solicitada.
   * @param {number} [pageSize=10] - Cantidad de registros por página.
   * @returns {Observable<ApiResponse<PagedResult<CategoriaActo>>>} Respuesta paginada.
   */
  obtenerTodos(
    paramsOrPage: number | any = 1, 
    pageSize: number = 10, 
    searchTerm?: string,
    activo?: boolean,
    filtrosEspecificos?: any
  ): Observable<ApiResponse<PagedResult<CategoriaActo>>> {
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
    return this.api.get<ApiResponse<PagedResult<CategoriaActo>>>(
      this.baseUrl,
      { params },
      'REGISTROS'
    );
  }

  /**
   * @description
   * Obtiene los detalles de una categoría de acto por su identificador.
   * 
   * @param {number} id - Identificador primario de la categoría.
   * @returns {Observable<ApiResponse<CategoriaActo>>} Entidad encontrada.
   */
  obtenerPorId(id: number): Observable<ApiResponse<CategoriaActo>> {
    return this.api.get<ApiResponse<CategoriaActo>>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }

  /**
   * @description
   * Registra una nueva categoría de acto.
   * 
   * @param {CrearCategoriaActoRequest} command - Datos de la nueva categoría.
   * @returns {Observable<ApiResponse<number>>} ID del registro creado.
   */
  crear(command: CrearCategoriaActoRequest): Observable<ApiResponse<number>> {
    return this.api.post<ApiResponse<number>>(this.baseUrl, command, {}, 'REGISTROS');
  }

  /**
   * @description
   * Actualiza una categoría de acto existente.
   * 
   * @param {number} id - Identificador a actualizar.
   * @param {ActualizarCategoriaActoRequest} command - Datos actualizados.
   * @returns {Observable<void>}
   */
  actualizar(id: number, command: ActualizarCategoriaActoRequest): Observable<void> {
    return this.api.put<void>(`${this.baseUrl}/${id}`, command, {}, 'REGISTROS');
  }

  /**
   * @description
   * Elimina una categoría de acto.
   * 
   * @param {number} id - Identificador a eliminar.
   * @returns {Observable<void>}
   */
  eliminar(id: number): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }
}
