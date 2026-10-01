// ── Respuestas Genéricas ──────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  errors?: string[];
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

// ── Tipos y Enums de Novedad ──────────────────────────────────────
export type TipoNovedad = 
  | 'TRASPASO'
  | 'CAMBIO_CARACTERISTICAS'
  | 'CAMBIO_SERVICIO'
  | 'TRASLADO_CUENTA'
  | 'RADICACION_CUENTA'
  | 'CANCELACION_MATRICULA'
  | 'REMATRICULACION'
  | 'BLINDAJE'
  | 'DESBLINDAJE'
  | 'CAMBIO_MOTOR'
  | 'CAMBIO_COMBUSTIBLE'
  | 'EXENCION';

export type EstadoNovedad = 
  | 'RADICADO'
  | 'EN_REVISION'
  | 'APROBADO'
  | 'RECHAZADO'
  | 'ANULADO';

// ── DTOs de Novedades ─────────────────────────────────────────────
export interface NovedadItemDto {
  id: number;
  vehiculoId: number;
  placa: string;
  marca?: string;
  linea?: string;
  modelo?: number;
  propietarioActual?: string;
  documentoPropietario?: string;
  numeroRadicado: string;
  tipoNovedad: TipoNovedad;
  estado: EstadoNovedad;
  motivo?: string;
  observaciones?: string;
  rutaArchivoSoporte?: string;
  fechaRadicacion: string;
  fechaAprobacion?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface NovedadDetalleDto extends NovedadItemDto {
  clase?: string;
  servicio?: string;
  combustible?: string;
  datosPreviosJson?: string;
  datosNuevosJson?: string;
}

export interface NovedadKpisDto {
  totalNovedades: number;
  radicadas: number;
  enRevision: number;
  aprobadas: number;
  rechazadas: number;
  anuladas: number;
  mesActual: number;
}

// ── Payload genérico (mantener para retrocompatibilidad si es necesario) ────
export interface RadicarNovedadRequest {
  vehiculoId?: number;
  placa?: string;
  numeroRadicado?: string | null;
  tipoNovedad: string;
  estado?: EstadoNovedad;
  motivo?: string;
  observaciones?: string;
  rutaArchivoSoporte?: string;
  datosPreviosJson?: string;
  datosNuevosJson?: string;
  fechaRadicacion?: string;
}

export interface CambiarEstadoNovedadRequest {
  nuevoEstado: EstadoNovedad;
  observaciones?: string;
  fechaAprobacion?: string | null;
}

// ── Interfaces tipadas por endpoint (contratos del backend) ───────────────────

/** Elemento de nuevosPropietarios para traspaso */
export interface NuevoPropietarioRequest {
  /** ID de persona existente en BD */
  personaId?: number | null;
  /** Número de documento (para persona nueva o búsqueda) */
  numeroDocumento?: string;
  /** Nombre completo — requerido si la persona es nueva */
  nombreCompleto?: string;
  tipoDocumentoId?: number;           // 1=CC, 2=NIT, 3=CE
  naturalizaJuridicaId?: number;      // 1=Natural, 2=Jurídica
  telefono?: string;
  correoElectronico?: string;
  direccion?: string;
  tipoVinculoPersonaId?: number;      // 1=Propietario, 2=Poseedor
  porcentajePropiedad?: number;
  esResponsablePrincipal?: boolean;
  fechaInicio?: string;
}

/**
 * POST /api/novedades-vehiculo/traspaso
 * Requiere vehiculoId o placa, y al menos un elemento en nuevosPropietarios.
 */
export interface RadicarTraspasoRequest {
  vehiculoId?: number;
  placa?: string;
  numeroRadicado?: string | null;
  motivo?: string;
  observaciones?: string;
  rutaArchivoSoporte?: string;
  fechaRadicacion?: string;
  fechaTraspaso?: string;             // Fecha efectiva del traspaso (YYYY-MM-DD)
  nuevosPropietarios: NuevoPropietarioRequest[];
}

/**
 * POST /api/novedades-vehiculo/traslado-circulacion
 * Requiere vehiculoId o placa, y nuevoOrganismoTransitoId.
 */
export interface RadicarTrasladoCirculacionRequest {
  vehiculoId?: number;
  placa?: string;
  nuevoOrganismoTransitoId: number;
  numeroRadicado?: string | null;
  motivo?: string;
  observaciones?: string;
  rutaArchivoSoporte?: string;
  fechaRadicacion?: string;
}

/**
 * POST /api/novedades-vehiculo/rematricula
 * Requiere vehiculoId o placa. Al menos un campo de cambio debe estar presente.
 */
export interface RadicarRematriculaRequest {
  vehiculoId?: number;
  placa?: string;
  numeroRadicado?: string | null;
  motivo?: string;
  observaciones?: string;
  rutaArchivoSoporte?: string;
  fechaRadicacion?: string;
  // ── Campos de cambio (al menos 1 requerido) ──────────────────────
  nuevaPlaca?: string;
  nuevoServicio?: string;             // 'PUBLICO' | 'PARTICULAR' | 'OFICIAL'
  nuevoEstadoMatriculaId?: number;
  nuevoTipoVehiculo?: string;
  nuevaClase?: string;
  nuevaCombustible?: string;
  nuevaMarca?: string;
  nuevaLinea?: string;
  nuevoModelo?: number;
  nuevoCilindraje?: number;
  nuevoTonelaje?: number | null;
  nuevoPasajeros?: number;
  nuevosWatts?: number;
  nuevaFechaMatricula?: string;
}

/** Respuesta de radicación: { value: <id_novedad> } */
export interface RadicarNovedadResponse {
  value: number;
}

// ── Payload de Mutación legacy (conservado para compatibilidad) ───────────────
export interface NovedadMutationPayload {
  nuevoPropietarioId?: number;
  porcentajePropiedad?: number;
  tipoVinculoPersonaId?: number;
  organismoTransitoId?: number;
  estadoMatriculaId?: number;
  placa?: string;
  nuevaPlaca?: string;
  numeroActa?: string;
  fechaRematricula?: string;
  cilindraje?: number | string;
  combustible?: string;
  clase?: string;
  servicio?: string;
  nuevoServicio?: string;
  servicioActual?: string;
  marca?: string;
  linea?: string;
  modelo?: number;
  pasajeros?: number;
  tonelaje?: number;
}
