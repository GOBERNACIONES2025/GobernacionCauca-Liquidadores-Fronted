import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../../core/services/base-api.service';
import { ApiResponse, PagedResult } from '../../../../../core/shared/models/shared.model';
import { 
  NaturalezaActo, 
  CrearNaturalezaActoRequest, 
  ActualizarNaturalezaActoRequest 
} from '../../../domain/models/Registro/naturaleza-acto.model';

/**
 * @description
 * Servicio de infraestructura para la gestión de Naturalezas de Acto.
 * Realiza peticiones HTTP al backend en el módulo de REGISTROS mediante BaseApiService.
 * 
 * @see {@link BaseApiService}
 * @see {@link NaturalezaActo}
 */
@Injectable({
  providedIn: 'root',
})
export class NaturalezasActoApiService {
  private api = inject(BaseApiService);
  private readonly baseUrl = '/NaturalezasActo';

  /**
   * @description
   * Recupera una lista paginada de naturalezas de acto.
   * 
   * @param {number} [pageNumber=1] - Índice de la página solicitada.
   * @param {number} [pageSize=10] - Cantidad de registros por página.
   * @returns {Observable<ApiResponse<PagedResult<NaturalezaActo>>>} Respuesta paginada.
   */
  obtenerTodos(pageNumber: number = 1, pageSize: number = 10): Observable<ApiResponse<PagedResult<NaturalezaActo>>> {
    return this.api.get<ApiResponse<PagedResult<NaturalezaActo>>>(
      this.baseUrl,
      { params: { pageNumber, pageSize } },
      'REGISTROS'
    );
  }

  /**
   * @description
   * Obtiene los detalles de una naturaleza de acto por su identificador.
   * 
   * @param {number} id - Identificador primario de la naturaleza.
   * @returns {Observable<ApiResponse<NaturalezaActo>>} Entidad encontrada.
   */
  obtenerPorId(id: number): Observable<ApiResponse<NaturalezaActo>> {
    return this.api.get<ApiResponse<NaturalezaActo>>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }

  /**
   * @description
   * Registra una nueva naturaleza de acto.
   * 
   * @param {CrearNaturalezaActoRequest} command - Datos de la nueva naturaleza.
   * @returns {Observable<ApiResponse<number>>} ID del registro creado.
   */
  crear(command: CrearNaturalezaActoRequest): Observable<ApiResponse<number>> {
    return this.api.post<ApiResponse<number>>(this.baseUrl, command, {}, 'REGISTROS');
  }

  /**
   * @description
   * Actualiza una naturaleza de acto existente.
   * 
   * @param {number} id - Identificador a actualizar.
   * @param {ActualizarNaturalezaActoRequest} command - Datos actualizados.
   * @returns {Observable<void>}
   */
  actualizar(id: number, command: ActualizarNaturalezaActoRequest): Observable<void> {
    return this.api.put<void>(`${this.baseUrl}/${id}`, command, {}, 'REGISTROS');
  }

  /**
   * @description
   * Elimina una naturaleza de acto.
   * 
   * @param {number} id - Identificador a eliminar.
   * @returns {Observable<void>}
   */
  eliminar(id: number): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }
}
