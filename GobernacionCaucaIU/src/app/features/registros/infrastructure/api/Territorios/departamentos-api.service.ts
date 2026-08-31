import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../../core/services/base-api.service';
import { ApiResponse, PagedResult } from '../../../../../core/shared/models/shared.model';
import { Departamento, CrearDepartamentoRequest, ActualizarDepartamentoRequest } from '../../../domain/models/Territorios/departamento.model';

/**
 * @description
 * Servicio de infraestructura (Infrastructure Layer) encargado de la comunicación 
 * HTTP con la API de Departamentos del módulo de Registros.
 * 
 * Implementa el patrón Singleton (`providedIn: 'root'`) y centraliza el acceso a los 
 * endpoints de la entidad. Delega la lógica base de red (interceptores, configuración 
 * de URLs base, manejo de tokens) al `BaseApiService`.
 * 
 * @see {@link BaseApiService}
 * @see {@link Departamento}
 */
@Injectable({
  providedIn: 'root',
})
export class DepartamentosApiService {
  private api = inject(BaseApiService);
  private readonly baseUrl = '/Departamentos';

  /**
   * @description
   * Recupera una colección paginada de departamentos.
   * Diseñado para integrarse fácilmente con componentes de tablas (DataTables) o 
   * listas que requieran paginación del lado del servidor (Server-Side Pagination).
   * 
   * @example
   * ```typescript
   * this.departamentosApi.obtenerTodos(1, 20).subscribe({
   *   next: (response) => this.departamentos = response.data.items,
   *   error: (err) => this.notificationService.error(err.message)
   * });
   * ```
   * 
   * @param {number} [pageNumber=1] - El índice de la página solicitada (basado en 1).
   * @param {number} [pageSize=10] - El número máximo de registros a retornar por página.
   * @returns {Observable<ApiResponse<PagedResult<Departamento>>>} Flujo observable con la respuesta paginada y metadatos.
   */
  obtenerTodos(
    paramsOrPage: number | any = 1, 
    pageSize: number = 10, 
    searchTerm?: string,
    activo?: boolean,
    filtrosEspecificos?: any
  ): Observable<ApiResponse<PagedResult<Departamento>>> {
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
    return this.api.get<ApiResponse<PagedResult<Departamento>>>(
      this.baseUrl,
      { params },
      'REGISTROS'
    );
  }

  /**
   * @description
   * Recupera los detalles exhaustivos de un departamento en específico.
   * 
   * @param {number} id - Identificador primario único (PK) del departamento.
   * @returns {Observable<ApiResponse<Departamento>>} Flujo observable con la entidad solicitada.
   */
  obtenerPorId(id: number): Observable<ApiResponse<Departamento>> {
    return this.api.get<ApiResponse<Departamento>>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }

  /**
   * @description
   * Envía un payload para persistir un nuevo departamento en la base de datos.
   * 
   * @param {CrearDepartamentoRequest} departamento - DTO con la información estricta requerida para la creación.
   * @returns {Observable<ApiResponse<number>>} Flujo observable que emite el ID del recurso recién creado.
   */
  crear(departamento: CrearDepartamentoRequest): Observable<ApiResponse<number>> {
    return this.api.post<ApiResponse<number>>(this.baseUrl, departamento, {}, 'REGISTROS');
  }

  /**
   * @description
   * Sobrescribe los datos de un departamento existente (Full Update).
   * 
   * @param {number} id - Identificador único del recurso a modificar.
   * @param {ActualizarDepartamentoRequest} departamento - DTO con las propiedades actualizadas.
   * @returns {Observable<void>} Observable que completa si la actualización es exitosa (Status 204 No Content).
   */
  actualizar(id: number, departamento: ActualizarDepartamentoRequest): Observable<void> {
    return this.api.put<void>(`${this.baseUrl}/${id}`, departamento, {}, 'REGISTROS');
  }

  /**
   * @description
   * Elimina un departamento del sistema.
   * Nota: Dependiendo de las reglas del backend, esto puede ser un Soft-Delete o un Hard-Delete.
   * 
   * @param {number} id - Identificador del departamento a remover.
   * @returns {Observable<void>} Observable que completa al finalizar la operación exitosamente.
   */
  eliminar(id: number): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }
}
