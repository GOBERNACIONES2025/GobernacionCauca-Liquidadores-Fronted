import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../../core/services/base-api.service';
import { ApiResponse, PagedResult } from '../../../../../core/shared/models/shared.model';
import { 
  TipoActoRegistro, 
  CrearTipoActoRegistroRequest, 
  ActualizarTipoActoRegistroRequest 
} from '../../../domain/models/Registro/tipo-acto-registro.model';

/**
 * @description
 * Servicio de infraestructura para la gestión de Tipos de Acto de Registro.
 * Realiza peticiones HTTP al backend en el módulo de REGISTROS mediante BaseApiService.
 * 
 * @see {@link BaseApiService}
 * @see {@link TipoActoRegistro}
 */
@Injectable({
  providedIn: 'root',
})
export class TiposActoRegistroApiService {
  private api = inject(BaseApiService);
  private readonly baseUrl = '/TiposActoRegistro';

  /**
   * @description
   * Recupera una lista paginada de tipos de acto de registro.
   * 
   * @param {number} [pageNumber=1] - Índice de la página solicitada.
   * @param {number} [pageSize=10] - Cantidad de registros por página.
   * @returns {Observable<ApiResponse<PagedResult<TipoActoRegistro>>>} Respuesta paginada.
   */
  obtenerTodos(
    paramsOrPage: number | any = 1, 
    pageSize: number = 10, 
    searchTerm?: string,
    activo?: boolean,
    filtrosEspecificos?: any
  ): Observable<ApiResponse<PagedResult<TipoActoRegistro>>> {
    const params: any = {};
    if (typeof paramsOrPage === 'object') {
      params.PageNumber = paramsOrPage.pageNumber ?? 1;
      params.PageSize = paramsOrPage.pageSize ?? 10;
      const term = paramsOrPage.searchTerm ?? paramsOrPage.search;
      if (term && term.trim() !== '') params.SearchTerm = term.trim();
      if (paramsOrPage.categoriaActoId) params.CategoriaActoId = paramsOrPage.categoriaActoId;
      if (paramsOrPage.naturalezaActoId) params.NaturalezaActoId = paramsOrPage.naturalezaActoId;
      if (paramsOrPage.activo !== undefined && paramsOrPage.activo !== null) params.Activo = paramsOrPage.activo;
    } else {
      params.PageNumber = paramsOrPage ?? 1;
      params.PageSize = pageSize ?? 10;
      if (searchTerm && searchTerm.trim() !== '') params.SearchTerm = searchTerm.trim();
      if (activo !== undefined && activo !== null) params.Activo = activo;
      if (filtrosEspecificos) Object.assign(params, filtrosEspecificos);
    }
    return this.api.get<ApiResponse<PagedResult<TipoActoRegistro>>>(
      this.baseUrl,
      { params },
      'REGISTROS'
    );
  }

  /**
   * @description
   * Obtiene los tipos de acto permitidos y activos para una entidad de registro.
   * 
   * @param {number} entidadRegistroId - Identificador de la entidad de registro.
   * @returns {Observable<ApiResponse<TipoActoRegistro[]>>} Lista de tipos de acto permitidos.
   */
  obtenerPorEntidad(entidadRegistroId: number, vigenciaId?: number): Observable<ApiResponse<TipoActoRegistro[]>> {
    let params: any = {};
    if (vigenciaId) params.vigenciaId = vigenciaId;
    return this.api.get<ApiResponse<TipoActoRegistro[]>>(`${this.baseUrl}/por-entidad/${entidadRegistroId}`, { params }, 'REGISTROS');
  }

  /**
   * @description
   * Obtiene los detalles de un tipo de acto de registro por su identificador.
   * 
   * @param {number} id - Identificador primario del tipo de acto.
   * @returns {Observable<ApiResponse<TipoActoRegistro>>} Entidad encontrada.
   */
  obtenerPorId(id: number): Observable<ApiResponse<TipoActoRegistro>> {
    return this.api.get<ApiResponse<TipoActoRegistro>>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }

  /**
   * @description
   * Registra un nuevo tipo de acto de registro.
   * 
   * @param {CrearTipoActoRegistroRequest} command - Datos del nuevo tipo de acto.
   * @returns {Observable<ApiResponse<number>>} ID del registro creado.
   */
  crear(command: CrearTipoActoRegistroRequest): Observable<ApiResponse<number>> {
    return this.api.post<ApiResponse<number>>(this.baseUrl, command, {}, 'REGISTROS');
  }

  /**
   * @description
   * Actualiza un tipo de acto de registro existente.
   * 
   * @param {number} id - Identificador a actualizar.
   * @param {ActualizarTipoActoRegistroRequest} command - Datos actualizados.
   * @returns {Observable<void>}
   */
  actualizar(id: number, command: ActualizarTipoActoRegistroRequest): Observable<void> {
    return this.api.put<void>(`${this.baseUrl}/${id}`, command, {}, 'REGISTROS');
  }

  /**
   * @description
   * Elimina un tipo de acto de registro.
   * 
   * @param {number} id - Identificador a eliminar.
   * @returns {Observable<void>}
   */
  eliminar(id: number): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }
}
