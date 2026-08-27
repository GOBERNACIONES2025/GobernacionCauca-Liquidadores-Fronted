import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../../core/services/base-api.service';
import { ApiResponse, PagedResult } from '../../../../../core/shared/models/shared.model';
import { 
  EntidadTipoActoPermitido, 
  CrearEntidadTipoActoPermitidoRequest, 
  ActualizarEntidadTipoActoPermitidoRequest 
} from '../../../domain/models/Registro/entidad-tipo-acto-permitido.model';

/**
 * @description
 * Servicio de infraestructura para la gestión de relaciones Entidad - Tipo de Acto Permitido.
 * Realiza peticiones HTTP al backend en el módulo de REGISTROS mediante BaseApiService.
 * 
 * @see {@link BaseApiService}
 * @see {@link EntidadTipoActoPermitido}
 */
@Injectable({
  providedIn: 'root',
})
export class EntidadesTipoActoPermitidoApiService {
  private api = inject(BaseApiService);
  private readonly baseUrl = '/EntidadesTipoActoPermitido';

  /**
   * @description
   * Recupera una lista paginada de relaciones entidad - tipo de acto permitido.
   * 
   * @param {number} [pageNumber=1] - Índice de la página solicitada.
   * @param {number} [pageSize=10] - Cantidad de registros por página.
   * @param {number} [entidadRegistroId] - Filtro opcional por entidad de registro.
   * @param {number} [tipoActoRegistroId] - Filtro opcional por tipo de acto.
   * @returns {Observable<ApiResponse<PagedResult<EntidadTipoActoPermitido>>>} Respuesta paginada.
   */
  obtenerTodos(
    paramsOrPage: number | any = 1, 
    pageSize: number = 10, 
    searchTerm?: string,
    entidadRegistroId?: number, 
    tipoActoRegistroId?: number,
    activo?: boolean,
    filtrosEspecificos?: any
  ): Observable<ApiResponse<PagedResult<EntidadTipoActoPermitido>>> {
    const params: any = {};
    if (typeof paramsOrPage === 'object') {
      params.PageNumber = paramsOrPage.pageNumber ?? 1;
      params.PageSize = paramsOrPage.pageSize ?? 10;
      const term = paramsOrPage.searchTerm ?? paramsOrPage.search;
      if (term && term.trim() !== '') params.SearchTerm = term.trim();
      if (paramsOrPage.entidadRegistroId) params.EntidadRegistroId = paramsOrPage.entidadRegistroId;
      if (paramsOrPage.tipoActoRegistroId) params.TipoActoRegistroId = paramsOrPage.tipoActoRegistroId;
      if (paramsOrPage.activo !== undefined && paramsOrPage.activo !== null) params.Activo = paramsOrPage.activo;
    } else {
      params.PageNumber = paramsOrPage ?? 1;
      params.PageSize = pageSize ?? 10;
      if (searchTerm && searchTerm.trim() !== '') params.SearchTerm = searchTerm.trim();
      if (entidadRegistroId) params.EntidadRegistroId = entidadRegistroId;
      if (tipoActoRegistroId) params.TipoActoRegistroId = tipoActoRegistroId;
      if (activo !== undefined && activo !== null) params.Activo = activo;
      if (filtrosEspecificos) Object.assign(params, filtrosEspecificos);
    }

    return this.api.get<ApiResponse<PagedResult<EntidadTipoActoPermitido>>>(
      this.baseUrl,
      { params },
      'REGISTROS'
    );
  }

  /**
   * @description
   * Obtiene los detalles de una relación por su identificador.
   * 
   * @param {number} id - Identificador primario.
   * @returns {Observable<ApiResponse<EntidadTipoActoPermitido>>} Entidad encontrada.
   */
  obtenerPorId(id: number): Observable<ApiResponse<EntidadTipoActoPermitido>> {
    return this.api.get<ApiResponse<EntidadTipoActoPermitido>>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }

  /**
   * @description
   * Registra una nueva relación Entidad - Tipo de Acto Permitido.
   * 
   * @param {CrearEntidadTipoActoPermitidoRequest} command - Datos de la nueva relación.
   * @returns {Observable<ApiResponse<number>>} ID del registro creado.
   */
  crear(command: CrearEntidadTipoActoPermitidoRequest): Observable<ApiResponse<number>> {
    return this.api.post<ApiResponse<number>>(this.baseUrl, command, {}, 'REGISTROS');
  }

  /**
   * @description
   * Actualiza una relación Entidad - Tipo de Acto Permitido existente.
   * 
   * @param {number} id - Identificador a actualizar.
   * @param {ActualizarEntidadTipoActoPermitidoRequest} command - Datos actualizados.
   * @returns {Observable<void>}
   */
  actualizar(id: number, command: ActualizarEntidadTipoActoPermitidoRequest): Observable<void> {
    return this.api.put<void>(`${this.baseUrl}/${id}`, command, {}, 'REGISTROS');
  }

  /**
   * @description
   * Elimina una relación Entidad - Tipo de Acto Permitido.
   * 
   * @param {number} id - Identificador a eliminar.
   * @returns {Observable<void>}
   */
  eliminar(id: number): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }
}
