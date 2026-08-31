import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../../core/services/base-api.service';
import { ApiResponse, PagedResult } from '../../../../../core/shared/models/shared.model';
import { 
  Rol, 
  CrearRolRequest, 
  ActualizarRolRequest 
} from '../../../domain/models/Seguridad/rol.model';

/**
 * @description
 * Servicio de infraestructura para la gestión de Roles de Seguridad.
 * Realiza peticiones HTTP al backend en el módulo de REGISTROS mediante BaseApiService.
 * 
 * @see {@link BaseApiService}
 * @see {@link Rol}
 */
@Injectable({
  providedIn: 'root',
})
export class RolesApiService {
  private api = inject(BaseApiService);
  private readonly baseUrl = '/Roles';

  /**
   * @description
   * Recupera una lista paginada de roles de seguridad.
   * 
   * @param {number} [pageNumber=1] - Índice de la página solicitada.
   * @param {number} [pageSize=10] - Cantidad de registros por página.
   * @returns {Observable<ApiResponse<PagedResult<Rol>>>} Respuesta paginada.
   */
  obtenerTodos(
    paramsOrPage: number | any = 1, 
    pageSize: number = 10, 
    searchTerm?: string,
    activo?: boolean,
    filtrosEspecificos?: any
  ): Observable<ApiResponse<PagedResult<Rol>>> {
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
    return this.api.get<ApiResponse<PagedResult<Rol>>>(
      this.baseUrl,
      { params },
      'REGISTROS'
    );
  }

  /**
   * @description
   * Obtiene los detalles de un rol por su identificador.
   * 
   * @param {number} id - Identificador primario del rol.
   * @returns {Observable<ApiResponse<Rol>>} Entidad encontrada.
   */
  obtenerPorId(id: number): Observable<ApiResponse<Rol>> {
    return this.api.get<ApiResponse<Rol>>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }

  /**
   * @description
   * Registra un nuevo rol de seguridad.
   * 
   * @param {CrearRolRequest} command - Datos del nuevo rol.
   * @returns {Observable<ApiResponse<number>>} ID del registro creado.
   */
  crear(command: CrearRolRequest): Observable<ApiResponse<number>> {
    return this.api.post<ApiResponse<number>>(this.baseUrl, command, {}, 'REGISTROS');
  }

  /**
   * @description
   * Actualiza un rol de seguridad existente.
   * 
   * @param {number} id - Identificador a actualizar.
   * @param {ActualizarRolRequest} command - Datos actualizados.
   * @returns {Observable<void>}
   */
  actualizar(id: number, command: ActualizarRolRequest): Observable<void> {
    return this.api.put<void>(`${this.baseUrl}/${id}`, command, {}, 'REGISTROS');
  }

  /**
   * @description
   * Elimina un rol de seguridad.
   * 
   * @param {number} id - Identificador a eliminar.
   * @returns {Observable<void>}
   */
  eliminar(id: number): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }
}
