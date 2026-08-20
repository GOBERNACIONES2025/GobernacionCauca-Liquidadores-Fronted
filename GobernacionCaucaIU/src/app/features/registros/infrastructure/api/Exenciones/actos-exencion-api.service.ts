import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../../core/services/base-api.service';
import { ApiResponse, PagedResult } from '../../../../../core/shared/models/shared.model';
import { ActoExencion, CrearActoExencionRequest } from '../../../domain/models/Exenciones/acto-exencion.model';

/**
 * @description
 * Servicio de infraestructura para la gestión de Vinculaciones Acto-Exención.
 * Se comunica con la API de Registros delegando peticiones a BaseApiService.
 * 
 * @see {@link BaseApiService}
 * @see {@link ActoExencion}
 */
@Injectable({
  providedIn: 'root',
})
export class ActosExencionApiService {
  private api = inject(BaseApiService);
  private readonly baseUrl = '/ActosExencion';

  /**
   * @description
   * Recupera una colección paginada de vinculaciones Acto-Exención.
   * 
   * @param {number} [pageNumber=1] - Índice de la página solicitada.
   * @param {number} [pageSize=10] - Cantidad de registros por página.
   * @param {number} [exencionId] - Filtro opcional por ID de exención.
   * @returns {Observable<ApiResponse<PagedResult<ActoExencion>>>} Lista paginada de vinculaciones.
   */
  obtenerTodos(
    pageNumber: number = 1, 
    pageSize: number = 10, 
    exencionId?: number
  ): Observable<ApiResponse<PagedResult<ActoExencion>>> {
    const params: any = { pageNumber, pageSize };
    if (exencionId) params.exencionId = exencionId;

    return this.api.get<ApiResponse<PagedResult<ActoExencion>>>(
      this.baseUrl,
      { params },
      'REGISTROS'
    );
  }

  /**
   * @description
   * Obtiene los detalles de una vinculación Acto-Exención específica por su ID.
   * 
   * @param {number} id - Identificador de la vinculación.
   * @returns {Observable<ApiResponse<ActoExencion>>} Entidad encontrada.
   */
  obtenerPorId(id: number): Observable<ApiResponse<ActoExencion>> {
    return this.api.get<ApiResponse<ActoExencion>>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }

  /**
   * @description
   * Vincula una o varias Tipos de Acto a una Exención.
   * 
   * @param {CrearActoExencionRequest} command - Datos de vinculación.
   * @returns {Observable<ApiResponse<number[]>>} Lista de IDs recién creados.
   */
  crear(command: CrearActoExencionRequest): Observable<ApiResponse<number[]>> {
    return this.api.post<ApiResponse<number[]>>(this.baseUrl, command, {}, 'REGISTROS');
  }

  /**
   * @description
   * Sincroniza la lista de Tipos de Acto vinculados a una Exención (agrega/remueve según corresponda).
   * 
   * @param {number} exencionId - Identificador de la exención.
   * @param {number[]} tiposActoRegistroIds - Colección de IDs de tipos de acto a asociar.
   * @returns {Observable<void>}
   */
  actualizar(exencionId: number, tiposActoRegistroIds: number[]): Observable<void> {
    return this.api.put<void>(`${this.baseUrl}/${exencionId}`, tiposActoRegistroIds, {}, 'REGISTROS');
  }
}
