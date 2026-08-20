import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../../core/services/base-api.service';
import { ApiResponse, PagedResult } from '../../../../../core/shared/models/shared.model';
import { 
  TipoCalculoTarifa, 
  CrearTipoCalculoTarifaDto, 
  ActualizarTipoCalculoTarifaDto 
} from '../../../domain/models/Tarifas/tipo-calculo-tarifa.model';

/**
 * @description
 * Servicio de infraestructura para la gestión de Tipos de Cálculo de Tarifa.
 * Realiza peticiones HTTP al backend en el módulo de REGISTROS mediante BaseApiService.
 * 
 * @see {@link BaseApiService}
 * @see {@link TipoCalculoTarifa}
 */
@Injectable({
  providedIn: 'root',
})
export class TiposCalculoTarifaApiService {
  private api = inject(BaseApiService);
  private readonly baseUrl = '/TiposCalculoTarifa';

  /**
   * @description
   * Recupera una lista paginada de tipos de cálculo de tarifa.
   * 
   * @param {number} [pageNumber=1] - Índice de la página solicitada.
   * @param {number} [pageSize=10] - Cantidad de registros por página.
   * @returns {Observable<ApiResponse<PagedResult<TipoCalculoTarifa>>>} Respuesta paginada.
   */
  obtenerTodos(pageNumber: number = 1, pageSize: number = 10): Observable<ApiResponse<PagedResult<TipoCalculoTarifa>>> {
    return this.api.get<ApiResponse<PagedResult<TipoCalculoTarifa>>>(
      this.baseUrl,
      { params: { pageNumber, pageSize } },
      'REGISTROS'
    );
  }

  /**
   * @description
   * Obtiene los detalles de un tipo de cálculo de tarifa por su identificador.
   * 
   * @param {number} id - Identificador primario del tipo.
   * @returns {Observable<ApiResponse<TipoCalculoTarifa>>} Entidad encontrada.
   */
  obtenerPorId(id: number): Observable<ApiResponse<TipoCalculoTarifa>> {
    return this.api.get<ApiResponse<TipoCalculoTarifa>>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }

  /**
   * @description
   * Registra un nuevo tipo de cálculo de tarifa.
   * 
   * @param {CrearTipoCalculoTarifaDto} command - Datos del nuevo tipo.
   * @returns {Observable<ApiResponse<number>>} ID del registro creado.
   */
  crear(command: CrearTipoCalculoTarifaDto): Observable<ApiResponse<number>> {
    return this.api.post<ApiResponse<number>>(this.baseUrl, command, {}, 'REGISTROS');
  }

  /**
   * @description
   * Actualiza un tipo de cálculo de tarifa existente.
   * 
   * @param {number} id - Identificador a actualizar.
   * @param {ActualizarTipoCalculoTarifaDto} command - Datos actualizados.
   * @returns {Observable<void>}
   */
  actualizar(id: number, command: ActualizarTipoCalculoTarifaDto): Observable<void> {
    return this.api.put<void>(`${this.baseUrl}/${id}`, { ...command, id }, {}, 'REGISTROS');
  }

  /**
   * @description
   * Elimina un tipo de cálculo de tarifa.
   * 
   * @param {number} id - Identificador a eliminar.
   * @returns {Observable<void>}
   */
  eliminar(id: number): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }
}
