// Autor: Juan Sebastián Montaño Pérez
// Fecha: 02/10/2026
// Módulo: Impuesto de Registro - Pagos en Línea
// Descripción: Servicio de infraestructura para iniciar transacciones y consultar estado bancario en Registros.

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../../core/services/base-api.service';
import { 
  IniciarPagoRegistrosRequest, 
  PaymentApiResponse, 
  TransactionResult, 
  TransactionStatusResult 
} from '../../../domain/models/Pagos/pago-pasarela.model';

@Injectable({
  providedIn: 'root'
})
export class RegistrosPagosApiService {
  private api = inject(BaseApiService);
  private readonly dbContext = 'REGISTROS';

  /**
   * Inicia el proceso de pago en la pasarela Fintech para una liquidación de registros.
   * @param request Datos de la liquidación, contribuyente y URLs de retorno.
   */
  iniciarPago(request: IniciarPagoRegistrosRequest): Observable<PaymentApiResponse<TransactionResult>> {
    return this.api.post<PaymentApiResponse<TransactionResult>>('/Pagos/iniciar', request, {}, this.dbContext);
  }

  /**
   * Consulta el estado de una transacción por su número de referencia único.
   * Si la transacción fue aprobada, el backend concilia la liquidación a estado PAGADA.
   * @param referencia Número de referencia de la liquidación (ej. LIQ-2026...).
   */
  consultarEstado(referencia: string): Observable<PaymentApiResponse<TransactionStatusResult>> {
    return this.api.get<PaymentApiResponse<TransactionStatusResult>>(
      `/Pagos/estado/${encodeURIComponent(referencia)}`, 
      {}, 
      this.dbContext
    );
  }
}
