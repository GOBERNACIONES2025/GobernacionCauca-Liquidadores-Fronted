/**
 * Modelos de Dominio para el Módulo de Ejecuciones Fiscales y Cobro Coactivo (Fase 3).
 *
 * Base Legal:
 *   - ETN Art. 823 a 843-2: Procedimiento de Cobro Coactivo Administrativo.
 *   - ETN Art. 826: Mandamiento de Pago (plazo perentorio de 15 días hábiles para pago o excepciones).
 *   - ETN Arts. 565, 568: Notificación postal y aviso web.
 *   - ETN Art. 836: Constancia de ejecutoria y orden de seguir adelante la ejecución.
 *   - ETN Arts. 837, 839: Medidas cautelares preventivas (embargos bancarios y vehiculares).
 *   - ETN Art. 831: Excepciones contra el mandamiento de pago.
 *   - Terminación por pago y archivo definitivo del expediente.
 */

export type TabEjecucionesFiscales =
  | 'sin_mandamiento'
  | 'en_tramite'
  | 'ejecutoriados_medidas'
  | 'terminados';

export type EstadoProcesoCoactivo =
  | 'TITULO_EN_FIRME'
  | 'MANDAMIENTO_LIBRADO'
  | 'NOTIFICADO_EN_TERMINOS'
  | 'EJECUTORIADO'
  | 'MEDIDAS_CAUTELARES_ACTIVAS'
  | 'SUSPENDIDO_ACUERDO'
  | 'TERMINADO_PAGO'
  | 'ARCHIVADO';

export type TipoMedidaCautelar = 'EMBARGO_BANCARIO' | 'EMBARGO_VEHICULO' | 'CAPTURA_POLICIA';

export type EstadoMedidaCautelar = 'DECRETADA' | 'NOTIFICADA' | 'EFECTIVA' | 'SUSPENDIDA' | 'LEVANTADA';

export interface MedidaCautelar {
  id: number;
  expedienteCobroId: number;
  tipoMedida: TipoMedidaCautelar | string;
  numeroResolucionEmbargo: string;
  fechaResolucionEmbargo: string;
  limiteCuantiaEmbargo: number;
  entidadDestino: string;
  numeroOficio: string;
  fechaOficio: string;
  estadoMedida: EstadoMedidaCautelar | string;
  fechaEfectividad?: string | null;
  valorRetenido?: number | null;
  numeroCuentaRetenida?: string | null;
  observaciones?: string | null;
  numeroResolucionDesembargo?: string | null;
  fechaResolucionDesembargo?: string | null;
  numeroOficioDesembargo?: string | null;
  fechaOficioDesembargo?: string | null;
  motivoLevantamiento?: string | null;
  createdAt: string;
}

export interface TrazabilidadCobro {
  id: number;
  expedienteCobroId: number;
  tipoActuacion: string;
  descripcion: string;
  numeroDocumento?: string | null;
  rutaArchivoPdf?: string | null;
  usuario: string;
  fechaActuacion: string;
}

export interface ExpedienteCobroCoactivo {
  id: number;
  numeroExpediente: string;
  vehiculoId: number;
  placa: string;
  personaId: number;
  deudorIdentificacion: string;
  deudorNombreCompleto: string;
  deudorDireccion?: string | null;
  deudorTelefono?: string | null;
  deudorCorreo?: string | null;

  actoLiquidacionOficialId?: number | null;
  origenTitulo: string;
  numeroTituloEjecutivo: string;
  fechaTituloEjecutivo: string;
  vigencias: string;

  totalCapital: number;
  totalSancion: number;
  totalIntereses: number;
  totalCostas: number;
  totalDeuda: number;

  abogadoAsignado?: string | null;
  estadoProceso: EstadoProcesoCoactivo | string;

  // Mandamiento de Pago
  numeroMandamiento?: string | null;
  fechaEmisionMandamiento?: string | null;
  fechaLimiteExcepciones?: string | null;
  diasRestantesTerminos?: number | null;

  // Notificaciones
  tipoNotificacion?: string | null;
  numeroGuiaPostal?: string | null;
  empresaEnvio?: string | null;
  fechaEnvioPostal?: string | null;
  fechaEntregaNotificacion?: string | null;
  estadoPostal: string;
  observacionesNotificacion?: string | null;
  publicadoAvisoWeb: boolean;
  fechaPublicacionWeb?: string | null;
  fechaDesfijacionWeb?: string | null;
  direccionNotificacion?: string | null;
  municipioNotificacion?: string | null;

  // Constancia Ejecutoria
  tieneConstanciaEjecutoria: boolean;
  numeroConstanciaEjecutoria?: string | null;
  fechaConstanciaEjecutoria?: string | null;
  autoSeguirAdelante: boolean;

  // Excepciones
  tieneExcepciones: boolean;
  fechaPresentacionExcepciones?: string | null;
  numeroResolucionExcepciones?: string | null;
  fechaResolucionExcepciones?: string | null;
  sentidoFalloExcepciones?: string | null;

  // Terminación y Cierre
  fechaPagoTotal?: string | null;
  numeroReciboPago?: string | null;
  valorPagado?: number | null;
  numeroAutoCierre?: string | null;
  fechaAutoCierre?: string | null;
  motivoTerminacion?: string | null;

  usuarioRegistro?: string | null;
  createdAt: string;

  medidasCautelares: MedidaCautelar[];
  trazabilidades: TrazabilidadCobro[];
}

export interface EjecucionesFiscalesKpis {
  titulosSinMandamiento: number;
  mandamientosEnTramite: number;
  procesosEjecutoriados: number;
  medidasCautelaresActivas: number;
  procesosTerminados: number;
  totalCarteraCoactiva: number;
  totalRecaudado: number;
}

export interface EjecucionesFiscalesFiltros {
  tab?: TabEjecucionesFiscales;
  placa?: string;
  numeroIdentificacion?: string;
  numeroExpediente?: string;
  numeroMandamiento?: string;
  estadoProceso?: string;
  abogadoAsignado?: string;
  page?: number;
  pageSize?: number;
}

export interface IniciarExpedienteRequest {
  actoLiquidacionOficialId: number;
  abogadoAsignado?: string;
  observaciones?: string;
  usuario?: string;
}

export interface LibrarMandamientoRequest {
  abogadoAsignado?: string;
  observaciones?: string;
  usuario?: string;
}

export interface RegistrarNotificacionMandamientoRequest {
  tipoNotificacion: string;
  numeroGuiaPostal?: string;
  empresaEnvio?: string;
  fechaEnvioPostal?: string;
  fechaEntregaNotificacion?: string;
  estadoPostal: string;
  observacionesNotificacion?: string;
  publicadoAvisoWeb: boolean;
  fechaPublicacionWeb?: string;
  fechaDesfijacionWeb?: string;
  direccionNotificacion?: string;
  municipioNotificacion?: string;
  usuario?: string;
}

export interface EmitirConstanciaEjecutoriaRequest {
  observaciones?: string;
  usuario?: string;
}

export interface DecretarMedidaCautelarRequest {
  tipoMedida: string;
  entidadesDestino: string[];
  limiteCuantiaEmbargo?: number;
  observaciones?: string;
  usuario?: string;
}

export interface LevantarMedidaCautelarRequest {
  medidaId: number;
  motivoLevantamiento: string;
  observaciones?: string;
  usuario?: string;
}

export interface RegistrarAutoCierreRequest {
  fechaPagoTotal: string;
  numeroReciboPago: string;
  valorPagado: number;
  motivoTerminacion?: string;
  observaciones?: string;
  usuario?: string;
}

export interface AsignarAbogadoRequest {
  abogadoAsignado: string;
  usuario?: string;
}
