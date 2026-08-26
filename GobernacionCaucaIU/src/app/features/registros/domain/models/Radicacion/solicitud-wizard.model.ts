export interface CrearSolicitudDto {
  numeroRadicado: string;
  vigenciaId: number;
  departamentoId: number;
}

export interface RegistrarContribuyenteDto {
  contribuyenteId?: number | null;
  tipoPersonaId?: number;
  tipoIdentificacionId?: number;
  numeroIdentificacion?: string;
  nombre?: string;
  direccion?: string | null;
  telefono?: string | null;
  email?: string | null;
}

// Para registrar documento se usará FormData enviando el archivo
// y los siguientes campos como un JSON string en 'commandJson'
export interface RegistrarDocumentoDto {
  numeroDocumento: string;
  fechaDocumento: string;
  entidadRegistroId: number;
  municipioJurisdiccionId: number;
  descripcion?: string | null;
}

export interface IntervinienteActoDto {
  actoId: number;
  contribuyenteId: number;
  rolIntervinienteId: number;
  porcentajeParticipacion: number;
}

export interface ActoRegistradoDto {
  tipoActoRegistroId: number;
  inmuebleId?: number | null;
  valorActo: number;
  baseDeclarada: number;
  observacion?: string | null;
  exencionesIds: number[];
}

export interface RegistrarActosDto {
  actos: ActoRegistradoDto[];
}

export interface RegistrarIntervinientesDto {
  intervinientes: IntervinienteActoDto[];
}

// DTOs para Lectura (Respuesta del Backend)

export interface SolicitudContribuyenteDto {
  id: number;
  tipoPersonaId: number;
  tipoIdentificacionId: number;
  numeroIdentificacion: string;
  nombre: string;
  direccion?: string | null;
  telefono?: string | null;
  email?: string | null;
}

export interface SolicitudIntervinienteActoDto {
  id: number;
  rolIntervinienteId: number;
  rolIntervinienteNombre?: string;
  porcentajeParticipacion: number;
  contribuyente: SolicitudContribuyenteDto;
}

export interface SolicitudActoRegistradoDto {
  id: number;
  tipoActoRegistroId: number;
  tipoActoRegistroNombre?: string;
  inmuebleId?: number | null;
  valorActo: number;
  baseDeclarada: number;
  observacion?: string | null;
  intervinientes: SolicitudIntervinienteActoDto[];
}

export interface SolicitudDocumentoRegistroDto {
  id: number;
  numeroDocumento: string;
  fechaDocumento: string;
  entidadRegistroId: number;
  municipioJurisdiccionId: number;
  descripcion?: string | null;
  nombreArchivo?: string | null;
  actos: SolicitudActoRegistradoDto[];
}

export interface SolicitudCompletaDto {
  solicitudId: number;
  numeroRadicado: string;
  fechaRadicacion: string;
  observacion?: string | null;
  estadoSolicitudId: number;
  nombreEstado: string;
  etapaActual: number;
  vigenciaId: number;
  departamentoId: number;
  contribuyente?: SolicitudContribuyenteDto;
  documentos: SolicitudDocumentoRegistroDto[];
}

export interface SolicitudListadoDto {
  id: number;
  numeroRadicado: string;
  fechaRadicacion: string;
  estadoSolicitudId: number;
  nombreEstado: string;
  etapaActual: number;
  numeroIdentificacionContribuyente?: string;
  nombreContribuyente?: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

// Representación legacy (mantener si se usa en otro lado, de lo contrario la reemplazamos con SolicitudCompletaDto)
export interface SolicitudLiquidacion extends SolicitudCompletaDto {
  // Alias para retrocompatibilidad rápida
  id: number;
}
