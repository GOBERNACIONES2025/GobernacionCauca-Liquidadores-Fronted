import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../../core/services/base-api.service';
import { ApiResponse, PagedResult } from '../../../../../core/shared/models/shared.model';
import { 
  EstadoSolicitud, 
  CrearEstadoSolicitudDto, 
  ActualizarEstadoSolicitudDto 
} from '../../../domain/models/Radicacion/estado-solicitud.model';

/**
 * @description
 * Servicio de infraestructura para la gestión de Estados de Solicitud (Radicación).
 * Realiza peticiones HTTP al backend en el módulo de REGISTROS mediante BaseApiService.
 * 
 * @see {@link BaseApiService}
 * @see {@link EstadoSolicitud}
 */
@Injectable({
  providedIn: 'root',
})
export class EstadosSolicitudApiService {
  private api = inject(BaseApiService);
  private readonly baseUrl = '/EstadosSolicitud';

  /**
   * @description
   * Recupera una lista paginada de estados de solicitud.
   * 
   * @param {number} [pageNumber=1] - Índice de la página solicitada.
   * @param {number} [pageSize=10] - Cantidad de registros por página.
   * @returns {Observable<ApiResponse<PagedResult<EstadoSolicitud>>>} Respuesta paginada.
   */
  obtenerTodos(pageNumber: number = 1, pageSize: number = 10): Observable<ApiResponse<PagedResult<EstadoSolicitud>>> {
    return this.api.get<ApiResponse<PagedResult<EstadoSolicitud>>>(
      this.baseUrl,
      { params: { pageNumber, pageSize } },
      'REGISTROS'
    );
  }

  /**
   * @description
   * Obtiene los detalles de un estado de solicitud por su identificador.
   * 
   * @param {number} id - Identificador primario del estado.
   * @returns {Observable<ApiResponse<EstadoSolicitud>>} Entidad encontrada.
   */
  obtenerPorId(id: number): Observable<ApiResponse<EstadoSolicitud>> {
    return this.api.get<ApiResponse<EstadoSolicitud>>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }

  /**
   * @description
   * Registra un nuevo estado de solicitud.
   * 
   * @param {CrearEstadoSolicitudDto} command - Datos del nuevo estado.
   * @returns {Observable<ApiResponse<number>>} ID del registro creado.
   */
  crear(command: CrearEstadoSolicitudDto): Observable<ApiResponse<number>> {
    return this.api.post<ApiResponse<number>>(this.baseUrl, command, {}, 'REGISTROS');
  }

  /**
   * @description
   * Actualiza un estado de solicitud existente.
   * 
   * @param {number} id - Identificador a actualizar.
   * @param {ActualizarEstadoSolicitudDto} command - Datos actualizados.
   * @returns {Observable<void>}
   */
  actualizar(id: number, command: ActualizarEstadoSolicitudDto): Observable<void> {
    return this.api.put<void>(`${this.baseUrl}/${id}`, { ...command, id }, {}, 'REGISTROS');
  }

  /**
   * @description
   * Elimina un estado de solicitud.
   * 
   * @param {number} id - Identificador a eliminar.
   * @returns {Observable<void>}
   */
  eliminar(id: number): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }
}
