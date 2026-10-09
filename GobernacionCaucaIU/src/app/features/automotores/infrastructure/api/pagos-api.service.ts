// Autor: Juan Sebastián Montaño Pérez
// Fecha: 08/10/2026
// Módulo: Pagos - Portal Ciudadano
// Descripción: Servicio de infraestructura para iniciar pagos y consultar el estado de transacciones en la pasarela externa.

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

export interface TransactionInfoResponse {
  id_Transaccion?: number;
  idTransaccion?: number;
  estado?: string;
  estado_Descripcion?: string;
  estadoDescripcion?: string;
  cus?: string;
  factura?: number;
  referencia?: string;
  valorApagar?: number;
  fecha_Creacion?: string;
  fechaCreacion?: string;
  fecha_Banco?: string;
  fechaBanco?: string;
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

  consultarEstado(
    factura?: number,
    referencia?: string,
    idTramite: number = 14
  ): Observable<PaymentApiResponse<TransactionInfoResponse[]>> {
    const params: Record<string, string | number> = {};
    if (factura !== undefined && factura !== null) {
      params['factura'] = factura;
    }
    if (referencia) {
      params['referencia'] = referencia;
    }
    if (idTramite !== undefined && idTramite !== null) {
      params['idTramite'] = idTramite;
    }

    return this.api.get<PaymentApiResponse<TransactionInfoResponse[]>>(
      '/pagos/estado',
      { params },
      'AUTOMOTORES'
    );
  }

  consultarEstadoPorReferencia(
    referencia: string,
    factura?: number,
    idTramite: number = 14
  ): Observable<PaymentApiResponse<TransactionInfoResponse[]>> {
    const params: Record<string, string | number> = {};
    if (factura !== undefined && factura !== null) {
      params['factura'] = factura;
    }
    if (idTramite !== undefined && idTramite !== null) {
      params['idTramite'] = idTramite;
    }

    return this.api.get<PaymentApiResponse<TransactionInfoResponse[]>>(
      `/pagos/estado/${encodeURIComponent(referencia)}`,
      { params },
      'AUTOMOTORES'
    );
  }
}
