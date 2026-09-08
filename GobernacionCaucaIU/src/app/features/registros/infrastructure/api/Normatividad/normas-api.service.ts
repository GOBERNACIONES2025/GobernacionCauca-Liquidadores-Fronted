import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../../core/services/base-api.service';
import { ApiResponse, PagedResult } from '../../../../../core/shared/models/shared.model';
import { 
  NormaListado, 
  NormaDetalle, 
  CrearNormaRequest, 
  ActualizarNormaRequest 
} from '../../../domain/models/Normatividad/norma.model';

/**
 * @description
 * Servicio de infraestructura para la gestión de Normas jurídicas y sus documentos.
 * Realiza peticiones HTTP al backend en el módulo de REGISTROS mediante BaseApiService.
 * 
 * @see {@link BaseApiService}
 * @see {@link NormaListado}
 * @see {@link NormaDetalle}
 */
@Injectable({
  providedIn: 'root',
})
export class NormasApiService {
  private api = inject(BaseApiService);
  private readonly baseUrl = '/Normas';

  /**
   * @description
   * Recupera una lista paginada de normas con filtro opcional por departamento.
   * 
   * @param {number} [departamentoId] - Filtro opcional por departamento.
   * @param {number} [pageNumber=1] - Índice de la página solicitada.
   * @param {number} [pageSize=10] - Cantidad de registros por página.
   * @returns {Observable<ApiResponse<PagedResult<NormaListado>>>} Lista de normas.
   */
  obtenerTodos(
    paramsOrPage: number | any = 1, 
    pageSize: number = 10, 
    searchTerm?: string,
    departamentoId?: number,
    activo?: boolean,
    filtrosEspecificos?: any
  ): Observable<ApiResponse<PagedResult<NormaListado>>> {
    const params: any = {};
    if (typeof paramsOrPage === 'object') {
      params.PageNumber = paramsOrPage.pageNumber ?? 1;
      params.PageSize = paramsOrPage.pageSize ?? 10;
      const term = paramsOrPage.searchTerm ?? paramsOrPage.search;
      if (term && term.trim() !== '') params.SearchTerm = term.trim();
      if (paramsOrPage.departamentoId) params.DepartamentoId = paramsOrPage.departamentoId;
      if (paramsOrPage.tipoNormaId) params.TipoNormaId = paramsOrPage.tipoNormaId;
      if (paramsOrPage.estadoNormaId) params.EstadoNormaId = paramsOrPage.estadoNormaId;
      if (paramsOrPage.vigenciaId) params.VigenciaId = paramsOrPage.vigenciaId;
      if (paramsOrPage.activo !== undefined && paramsOrPage.activo !== null) params.Activo = paramsOrPage.activo;
    } else {
      params.PageNumber = paramsOrPage ?? 1;
      params.PageSize = pageSize ?? 10;
      if (searchTerm && searchTerm.trim() !== '') params.SearchTerm = searchTerm.trim();
      if (departamentoId) params.DepartamentoId = departamentoId;
      if (activo !== undefined && activo !== null) params.Activo = activo;
      if (filtrosEspecificos) Object.assign(params, filtrosEspecificos);
    }

    return this.api.get<ApiResponse<PagedResult<NormaListado>>>(
      this.baseUrl,
      { params },
      'REGISTROS'
    );
  }

  /**
   * @description
   * Obtiene el detalle completo de una norma por su ID.
   * 
   * @param {number} id - Identificador primario de la norma.
   * @returns {Observable<ApiResponse<NormaDetalle>>} Detalle completo con documentos.
   */
  obtenerPorId(id: number): Observable<ApiResponse<NormaDetalle>> {
    return this.api.get<ApiResponse<NormaDetalle>>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }

  /**
   * @description
   * Registra una nueva norma en el sistema con su documento normativo asociado.
   * 
   * @param {File} file - El documento normativo adjunto.
   * @param {CrearNormaRequest} command - Datos de la nueva norma.
   * @returns {Observable<ApiResponse<number>>} ID de la norma creada.
   */
  crear(file: File, command: CrearNormaRequest): Observable<ApiResponse<number>> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    formData.append('requestJson', JSON.stringify(command));
    
    return this.api.post<ApiResponse<number>>(this.baseUrl, formData, {}, 'REGISTROS');
  }

  /**
   * @description
   * Actualiza una norma existente y sincroniza sus documentos normativos.
   * 
   * @param {number} id - Identificador de la norma a actualizar.
   * @param {ActualizarNormaRequest} command - Datos actualizados.
   * @returns {Observable<void>}
   */
  actualizar(id: number, command: ActualizarNormaRequest): Observable<void> {
    return this.api.put<void>(`${this.baseUrl}/${id}`, command, {}, 'REGISTROS');
  }

  /**
   * @description
   * Actualiza el estado de una norma a un nuevo estado (ej. Derogada, Inactiva).
   * 
   * @param {number} id - Identificador de la norma.
   * @param {number} nuevoEstadoNormaId - ID del nuevo estado norma a asignar.
   * @returns {Observable<void>}
   */
  eliminar(id: number, nuevoEstadoNormaId: number): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/${id}/estado/${nuevoEstadoNormaId}`, {}, 'REGISTROS');
  }
}
