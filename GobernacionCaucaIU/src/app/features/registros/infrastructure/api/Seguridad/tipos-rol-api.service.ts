import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../../core/services/base-api.service';
import { ApiResponse, PagedResult } from '../../../../../core/shared/models/shared.model';
import { 
  TipoRol, 
  CrearTipoRolRequest, 
  ActualizarTipoRolRequest,
  TipoRolQueryParams 
} from '../../../domain/models/Seguridad/tipo-rol.model';

/**
 * @description
 * Servicio de infraestructura para la gestión del catálogo de Tipos de Rol de Seguridad.
 * Realiza peticiones HTTP al backend en el módulo de REGISTROS mediante BaseApiService.
 * 
 * @see {@link BaseApiService}
 * @see {@link TipoRol}
 */
@Injectable({
  providedIn: 'root',
})
export class TiposRolApiService {
  private api = inject(BaseApiService);
  private readonly baseUrl = '/TiposRol';

  /**
   * @description
   * Recupera una lista paginada de tipos de rol.
   * 
   * @param {number | TipoRolQueryParams} [paramsOrPage=1] - Índice de página u objeto de parámetros.
   * @param {number} [pageSize=10] - Cantidad de registros por página.
   * @param {string} [searchTerm] - Término de búsqueda por nombre o código.
   * @param {boolean} [activo] - Filtro opcional por estado.
   * @param {any} [filtrosEspecificos] - Filtros complementarios.
   * @returns {Observable<ApiResponse<PagedResult<TipoRol>>>}
   */
  obtenerTodos(
    paramsOrPage: number | TipoRolQueryParams = 1, 
    pageSize: number = 10, 
    searchTerm?: string,
    activo?: boolean,
    filtrosEspecificos?: any
  ): Observable<ApiResponse<PagedResult<TipoRol>>> {
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
    return this.api.get<ApiResponse<PagedResult<TipoRol>>>(
      this.baseUrl,
      { params },
      'REGISTROS'
    );
  }

  /**
   * @description
   * Obtiene los detalles de un tipo de rol por su identificador primario.
   * 
   * @param {number} id - Identificador primario.
   * @returns {Observable<ApiResponse<TipoRol>>} Entidad encontrada.
   */
  obtenerPorId(id: number): Observable<ApiResponse<TipoRol>> {
    return this.api.get<ApiResponse<TipoRol>>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }

  /**
   * @description
   * Registra un nuevo tipo de rol de seguridad en el catálogo.
   * 
   * @param {CrearTipoRolRequest} command - Datos del nuevo tipo de rol.
   * @returns {Observable<ApiResponse<number>>} ID del registro creado.
   */
  crear(command: CrearTipoRolRequest): Observable<ApiResponse<number>> {
    return this.api.post<ApiResponse<number>>(this.baseUrl, command, {}, 'REGISTROS');
  }

  /**
   * @description
   * Actualiza un tipo de rol de seguridad existente.
   * 
   * @param {number} id - Identificador a actualizar.
   * @param {ActualizarTipoRolRequest} command - Datos actualizados.
   * @returns {Observable<void>}
   */
  actualizar(id: number, command: ActualizarTipoRolRequest): Observable<void> {
    return this.api.put<void>(`${this.baseUrl}/${id}`, command, {}, 'REGISTROS');
  }

  /**
   * @description
   * Elimina un tipo de rol de seguridad (si el backend lo soporta).
   * 
   * @param {number} id - Identificador a eliminar.
   * @returns {Observable<void>}
   */
  eliminar(id: number): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }
}
