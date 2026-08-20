import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../../core/services/base-api.service';
import { ApiResponse, PagedResult } from '../../../../../core/shared/models/shared.model';
import { 
  Vigencia, 
  CrearVigenciaRequest, 
  ActualizarVigenciaRequest 
} from '../../../domain/models/Normatividad/vigencia.model';

/**
 * @description
 * Servicio de infraestructura para la gestión de Vigencias.
 * Realiza peticiones HTTP al backend en el módulo de REGISTROS mediante BaseApiService.
 * 
 * @see {@link BaseApiService}
 * @see {@link Vigencia}
 */
@Injectable({
  providedIn: 'root',
})
export class VigenciasApiService {
  private api = inject(BaseApiService);
  private readonly baseUrl = '/Vigencias';

  /**
   * @description
   * Recupera una lista paginada de vigencias.
   * 
   * @param {number} [pageNumber=1] - Índice de la página solicitada.
   * @param {number} [pageSize=10] - Cantidad de registros por página.
   * @returns {Observable<ApiResponse<PagedResult<Vigencia>>>} Respuesta paginada.
   */
  obtenerTodos(pageNumber: number = 1, pageSize: number = 10): Observable<ApiResponse<PagedResult<Vigencia>>> {
    return this.api.get<ApiResponse<PagedResult<Vigencia>>>(
      this.baseUrl,
      { params: { pageNumber, pageSize } },
      'REGISTROS'
    );
  }

  /**
   * @description
   * Obtiene los detalles de una vigencia por su identificador.
   * 
   * @param {number} id - Identificador primario de la vigencia.
   * @returns {Observable<ApiResponse<Vigencia>>} Entidad encontrada.
   */
  obtenerPorId(id: number): Observable<ApiResponse<Vigencia>> {
    return this.api.get<ApiResponse<Vigencia>>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }

  /**
   * @description
   * Registra una nueva vigencia.
   * 
   * @param {CrearVigenciaRequest} command - Datos de la nueva vigencia.
   * @returns {Observable<ApiResponse<number>>} ID de la vigencia creada.
   */
  crear(command: CrearVigenciaRequest): Observable<ApiResponse<number>> {
    return this.api.post<ApiResponse<number>>(this.baseUrl, command, {}, 'REGISTROS');
  }

  /**
   * @description
   * Actualiza una vigencia existente.
   * 
   * @param {number} id - Identificador a actualizar.
   * @param {ActualizarVigenciaRequest} command - Datos actualizados.
   * @returns {Observable<void>}
   */
  actualizar(id: number, command: ActualizarVigenciaRequest): Observable<void> {
    return this.api.put<void>(`${this.baseUrl}/${id}`, command, {}, 'REGISTROS');
  }

  /**
   * @description
   * Elimina una vigencia.
   * 
   * @param {number} id - Identificador a eliminar.
   * @returns {Observable<void>}
   */
  eliminar(id: number): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }
}
