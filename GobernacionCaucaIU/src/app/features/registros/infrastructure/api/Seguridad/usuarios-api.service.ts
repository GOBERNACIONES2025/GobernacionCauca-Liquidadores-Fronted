import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../../core/services/base-api.service';
import { ApiResponse, PagedResult } from '../../../../../core/shared/models/shared.model';
import { 
  Usuario, 
  CrearUsuarioRequest, 
  ActualizarUsuarioRequest, 
  UsuarioQueryParams 
} from '../../../domain/models/Seguridad/usuario.model';

/**
 * @description
 * Servicio de infraestructura para la gestión de Usuarios de Seguridad.
 * Realiza peticiones HTTP al backend en el módulo de REGISTROS mediante BaseApiService.
 * 
 * @see {@link BaseApiService}
 * @see {@link Usuario}
 */
@Injectable({
  providedIn: 'root',
})
export class UsuariosApiService {
  private api = inject(BaseApiService);
  private readonly baseUrl = '/Usuarios';

  /**
   * @description
   * Recupera una lista paginada de usuarios con filtros de búsqueda y ordenamiento.
   * 
   * @param {UsuarioQueryParams} [params] - Parámetros de paginación y búsqueda.
   * @returns {Observable<ApiResponse<PagedResult<Usuario>>>} Respuesta paginada.
   */
  obtenerTodos(
    paramsOrPage: number | UsuarioQueryParams = 1,
    pageSize: number = 10,
    searchTerm?: string,
    activo?: boolean,
    filtrosEspecificos?: any
  ): Observable<ApiResponse<PagedResult<Usuario>>> {
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
      if (paramsOrPage.rolId) {
        queryParams.RolId = paramsOrPage.rolId;
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
      if (filtrosEspecificos) {
        Object.assign(queryParams, filtrosEspecificos);
      }
    }

    return this.api.get<ApiResponse<PagedResult<Usuario>>>(
      this.baseUrl,
      { params: queryParams },
      'REGISTROS'
    );
  }

  /**
   * @description
   * Obtiene los detalles de un usuario por su identificador.
   * 
   * @param {number} id - Identificador primario del usuario.
   * @returns {Observable<ApiResponse<Usuario>>} Entidad encontrada con sus roles.
   */
  obtenerPorId(id: number): Observable<ApiResponse<Usuario>> {
    return this.api.get<ApiResponse<Usuario>>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }

  /**
   * @description
   * Registra un nuevo usuario en el sistema.
   * 
   * @param {CrearUsuarioRequest} command - Datos del nuevo usuario.
   * @returns {Observable<ApiResponse<number>>} ID del usuario creado.
   */
  crear(command: CrearUsuarioRequest): Observable<ApiResponse<number>> {
    return this.api.post<ApiResponse<number>>(this.baseUrl, command, {}, 'REGISTROS');
  }

  /**
   * @description
   * Actualiza un usuario existente.
   * 
   * @param {number} id - Identificador a actualizar.
   * @param {ActualizarUsuarioRequest} command - Datos actualizados.
   * @returns {Observable<void>}
   */
  actualizar(id: number, command: ActualizarUsuarioRequest): Observable<void> {
    return this.api.put<void>(`${this.baseUrl}/${id}`, command, {}, 'REGISTROS');
  }

  /**
   * @description
   * Elimina uno o múltiples usuarios en bloque.
   * 
   * @param {number[]} ids - Lista de IDs de usuarios a eliminar.
   * @returns {Observable<void>}
   */
  eliminar(ids: number[]): Observable<void> {
    return this.api.delete<void>(this.baseUrl, { body: { ids } }, 'REGISTROS');
  }
}
