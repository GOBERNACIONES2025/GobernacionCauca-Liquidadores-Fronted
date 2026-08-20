import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../../core/services/base-api.service';
import { ApiResponse, PagedResult } from '../../../../../core/shared/models/shared.model';
import { 
  CategoriaActo, 
  CrearCategoriaActoRequest, 
  ActualizarCategoriaActoRequest 
} from '../../../domain/models/Registro/categoria-acto.model';

/**
 * @description
 * Servicio de infraestructura para la gestión de Categorías de Acto.
 * Realiza peticiones HTTP al backend en el módulo de REGISTROS mediante BaseApiService.
 * 
 * @see {@link BaseApiService}
 * @see {@link CategoriaActo}
 */
@Injectable({
  providedIn: 'root',
})
export class CategoriasActoApiService {
  private api = inject(BaseApiService);
  private readonly baseUrl = '/CategoriasActo';

  /**
   * @description
   * Recupera una lista paginada de categorías de acto.
   * 
   * @param {number} [pageNumber=1] - Índice de la página solicitada.
   * @param {number} [pageSize=10] - Cantidad de registros por página.
   * @returns {Observable<ApiResponse<PagedResult<CategoriaActo>>>} Respuesta paginada.
   */
  obtenerTodos(pageNumber: number = 1, pageSize: number = 10): Observable<ApiResponse<PagedResult<CategoriaActo>>> {
    return this.api.get<ApiResponse<PagedResult<CategoriaActo>>>(
      this.baseUrl,
      { params: { pageNumber, pageSize } },
      'REGISTROS'
    );
  }

  /**
   * @description
   * Obtiene los detalles de una categoría de acto por su identificador.
   * 
   * @param {number} id - Identificador primario de la categoría.
   * @returns {Observable<ApiResponse<CategoriaActo>>} Entidad encontrada.
   */
  obtenerPorId(id: number): Observable<ApiResponse<CategoriaActo>> {
    return this.api.get<ApiResponse<CategoriaActo>>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }

  /**
   * @description
   * Registra una nueva categoría de acto.
   * 
   * @param {CrearCategoriaActoRequest} command - Datos de la nueva categoría.
   * @returns {Observable<ApiResponse<number>>} ID del registro creado.
   */
  crear(command: CrearCategoriaActoRequest): Observable<ApiResponse<number>> {
    return this.api.post<ApiResponse<number>>(this.baseUrl, command, {}, 'REGISTROS');
  }

  /**
   * @description
   * Actualiza una categoría de acto existente.
   * 
   * @param {number} id - Identificador a actualizar.
   * @param {ActualizarCategoriaActoRequest} command - Datos actualizados.
   * @returns {Observable<void>}
   */
  actualizar(id: number, command: ActualizarCategoriaActoRequest): Observable<void> {
    return this.api.put<void>(`${this.baseUrl}/${id}`, command, {}, 'REGISTROS');
  }

  /**
   * @description
   * Elimina una categoría de acto.
   * 
   * @param {number} id - Identificador a eliminar.
   * @returns {Observable<void>}
   */
  eliminar(id: number): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }
}
