import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../../core/services/base-api.service';
import { ApiResponse, PagedResult } from '../../../../../core/shared/models/shared.model';
import { 
  EntidadRegistro, 
  CrearEntidadRegistroRequest, 
  ActualizarEntidadRegistroRequest 
} from '../../../domain/models/Registro/entidad-registro.model';

/**
 * @description
 * Servicio de infraestructura para la gestión de Entidades de Registro.
 * Realiza peticiones HTTP al backend en el módulo de REGISTROS mediante BaseApiService.
 * 
 * @see {@link BaseApiService}
 * @see {@link EntidadRegistro}
 */
@Injectable({
  providedIn: 'root',
})
export class EntidadesRegistroApiService {
  private api = inject(BaseApiService);
  private readonly baseUrl = '/EntidadesRegistro';

  /**
   * @description
   * Recupera una lista paginada de entidades de registro.
   * 
   * @param {number} [pageNumber=1] - Índice de la página solicitada.
   * @param {number} [pageSize=10] - Cantidad de registros por página.
   * @param {number} [tipoEntidadRegistroId] - Filtro opcional por tipo de entidad.
   * @param {number} [departamentoId] - Filtro opcional por departamento.
   * @param {number} [municipioId] - Filtro opcional por municipio.
   * @returns {Observable<ApiResponse<PagedResult<EntidadRegistro>>>} Respuesta paginada.
   */
  obtenerTodos(
    paramsOrPage: number | any = 1, 
    pageSize: number = 10, 
    searchTerm?: string,
    tipoEntidadRegistroId?: number, 
    departamentoId?: number, 
    municipioId?: number,
    activo?: boolean,
    filtrosEspecificos?: any
  ): Observable<ApiResponse<PagedResult<EntidadRegistro>>> {
    const params: any = {};
    if (typeof paramsOrPage === 'object') {
      params.PageNumber = paramsOrPage.pageNumber ?? 1;
      params.PageSize = paramsOrPage.pageSize ?? 10;
      const term = paramsOrPage.searchTerm ?? paramsOrPage.search;
      if (term && term.trim() !== '') params.SearchTerm = term.trim();
      if (paramsOrPage.tipoEntidadRegistroId) params.TipoEntidadRegistroId = paramsOrPage.tipoEntidadRegistroId;
      if (paramsOrPage.departamentoId) params.DepartamentoId = paramsOrPage.departamentoId;
      if (paramsOrPage.municipioId) params.MunicipioId = paramsOrPage.municipioId;
      if (paramsOrPage.activo !== undefined && paramsOrPage.activo !== null) params.Activo = paramsOrPage.activo;
    } else {
      params.PageNumber = paramsOrPage ?? 1;
      params.PageSize = pageSize ?? 10;
      if (searchTerm && searchTerm.trim() !== '') params.SearchTerm = searchTerm.trim();
      if (tipoEntidadRegistroId) params.TipoEntidadRegistroId = tipoEntidadRegistroId;
      if (departamentoId) params.DepartamentoId = departamentoId;
      if (municipioId) params.MunicipioId = municipioId;
      if (activo !== undefined && activo !== null) params.Activo = activo;
      if (filtrosEspecificos) Object.assign(params, filtrosEspecificos);
    }

    return this.api.get<ApiResponse<PagedResult<EntidadRegistro>>>(
      this.baseUrl,
      { params },
      'REGISTROS'
    );
  }

  /**
   * @description
   * Obtiene los detalles de una entidad de registro por su identificador.
   * 
   * @param {number} id - Identificador primario de la entidad.
   * @returns {Observable<ApiResponse<EntidadRegistro>>} Entidad encontrada.
   */
  obtenerPorId(id: number): Observable<ApiResponse<EntidadRegistro>> {
    return this.api.get<ApiResponse<EntidadRegistro>>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }

  /**
   * @description
   * Registra una nueva entidad de registro.
   * 
   * @param {CrearEntidadRegistroRequest} command - Datos de la nueva entidad.
   * @returns {Observable<ApiResponse<number>>} ID del registro creado.
   */
  crear(command: CrearEntidadRegistroRequest): Observable<ApiResponse<number>> {
    return this.api.post<ApiResponse<number>>(this.baseUrl, command, {}, 'REGISTROS');
  }

  /**
   * @description
   * Actualiza una entidad de registro existente.
   * 
   * @param {number} id - Identificador a actualizar.
   * @param {ActualizarEntidadRegistroRequest} command - Datos actualizados.
   * @returns {Observable<void>}
   */
  actualizar(id: number, command: ActualizarEntidadRegistroRequest): Observable<void> {
    return this.api.put<void>(`${this.baseUrl}/${id}`, command, {}, 'REGISTROS');
  }

  /**
   * @description
   * Elimina una entidad de registro.
   * 
   * @param {number} id - Identificador a eliminar.
   * @returns {Observable<void>}
   */
  eliminar(id: number): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }
}
