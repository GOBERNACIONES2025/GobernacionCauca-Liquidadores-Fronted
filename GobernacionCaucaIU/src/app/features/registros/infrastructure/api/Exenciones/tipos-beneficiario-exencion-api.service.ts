import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../../core/services/base-api.service';
import { ApiResponse, PagedResult } from '../../../../../core/shared/models/shared.model';
import { 
  TipoBeneficiarioExencion, 
  CrearTipoBeneficiarioExencionRequest, 
  ActualizarTipoBeneficiarioExencionRequest 
} from '../../../domain/models/Exenciones/tipo-beneficiario-exencion.model';

/**
 * @description
 * Servicio de infraestructura para la gestión de Tipos de Beneficiarios de Exención.
 * Se comunica con la API de Registros delegando peticiones a BaseApiService.
 * 
 * @see {@link BaseApiService}
 * @see {@link TipoBeneficiarioExencion}
 */
@Injectable({
  providedIn: 'root',
})
export class TiposBeneficiarioExencionApiService {
  private api = inject(BaseApiService);
  private readonly baseUrl = '/TiposBeneficiarioExencion';

  /**
   * @description
   * Recupera una colección paginada de tipos de beneficiarios de exención.
   * 
   * @param {number} [pageNumber=1] - Índice de la página solicitada.
   * @param {number} [pageSize=10] - Cantidad de registros por página.
   * @returns {Observable<ApiResponse<PagedResult<TipoBeneficiarioExencion>>>} Respuesta con lista paginada.
   */
  obtenerTodos(pageNumber: number = 1, pageSize: number = 10): Observable<ApiResponse<PagedResult<TipoBeneficiarioExencion>>> {
    return this.api.get<ApiResponse<PagedResult<TipoBeneficiarioExencion>>>(
      this.baseUrl,
      { params: { pageNumber, pageSize } },
      'REGISTROS'
    );
  }

  /**
   * @description
   * Obtiene los detalles de un tipo de beneficiario por su ID.
   * 
   * @param {number} id - Identificador único del tipo de beneficiario.
   * @returns {Observable<ApiResponse<TipoBeneficiarioExencion>>} Entidad encontrada.
   */
  obtenerPorId(id: number): Observable<ApiResponse<TipoBeneficiarioExencion>> {
    return this.api.get<ApiResponse<TipoBeneficiarioExencion>>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }

  /**
   * @description
   * Registra un nuevo tipo de beneficiario de exención.
   * 
   * @param {CrearTipoBeneficiarioExencionRequest} command - Datos del nuevo tipo de beneficiario.
   * @returns {Observable<ApiResponse<number>>} ID del registro creado.
   */
  crear(command: CrearTipoBeneficiarioExencionRequest): Observable<ApiResponse<number>> {
    return this.api.post<ApiResponse<number>>(this.baseUrl, command, {}, 'REGISTROS');
  }

  /**
   * @description
   * Actualiza un tipo de beneficiario de exención existente.
   * 
   * @param {number} id - Identificador único a modificar.
   * @param {ActualizarTipoBeneficiarioExencionRequest} command - Datos actualizados.
   * @returns {Observable<void>}
   */
  actualizar(id: number, command: ActualizarTipoBeneficiarioExencionRequest): Observable<void> {
    return this.api.put<void>(`${this.baseUrl}/${id}`, command, {}, 'REGISTROS');
  }

  /**
   * @description
   * Elimina un tipo de beneficiario de exención.
   * 
   * @param {number} id - Identificador del recurso a eliminar.
   * @returns {Observable<void>}
   */
  eliminar(id: number): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }
}
