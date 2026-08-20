import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../../core/services/base-api.service';
import { ApiResponse } from '../../../../../core/shared/models/shared.model';
import { GenerarLiquidacionDto } from '../../../domain/models/Liquidacion/generacion-liquidacion.model';

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
  private readonly baseUrl = '/generacion-liquidacion';

  /**
   * @description
   * Envía el payload completo para liquidar actos de registro y generar el número de liquidación.
   * 
   * @param {GenerarLiquidacionDto} command - Datos del contribuyente, radicación, documento, actos e intervinientes.
   * @returns {Observable<ApiResponse<number>>} ID de la liquidación generada.
   */
  generarLiquidacion(command: GenerarLiquidacionDto): Observable<ApiResponse<number>> {
    return this.api.post<ApiResponse<number>>(`${this.baseUrl}/generar`, command, {}, 'REGISTROS');
  }
}
