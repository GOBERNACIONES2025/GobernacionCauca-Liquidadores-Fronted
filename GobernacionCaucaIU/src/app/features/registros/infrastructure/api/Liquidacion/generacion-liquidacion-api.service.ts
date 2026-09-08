import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../../core/services/base-api.service';
import { ApiResponse } from '../../../../../core/shared/models/shared.model';
import { 
  GenerarLiquidacionDto, 
  LiquidacionListadoDto,
  SimularLiquidacionDto
} from '../../../domain/models/Liquidacion/generacion-liquidacion.model';
import { LiquidacionSimuladaResponse } from '../../../domain/models/Liquidacion/liquidacion-simulada.model';
import { PagedResult } from '../../../domain/models/Radicacion/solicitud-wizard.model';

/**
 * @description
 * Servicio de infraestructura para la Generación de Liquidación de Impuesto de Registro.
 * Realiza el proceso unificado (Wizard All-in-One) en el backend de REGISTROS.
 * 
 * @see {@link BaseApiService}
 * @see {@link GenerarLiquidacionDto}
 */
@Injectable({
  providedIn: 'root',
})
export class GeneracionLiquidacionApiService {
  private api = inject(BaseApiService);
  private readonly baseUrl = '/Liquidacion';

  listarLiquidaciones(pageNumber: number = 1, pageSize: number = 10, search?: string): Observable<ApiResponse<PagedResult<LiquidacionListadoDto>>> {
    let url = `${this.baseUrl}?PageNumber=${pageNumber}&PageSize=${pageSize}`;
    if (search) url += `&Search=${encodeURIComponent(search)}`;
    return this.api.get<ApiResponse<PagedResult<LiquidacionListadoDto>>>(url, {}, 'REGISTROS');
  }

  /**
   * @description
   * Simula el cálculo de la liquidación en base al ID de la solicitud sin persistir en base de datos.
   * 
   * @param {number} solicitudId - Identificador de la solicitud.
   * @returns {Observable<ApiResponse<LiquidacionSimuladaResponse>>} DTO con totales y actos calculados.
   */
  simularLiquidacion(solicitudId: number): Observable<ApiResponse<LiquidacionSimuladaResponse>> {
    return this.api.post<ApiResponse<LiquidacionSimuladaResponse>>(`${this.baseUrl}/${solicitudId}/simular`, {}, {}, 'REGISTROS');
  }

  /**
   * @description
   * Envía el payload con el ID de la solicitud para generar la liquidación definitiva.
   * 
   * @param {GenerarLiquidacionDto} command - Contiene el solicitudId.
   * @returns {Observable<ApiResponse<number>>} ID de la liquidación generada.
   */
  generarLiquidacion(command: GenerarLiquidacionDto): Observable<ApiResponse<number>> {
    return this.api.post<ApiResponse<number>>(`${this.baseUrl}/${command.solicitudId}/generar`, {}, {}, 'REGISTROS');
  }

  /**
   * @description
   * Obtiene el documento PDF de la liquidación generada.
   * 
   * @param {number} id - Identificador de la liquidación.
   * @returns {Observable<Blob>} Archivo PDF en formato binario.
   */
  descargarPdf(id: number): Observable<Blob> {
    return this.api.get<Blob>(`${this.baseUrl}/${id}/pdf`, { responseType: 'blob' }, 'REGISTROS');
  }

  /**
   * @description
   * Anula una liquidación oficial generada.
   * 
   * @param {number} id - Identificador de la liquidación.
   * @param {string} motivo - Motivo de la anulación.
   */
  anularLiquidacion(id: number, motivo: string): Observable<ApiResponse<boolean>> {
    return this.api.post<ApiResponse<boolean>>(`${this.baseUrl}/${id}/anular`, { motivoAnulacion: motivo }, {}, 'REGISTROS');
  }

  /**
   * @description
   * Anula la liquidación actual y reapertura la solicitud asociada para reliquidar.
   * 
   * @param {number} id - Identificador de la liquidación.
   * @param {string} motivo - Motivo de la reliquidación.
   * @returns {Observable<ApiResponse<number>>} ID de la Solicitud habilitada para edición.
   */
  reliquidarLiquidacion(id: number, motivo: string): Observable<ApiResponse<number>> {
    return this.api.post<ApiResponse<number>>(`${this.baseUrl}/${id}/reliquidar`, { motivoReliquidacion: motivo }, {}, 'REGISTROS');
  }
}
