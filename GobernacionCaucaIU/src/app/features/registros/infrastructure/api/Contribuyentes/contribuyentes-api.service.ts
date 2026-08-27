import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../../core/services/base-api.service';
import { ApiResponse, PagedResult } from '../../../../../core/shared/models/shared.model';
import { 
  Contribuyente, 
  CrearContribuyenteRequest, 
  ActualizarContribuyenteRequest 
} from '../../../domain/models/Contribuyentes/contribuyente.model';

/**
 * @description
 * Servicio de infraestructura para la gestión de Contribuyentes en Registros.
 * Realiza peticiones HTTP al backend en el módulo de REGISTROS mediante BaseApiService.
 * 
 * @see {@link BaseApiService}
 * @see {@link Contribuyente}
 */
@Injectable({
  providedIn: 'root',
})
export class ContribuyentesApiService {
  private api = inject(BaseApiService);
  private readonly baseUrl = '/Contribuyentes';

  /**
   * @description
   * Recupera una lista paginada de contribuyentes.
   * 
   * @param {number} [pageNumber=1] - Índice de la página solicitada.
   * @param {number} [pageSize=10] - Cantidad de registros por página.
   * @returns {Observable<ApiResponse<PagedResult<Contribuyente>>>} Respuesta paginada.
   */
  obtenerTodos(pageNumber: number = 1, pageSize: number = 10, search?: string): Observable<ApiResponse<PagedResult<Contribuyente>>> {
    const params: any = { pageNumber, pageSize };
    if (search && search.trim() !== '') {
      params.search = search.trim();
    }
    return this.api.get<ApiResponse<PagedResult<Contribuyente>>>(
      this.baseUrl,
      { params },
      'REGISTROS'
    );
  }

  /**
   * @description
   * Obtiene los detalles de un contribuyente por su identificador.
   * 
   * @param {number} id - Identificador primario del contribuyente.
   * @returns {Observable<ApiResponse<Contribuyente>>} Entidad encontrada.
   */
  obtenerPorId(id: number): Observable<ApiResponse<Contribuyente>> {
    return this.api.get<ApiResponse<Contribuyente>>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }

  /**
   * @description
   * Registra un nuevo contribuyente.
   * 
   * @param {CrearContribuyenteRequest} command - Datos del nuevo contribuyente.
   * @returns {Observable<ApiResponse<number>>} ID del contribuyente creado.
   */
  crear(command: CrearContribuyenteRequest): Observable<ApiResponse<number>> {
    return this.api.post<ApiResponse<number>>(this.baseUrl, command, {}, 'REGISTROS');
  }

  /**
   * @description
   * Actualiza un contribuyente existente.
   * 
   * @param {number} id - Identificador a actualizar.
   * @param {ActualizarContribuyenteRequest} command - Datos actualizados.
   * @returns {Observable<void>}
   */
  actualizar(id: number, command: ActualizarContribuyenteRequest): Observable<void> {
    return this.api.put<void>(`${this.baseUrl}/${id}`, command, {}, 'REGISTROS');
  }

  /**
   * @description
   * Elimina un contribuyente.
   * 
   * @param {number} id - Identificador a eliminar.
   * @returns {Observable<void>}
   */
  eliminar(id: number): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }
}
