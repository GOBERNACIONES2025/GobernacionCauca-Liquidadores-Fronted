import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../../core/services/base-api.service';
import { ApiResponse, PagedResult } from '../../../../../core/shared/models/shared.model';
import { Municipio, CrearMunicipioRequest, ActualizarMunicipioRequest } from '../../../domain/models/Territorios/municipio.model';

/**
 * @description
 * Servicio de infraestructura (Infrastructure Layer) encargado de la comunicación 
 * HTTP con la API de Municipios del módulo de Registros.
 * 
 * Implementa el patrón Singleton (`providedIn: 'root'`) y centraliza el acceso a los 
 * endpoints de la entidad. Delega la lógica base de red (interceptores, configuración 
 * de URLs base, manejo de tokens) al `BaseApiService`.
 * 
 * @see {@link BaseApiService}
 * @see {@link Municipio}
 */
@Injectable({
  providedIn: 'root',
})
export class MunicipiosApiService {
  private api = inject(BaseApiService);
  private readonly baseUrl = '/Municipios';

  /**
   * @description
   * Recupera una colección paginada de requests.
   * Diseñado para integrarse fácilmente con componentes de tablas (DataTables) o 
   * listas que requieran paginación del lado del servidor (Server-Side Pagination).
   * 
   * @example
   * ```typescript
   * this.requestsApi.obtenerTodos(1, 20).subscribe({
   *   next: (response) => this.requests = response.data.items,
   *   error: (err) => this.notificationService.error(err.message)
   * });
   * ```
   * 
   * @param {number} [pageNumber=1] - El índice de la página solicitada (basado en 1).
   * @param {number} [pageSize=10] - El número máximo de registros a retornar por página.
   * @returns {Observable<ApiResponse<PagedResult<Municipio>>>} Flujo observable con la respuesta paginada y metadatos.
   */
  obtenerTodos(
    paramsOrPage: number | any = 1, 
    pageSize: number = 10, 
    searchTerm?: string,
    departamentoId?: number,
    activo?: boolean,
    filtrosEspecificos?: any
  ): Observable<ApiResponse<PagedResult<Municipio>>> {
    const params: any = {};
    if (typeof paramsOrPage === 'object') {
      params.PageNumber = paramsOrPage.pageNumber ?? 1;
      params.PageSize = paramsOrPage.pageSize ?? 10;
      const term = paramsOrPage.searchTerm ?? paramsOrPage.search;
      if (term && term.trim() !== '') params.SearchTerm = term.trim();
      if (paramsOrPage.departamentoId) params.DepartamentoId = paramsOrPage.departamentoId;
      if (paramsOrPage.activo !== undefined && paramsOrPage.activo !== null) params.Activo = paramsOrPage.activo;
    } else {
      params.PageNumber = paramsOrPage ?? 1;
      params.PageSize = pageSize ?? 10;
      if (searchTerm && searchTerm.trim() !== '') params.SearchTerm = searchTerm.trim();
      if (departamentoId) params.DepartamentoId = departamentoId;
      if (activo !== undefined && activo !== null) params.Activo = activo;
      if (filtrosEspecificos) Object.assign(params, filtrosEspecificos);
    }
    
    return this.api.get<ApiResponse<PagedResult<Municipio>>>(
      this.baseUrl,
      { params },
      'REGISTROS'
    );
  }

  /**
   * @description
   * Recupera los detalles exhaustivos de un request en específico,
   * usualmente incluyendo relaciones anidadas (ej. información del Departamento asociado).
   * 
   * @param {number} id - Identificador primario único (PK) del request.
   * @returns {Observable<ApiResponse<Municipio>>} Flujo observable con la entidad solicitada.
   */
  obtenerPorId(id: number): Observable<ApiResponse<Municipio>> {
    return this.api.get<ApiResponse<Municipio>>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }

  /**
   * @description
   * Envía un payload para persistir un nuevo request en la base de datos.
   * 
   * @param {Partial<Municipio>} request - DTO con la información parcial requerida para la creación.
   * @returns {Observable<ApiResponse<number>>} Flujo observable que emite el ID del recurso recién creado.
   */
  crear(request: CrearMunicipioRequest): Observable<ApiResponse<number>> {
    return this.api.post<ApiResponse<number>>(this.baseUrl, request, {}, 'REGISTROS');
  }

  /**
   * @description
   * Sobrescribe los datos de un request existente (Full Update).
   * 
   * @param {number} id - Identificador único del recurso a modificar.
   * @param {Partial<Municipio>} request - DTO con las propiedades actualizadas.
   * @returns {Observable<void>} Observable que completa si la actualización es exitosa (Status 204 No Content).
   */
  actualizar(id: number, request: ActualizarMunicipioRequest): Observable<void> {
    return this.api.put<void>(`${this.baseUrl}/${id}`, request, {}, 'REGISTROS');
  }

  /**
   * @description
   * Elimina un request del sistema.
   * Nota: Dependiendo de las reglas del backend, esto puede ser un Soft-Delete o un Hard-Delete.
   * 
   * @param {number} id - Identificador del request a remover.
   * @returns {Observable<void>} Observable que completa al finalizar la operación exitosamente.
   */
  eliminar(id: number): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }
}
