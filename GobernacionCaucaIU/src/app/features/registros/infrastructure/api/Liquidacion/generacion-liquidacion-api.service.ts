import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../../core/services/base-api.service';
import { ApiResponse } from '../../../../../core/shared/models/shared.model';
import { GenerarLiquidacionDto } from '../../../domain/models/Liquidacion/generacion-liquidacion.model';
import { LiquidacionSimuladaResponse } from '../../../domain/models/Liquidacion/liquidacion-simulada.model';

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

  /**
   * @description
   * Simula el cálculo de la liquidación sin persistir en base de datos.
   * 
   * @param {GenerarLiquidacionDto} command - Datos de la solicitud.
   * @returns {Observable<ApiResponse<LiquidacionSimuladaResponse>>} DTO con totales y actos calculados.
   */
  simularLiquidacion(command: GenerarLiquidacionDto): Observable<ApiResponse<LiquidacionSimuladaResponse>> {
    return this.api.post<ApiResponse<LiquidacionSimuladaResponse>>(`${this.baseUrl}/simular`, command, {}, 'REGISTROS');
  }

  /**
   * @description
   * Envía el payload completo para liquidar actos de registro y generar el número de liquidación.
   * Modificado para admitir multipart/form-data y adjuntar un archivo.
   * 
   * @param {File} file - Documento de soporte.
   * @param {GenerarLiquidacionDto} command - Datos del contribuyente, radicación, documento, actos e intervinientes.
   * @returns {Observable<ApiResponse<number>>} ID de la liquidación generada.
   */
  generarLiquidacion(file: File, command: GenerarLiquidacionDto): Observable<ApiResponse<number>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('commandJson', JSON.stringify(command));
    
    return this.api.post<ApiResponse<number>>(`${this.baseUrl}/generar`, formData, {}, 'REGISTROS');
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
}
