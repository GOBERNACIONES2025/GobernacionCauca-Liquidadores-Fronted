import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../../core/services/base-api.service';
import { ApiResponse, PagedResult } from '../../../../../core/shared/models/shared.model';
import { 
  TipoNorma, 
  CrearTipoNormaRequest, 
  ActualizarTipoNormaRequest 
} from '../../../domain/models/Normatividad/tipo-norma.model';

/**
 * @description
 * Servicio de infraestructura para la gestión de Tipos de Norma.
 * Realiza peticiones HTTP al backend en el módulo de REGISTROS mediante BaseApiService.
 * 
 * @see {@link BaseApiService}
 * @see {@link TipoNorma}
 */
@Injectable({
  providedIn: 'root',
})
export class TiposNormaApiService {
  private api = inject(BaseApiService);
  private readonly baseUrl = '/TiposNorma';

  /**
   * @description
   * Recupera una lista paginada de tipos de norma.
   * 
   * @param {number} [pageNumber=1] - Índice de la página solicitada.
   * @param {number} [pageSize=10] - Cantidad de registros por página.
   * @returns {Observable<ApiResponse<PagedResult<TipoNorma>>>} Respuesta paginada.
   */
  obtenerTodos(pageNumber: number = 1, pageSize: number = 10): Observable<ApiResponse<PagedResult<TipoNorma>>> {
    return this.api.get<ApiResponse<PagedResult<TipoNorma>>>(
      this.baseUrl,
      { params: { pageNumber, pageSize } },
      'REGISTROS'
    );
  }

  /**
   * @description
   * Obtiene los detalles de un tipo de norma por su identificador.
   * 
   * @param {number} id - Identificador primario del tipo de norma.
   * @returns {Observable<ApiResponse<TipoNorma>>} Entidad encontrada.
   */
  obtenerPorId(id: number): Observable<ApiResponse<TipoNorma>> {
    return this.api.get<ApiResponse<TipoNorma>>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }

  /**
   * @description
   * Registra un nuevo tipo de norma.
   * 
   * @param {CrearTipoNormaRequest} command - Datos del nuevo tipo de norma.
   * @returns {Observable<ApiResponse<number>>} ID del registro creado.
   */
  crear(command: CrearTipoNormaRequest): Observable<ApiResponse<number>> {
    return this.api.post<ApiResponse<number>>(this.baseUrl, command, {}, 'REGISTROS');
  }

  /**
   * @description
   * Actualiza un tipo de norma existente.
   * 
   * @param {number} id - Identificador a actualizar.
   * @param {ActualizarTipoNormaRequest} command - Datos actualizados.
   * @returns {Observable<void>}
   */
  actualizar(id: number, command: ActualizarTipoNormaRequest): Observable<void> {
    return this.api.put<void>(`${this.baseUrl}/${id}`, command, {}, 'REGISTROS');
  }

  /**
   * @description
   * Elimina un tipo de norma.
   * 
   * @param {number} id - Identificador a eliminar.
   * @returns {Observable<void>}
   */
  eliminar(id: number): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }
}
