export interface ConsultaRadicadoRequest {
  numeroRadicado: string;
  tipoDocumentoInterviniente: number;
  numeroDocumentoInterviniente: string;
}

export interface SolicitudRadicadoDto {
  id: number;
  numeroRadicado: string;
  fechaRadicacion: string;
  estadoSolicitudId: number;
  estadoSolicitudCodigo: string;
  estadoSolicitudNombre: string;
  etapaActual: number;
  vigenciaAnio: number;
  observacion?: string | null;
  fechaCompletado?: string | null;
}

export interface IntervinientePrincipalDto {
  id: number;
  tipoIdentificacionNombre?: string | null;
  numeroIdentificacion: string;
  nombre: string;
  direccion?: string | null;
  telefono?: string | null;
  email?: string | null;
}

export interface IntervinienteActoDto {
  rolIntervinienteNombre?: string | null;
  porcentajeParticipacion: number;
  tipoIdentificacionNombre?: string | null;
  numeroIdentificacion: string;
  nombre: string;
}

export interface ActoDocumentoDto {
  id: number;
  tipoActoRegistroNombre?: string | null;
  categoriaActoNombre?: string | null;
  inmuebleMatricula?: string | null;
  valorActo: number;
  baseDeclarada: number;
  observacion?: string | null;
  intervinientes: IntervinienteActoDto[];
}

export interface VencimientoLiquidacionDto {
  fechaVencimiento: string;
  diasRestantes: number;
  estaVencida: boolean;
  semaforo: 'VIGENTE' | 'POR_VENCER' | 'VENCIDA' | string;
}

export interface LiquidacionDocumentoDto {
  numeroLiquidacion: string;
  fechaLiquidacion: string;
  fechaVencimiento: string;
  valorTotal: number;
  estadoLiquidacionNombre?: string | null;
  esVigente: boolean;
  vencimiento?: VencimientoLiquidacionDto | null;
}

export interface DocumentoRadicadoDto {
  id: number;
  numeroDocumento: string;
  fechaDocumento: string;
  entidadRegistroNombre?: string | null;
  municipioJurisdiccionNombre?: string | null;
  descripcion?: string | null;
  actos: ActoDocumentoDto[];
  liquidaciones: LiquidacionDocumentoDto[];
}

export interface HistorialRadicadoDto {
  fecha: string;
  estadoAnteriorNombre?: string | null;
  estadoNuevoNombre?: string | null;
  motivo?: string | null;
}

export interface PagoRadicadoDto {
  numeroLiquidacion: string;
  estadoPagoId: number;
  estadoPagoCodigo: string;
  estadoPagoNombre: string;
  fechaPago?: string | null;
  valor: number;
  medioPago?: string | null;
  referencia?: string | null;
  observaciones?: string | null;
}

export interface ConsultaRadicadoData {
  solicitud: SolicitudRadicadoDto;
  intervinientePrincipal: IntervinientePrincipalDto;
  documentos: DocumentoRadicadoDto[];
  historial: HistorialRadicadoDto[];
  pago?: PagoRadicadoDto | null;
}
