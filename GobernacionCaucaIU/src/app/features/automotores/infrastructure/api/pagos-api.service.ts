// Autor: Juan Sebastián Montaño Pérez
// Fecha: 01/10/2026
// Módulo: Pagos - Portal Ciudadano
// Descripción: Servicio de infraestructura para iniciar y consultar transacciones en la pasarela de pagos.

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../core/services/base-api.service';

export interface IniciarPagoCiudadanoRequest {
  liquidacionId: number;
  placa: string;
  documento: string;
  email?: string;
  telefono?: string;
  urlRetorno?: string;
}

export interface TransactionResult {
  url?: string;
  Url?: string;
  urlBanco?: string;
  UrlBanco?: string;
  ticketId?: string;
  transactionId?: string;
  idTransaccion?: number;
  referencia?: string;
  estado?: string;
  urlPagoEfectiva?: string;
}

export interface PaymentApiResponse<T> {
  isSuccess?: boolean;
  IsSuccess?: boolean;
  message?: string;
  Message?: string;
  result?: T;
  Result?: T;
  state?: number;
  State?: number;
}

@Injectable({
  providedIn: 'root'
})
export class PagosApiService {
  private api = inject(BaseApiService);

  iniciarPago(request: IniciarPagoCiudadanoRequest): Observable<PaymentApiResponse<TransactionResult>> {
    return this.api.post<PaymentApiResponse<TransactionResult>>('/pagos/iniciar', request, {}, 'AUTOMOTORES');
  }

  consultarEstado(referencia: string): Observable<PaymentApiResponse<any>> {
    return this.api.get<PaymentApiResponse<any>>(`/pagos/estado/${encodeURIComponent(referencia)}`, {}, 'AUTOMOTORES');
  }
}
