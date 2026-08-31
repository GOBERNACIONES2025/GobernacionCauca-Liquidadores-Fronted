import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../../core/services/base-api.service';
import { ApiResponse, PagedResult } from '../../../../../core/shared/models/shared.model';
import { 
  Exencion, 
  CrearExencionRequest, 
  ActualizarExencionRequest 
} from '../../../domain/models/Exenciones/exencion.model';

/**
 * @description
 * Servicio de infraestructura para la gestión de Exenciones.
 * Se comunica con la API de Registros delegando peticiones a BaseApiService.
 * 
 * @see {@link BaseApiService}
 * @see {@link Exencion}
 */
@Injectable({
  providedIn: 'root',
})
export class ExencionesApiService {
  private api = inject(BaseApiService);
  private readonly baseUrl = '/Exenciones';

  /**
   * @description
   * Recupera una colección paginada de exenciones.
   * 
   * @param {number} [pageNumber=1] - Índice de la página solicitada.
   * @param {number} [pageSize=10] - Cantidad de registros por página.
   * @param {number} [departamentoId] - Filtro opcional por departamento.
   * @param {string} [terminoBusqueda] - Filtro de búsqueda por texto.
   * @returns {Observable<ApiResponse<PagedResult<Exencion>>>} Respuesta con lista paginada.
   */
  obtenerTodos(
    paramsOrPage: number | any = 1, 
    pageSize: number = 10, 
    searchTerm?: string,
    departamentoId?: number, 
    activo?: boolean,
    filtrosEspecificos?: any
  ): Observable<ApiResponse<PagedResult<Exencion>>> {
    const params: any = {};
    if (typeof paramsOrPage === 'object') {
      params.PageNumber = paramsOrPage.pageNumber ?? 1;
      params.PageSize = paramsOrPage.pageSize ?? 10;
      const term = paramsOrPage.searchTerm ?? paramsOrPage.search ?? paramsOrPage.terminoBusqueda;
      if (term && term.trim() !== '') params.SearchTerm = term.trim();
      if (paramsOrPage.departamentoId) params.DepartamentoId = paramsOrPage.departamentoId;
      if (paramsOrPage.tipoBeneficiarioExencionId) params.TipoBeneficiarioExencionId = paramsOrPage.tipoBeneficiarioExencionId;
      if (paramsOrPage.tipoActoRegistroId) params.TipoActoRegistroId = paramsOrPage.tipoActoRegistroId;
      if (paramsOrPage.activo !== undefined && paramsOrPage.activo !== null) params.Activo = paramsOrPage.activo;
    } else {
      params.PageNumber = paramsOrPage ?? 1;
      params.PageSize = pageSize ?? 10;
      if (searchTerm && searchTerm.trim() !== '') params.SearchTerm = searchTerm.trim();
      if (departamentoId) params.DepartamentoId = departamentoId;
      if (activo !== undefined && activo !== null) params.Activo = activo;
      if (filtrosEspecificos) Object.assign(params, filtrosEspecificos);
    }

    return this.api.get<ApiResponse<PagedResult<Exencion>>>(
      this.baseUrl,
      { params },
      'REGISTROS'
    );
  }

  /**
   * @description
   * Obtiene los detalles de una exención específica por su ID.
   * 
   * @param {number} id - Identificador de la exención.
   * @returns {Observable<ApiResponse<Exencion>>} Entidad de exención encontrada.
   */
  obtenerPorId(id: number): Observable<ApiResponse<Exencion>> {
    return this.api.get<ApiResponse<Exencion>>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }

  /**
   * @description
   * Registra una nueva exención en el sistema.
   * 
   * @param {CrearExencionRequest} command - Datos de la nueva exención.
   * @returns {Observable<ApiResponse<number>>} ID del registro creado.
   */
  crear(command: CrearExencionRequest): Observable<ApiResponse<number>> {
    return this.api.post<ApiResponse<number>>(this.baseUrl, command, {}, 'REGISTROS');
  }

  /**
   * @description
   * Actualiza una exención existente.
   * 
   * @param {number} id - Identificador de la exención.
   * @param {ActualizarExencionRequest} command - Datos actualizados.
   * @returns {Observable<void>}
   */
  actualizar(id: number, command: ActualizarExencionRequest): Observable<void> {
    return this.api.put<void>(`${this.baseUrl}/${id}`, command, {}, 'REGISTROS');
  }

  /**
   * @description
   * Elimina lógicamente una exención (la desactiva).
   * 
   * @param {number} id - Identificador de la exención a eliminar.
   * @returns {Observable<void>}
   */
  eliminar(id: number): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }
}
