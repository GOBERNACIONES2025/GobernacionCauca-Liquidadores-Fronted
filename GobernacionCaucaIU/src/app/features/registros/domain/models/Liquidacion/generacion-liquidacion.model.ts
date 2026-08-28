/**
 * DTO para la información de un contribuyente en el proceso de generación de liquidación.
 */
export interface ContribuyenteLiquidacionDto {
  id?: number | null;
  tipoPersonaId: number;
  tipoIdentificacionId: number;
  numeroIdentificacion: string;
  nombre: string;
  direccion?: string | null;
  telefono?: string | null;
  email?: string | null;
}

/**
 * DTO para la información de la radicación en el proceso de liquidación.
 */
export interface RadicacionLiquidacionDto {
  numeroRadicado: string;
  fechaRadicacion: string;
  vigenciaId: number;
  departamentoId: number;
  observacion?: string | null;
}

/**
 * DTO para el documento de registro que origina la liquidación (ej. Escritura pública).
 */
export interface DocumentoRegistroLiquidacionDto {
  numeroDocumento: string;
  fechaDocumento: string;
  entidadRegistroId: number;
  municipioJurisdiccionId: number;
  descripcion?: string | null;
}

/**
 * DTO para un interviniente asociado a un acto de registro a liquidar.
 */
export interface IntervinienteActoLiquidacionDto {
  contribuyenteId?: number | null;
  contribuyenteNuevo?: ContribuyenteLiquidacionDto | null;
  rolIntervinienteId: number;
  porcentajeParticipacion: number;
}

/**
 * DTO para un acto de registro dentro de la solicitud de liquidación.
 */
export interface ActoRegistradoLiquidacionDto {
  tipoActoRegistroId: number;
  inmuebleId?: number | null;
  valorActo: number;
  baseDeclarada: number;
  observacion?: string | null;
  exencionesIds: number[];
  intervinientes: IntervinienteActoLiquidacionDto[];
}

/**
 * Payload completo para la generación de una liquidación (a partir de una solicitud completada).
 */
export interface GenerarLiquidacionDto {
  solicitudId: number;
}

/**
 * Payload completo para la simulación de una liquidación (stateless).
 */
export interface SimularLiquidacionDto {
  radicacion: RadicacionLiquidacionDto;
  actos: ActoRegistradoLiquidacionDto[];
}

export interface CrearContribuyenteLiquidacionDtoRequest {
  id?: number | null;
  tipoPersonaId: number;
  tipoIdentificacionId: number;
  numeroIdentificacion: string;
  nombre: string;
  direccion?: string | null;
  telefono?: string | null;
  email?: string | null;
}

export interface ActualizarContribuyenteLiquidacionDtoRequest {
  id?: number | null;
  tipoPersonaId: number;
  tipoIdentificacionId: number;
  numeroIdentificacion: string;
  nombre: string;
  direccion?: string | null;
  telefono?: string | null;
  email?: string | null;
  activo: boolean;
}

export interface RadicacionLiquidacionListadoDto {
  solicitudId: number;
  numeroRadicado: string;
  fechaRadicacion: string;
  observacion: string;
}

export interface EstadoLiquidacionListadoDto {
  id: number;
  codigo: string;
  nombre: string;
  badgeClase: string;
}

export interface AccionesPermitidasDto {
  permiteContinuar: boolean;
  permiteCancelar: boolean;
  permitePagar: boolean;
  permiteDescargarPdf: boolean;
  permiteVerDetalle: boolean;
}

export interface ContribuyenteLiquidacionListadoDto {
  id: number;
  tipoPersona: string;
  tipoIdentificacion: string;
  numeroIdentificacion: string;
  nombreCompleto: string;
  email: string;
  telefono: string;
  direccion: string;
}

export interface DocumentoRegistroListadoDto {
  numeroDocumento: string;
  fechaDocumento: string;
  entidadRegistro: string;
  tipoEntidad: string;
  codigoEntidad: string;
  municipioJurisdiccion: string;
  tieneSoporteAdjunto: boolean;
  nombreArchivoSoporte: string;
}

export interface TotalesLiquidacionListadoDto {
  subtotal: number;
  totalDescuentos: number;
  totalPagar: number;
}

export interface LiquidacionListadoDto {
  id: number;
  numeroLiquidacion: string;
  esVigente: boolean;
  fechaLiquidacion: string;
  fechaVencimiento: string;
  diasParaVencer: number;
  estaVencida: boolean;
  createdAt: string;
  creadoPor: string;
  radicacion: RadicacionLiquidacionListadoDto;
  estado: EstadoLiquidacionListadoDto;
  accionesPermitidas: AccionesPermitidasDto;
  contribuyente: ContribuyenteLiquidacionListadoDto;
  documentoRegistro: DocumentoRegistroListadoDto;
  totales: TotalesLiquidacionListadoDto;
}
