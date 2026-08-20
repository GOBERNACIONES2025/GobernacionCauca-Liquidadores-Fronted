import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../../core/services/base-api.service';
import { ApiResponse, PagedResult } from '../../../../../core/shared/models/shared.model';
import { 
  EstadoNorma, 
  CrearEstadoNormaDto, 
  ActualizarEstadoNormaDto 
} from '../../../domain/models/Normatividad/estado-norma.model';

/**
 * @description
 * Servicio de infraestructura para la gestión de Estados de Norma.
 * Realiza peticiones HTTP al backend en el módulo de REGISTROS mediante BaseApiService.
 * 
 * @see {@link BaseApiService}
 * @see {@link EstadoNorma}
 */
@Injectable({
  providedIn: 'root',
})
export class EstadosNormaApiService {
  private api = inject(BaseApiService);
  private readonly baseUrl = '/EstadosNorma';

  /**
   * @description
   * Recupera una lista paginada de estados de norma.
   * 
   * @param {number} [pageNumber=1] - Índice de la página solicitada.
   * @param {number} [pageSize=10] - Cantidad de registros por página.
   * @returns {Observable<ApiResponse<PagedResult<EstadoNorma>>>} Respuesta paginada.
   */
  obtenerTodos(pageNumber: number = 1, pageSize: number = 10): Observable<ApiResponse<PagedResult<EstadoNorma>>> {
    return this.api.get<ApiResponse<PagedResult<EstadoNorma>>>(
      this.baseUrl,
      { params: { pageNumber, pageSize } },
      'REGISTROS'
    );
  }

  /**
   * @description
   * Obtiene los detalles de un estado de norma por su identificador.
   * 
   * @param {number} id - Identificador primario del estado.
   * @returns {Observable<ApiResponse<EstadoNorma>>} Entidad encontrada.
   */
  obtenerPorId(id: number): Observable<ApiResponse<EstadoNorma>> {
    return this.api.get<ApiResponse<EstadoNorma>>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }

  /**
   * @description
   * Registra un nuevo estado de norma.
   * 
   * @param {CrearEstadoNormaDto} command - Datos del nuevo estado.
   * @returns {Observable<ApiResponse<number>>} ID del registro creado.
   */
  crear(command: CrearEstadoNormaDto): Observable<ApiResponse<number>> {
    return this.api.post<ApiResponse<number>>(this.baseUrl, command, {}, 'REGISTROS');
  }

  /**
   * @description
   * Actualiza un estado de norma existente.
   * 
   * @param {number} id - Identificador a actualizar.
   * @param {ActualizarEstadoNormaDto} command - Datos actualizados.
   * @returns {Observable<void>}
   */
  actualizar(id: number, command: ActualizarEstadoNormaDto): Observable<void> {
    return this.api.put<void>(`${this.baseUrl}/${id}`, { ...command, id }, {}, 'REGISTROS');
  }

  /**
   * @description
   * Elimina un estado de norma.
   * 
   * @param {number} id - Identificador a eliminar.
   * @returns {Observable<void>}
   */
  eliminar(id: number): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }
}
