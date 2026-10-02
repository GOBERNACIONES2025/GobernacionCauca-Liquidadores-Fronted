// Autor: Juan Sebastián Montaño Pérez
// Fecha: 02/10/2026
// Módulo: Impuesto de Registro - Pagos en Línea
// Descripción: Modelos y contratos fuertemente tipados para la pasarela de pagos Fintech en Registros.

export interface IniciarPagoRegistrosRequest {
  liquidacionId: number;
  numeroLiquidacion?: string;
  numeroRadicado: string;
  numeroDocumento: string;
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

export interface TransactionStatusResult {
  referencia?: string;
  ticketId?: string;
  transactionId?: string;
  estado?: string;
  codigoRespuesta?: string;
  mensaje?: string;
  valorPagado?: number;
  fechaPago?: string;
  banco?: string;
  cus?: string;
  estaAprobada?: boolean;
  estaPendiente?: boolean;
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
