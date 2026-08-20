import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../../core/services/base-api.service';
import { ApiResponse, PagedResult } from '../../../../../core/shared/models/shared.model';
import { 
  TipoIdentificacion, 
  CrearTipoIdentificacionRequest, 
  ActualizarTipoIdentificacionRequest 
} from '../../../domain/models/Contribuyentes/tipo-identificacion.model';

/**
 * @description
 * Servicio de infraestructura para la gestión de Tipos de Identificación.
 * Realiza peticiones HTTP al backend en el módulo de REGISTROS mediante BaseApiService.
 * 
 * @see {@link BaseApiService}
 * @see {@link TipoIdentificacion}
 */
@Injectable({
  providedIn: 'root',
})
export class TiposIdentificacionApiService {
  private api = inject(BaseApiService);
  private readonly baseUrl = '/TiposIdentificacion';

  /**
   * @description
   * Recupera una lista paginada de tipos de identificación.
   * 
   * @param {number} [pageNumber=1] - Índice de la página solicitada.
   * @param {number} [pageSize=10] - Cantidad de registros por página.
   * @returns {Observable<ApiResponse<PagedResult<TipoIdentificacion>>>} Respuesta paginada.
   */
  obtenerTodos(pageNumber: number = 1, pageSize: number = 10): Observable<ApiResponse<PagedResult<TipoIdentificacion>>> {
    return this.api.get<ApiResponse<PagedResult<TipoIdentificacion>>>(
      this.baseUrl,
      { params: { pageNumber, pageSize } },
      'REGISTROS'
    );
  }

  /**
   * @description
   * Obtiene los detalles de un tipo de identificación por su identificador.
   * 
   * @param {number} id - Identificador primario del tipo.
   * @returns {Observable<ApiResponse<TipoIdentificacion>>} Entidad encontrada.
   */
  obtenerPorId(id: number): Observable<ApiResponse<TipoIdentificacion>> {
    return this.api.get<ApiResponse<TipoIdentificacion>>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }

  /**
   * @description
   * Registra un nuevo tipo de identificación.
   * 
   * @param {CrearTipoIdentificacionRequest} command - Datos del nuevo tipo.
   * @returns {Observable<ApiResponse<number>>} ID del registro creado.
   */
  crear(command: CrearTipoIdentificacionRequest): Observable<ApiResponse<number>> {
    return this.api.post<ApiResponse<number>>(this.baseUrl, command, {}, 'REGISTROS');
  }

  /**
   * @description
   * Actualiza un tipo de identificación existente.
   * 
   * @param {number} id - Identificador a actualizar.
   * @param {ActualizarTipoIdentificacionRequest} command - Datos actualizados.
   * @returns {Observable<void>}
   */
  actualizar(id: number, command: ActualizarTipoIdentificacionRequest): Observable<void> {
    return this.api.put<void>(`${this.baseUrl}/${id}`, command, {}, 'REGISTROS');
  }

  /**
   * @description
   * Elimina un tipo de identificación.
   * 
   * @param {number} id - Identificador a eliminar.
   * @returns {Observable<void>}
   */
  eliminar(id: number): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }
}
