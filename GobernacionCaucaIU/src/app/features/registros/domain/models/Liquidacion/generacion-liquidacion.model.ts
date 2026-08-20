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
 * Payload completo para la generación de una liquidación (Wizard All-in-One).
 */
export interface GenerarLiquidacionDto {
  contribuyente: ContribuyenteLiquidacionDto;
  radicacion: RadicacionLiquidacionDto;
  documento: DocumentoRegistroLiquidacionDto;
  actos: ActoRegistradoLiquidacionDto[];
}
