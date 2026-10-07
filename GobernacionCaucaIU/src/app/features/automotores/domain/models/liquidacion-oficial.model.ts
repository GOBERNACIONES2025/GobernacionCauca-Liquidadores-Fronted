/**
 * Modelos de Dominio para el Módulo de Liquidación Oficial de Aforo y Prescripción de Vigencias.
 *
 * Base Legal:
 *   - ETN Art. 717: Liquidación Oficial de Aforo (expedida dentro de los 5 años siguientes al vencimiento del plazo para declarar).
 *   - ETN Art. 720: Recurso de Reconsideración (plazo de 2 meses desde la notificación para interponer recurso).
 *   - ETN Art. 643: Sanción por no declarar (160% del impuesto determinado, mínimo 10 UVT).
 *   - ETN Art. 817: Término de prescripción de la acción de cobro (5 años).
 *   - ETN Art. 828: Títulos ejecutivos (liquidaciones oficiales ejecutoriadas prestan mérito ejecutivo).
 */

export type TabLiquidacionOficial = 'aptos_aforo' | 'emitidas' | 'en_firme' | 'prescritas';

export type EstadoActoLiquidacion = 'BORRADOR' | 'EMITIDO' | 'NOTIFICADO' | 'EN_RECURSO' | 'EJECUTORIADO' | 'PRESCRITO' | 'ANULADO';

export type EstadoPostalLiquidacion = 'PENDIENTE_ENVIO' | 'EN_TRANSITO' | 'ENTREGADO' | 'DEVUELTO' | 'PUBLICADO_AVISO';

export interface ActoLiquidacionOficialDetalle {
  id: number;
  anio: number;
  avaluo: number;
  tarifa: number;
  impuestoBase: number;
  sancionNoDeclarar: number;
  interesesMora: number;
  totalVigencia: number;
}

export interface ActoLiquidacionOficial {
  id: number;
  numeroActo: string;
  radicadoOficial?: number | null;
  actoEmplazamientoId?: number | null;
  numeroActoEmplazamiento?: string | null;
  vehiculoId: number;
  placa: string;
  marcaLinea?: string | null;
  modelo?: number | null;
  propietarioNombre?: string | null;
  propietarioIdentificacion?: string | null;

  fechaEmision: string;
  vigencias: string;
  vigenciasLista: number[];

  avaluoTotal: number;
  impuestoBase: number;
  sancionNoDeclarar: number;
  interesesMora: number;
  totalLiquidacionOficial: number;

  estadoActo: EstadoActoLiquidacion | string;

  // Trazabilidad Postal (ETN Art. 565)
  numeroGuiaPostal?: string | null;
  empresaEnvio?: string | null;
  fechaEnvioPostal?: string | null;
  fechaEntregaNotificacion?: string | null;
  estadoPostal: EstadoPostalLiquidacion | string;
  observacionesPostal?: string | null;
  responsableEnvio?: string | null;
  municipioDestino?: string | null;
  direccionNotificacion?: string | null;

  // Notificación Subsidiaria por Aviso Web (ETN Art. 568)
  publicadoAvisoWeb: boolean;
  fechaPublicacionAviso?: string | null;
  fechaDesfijacionAviso?: string | null;

  // Vía Gubernativa y Recursos (ETN Art. 720)
  fechaNotificacionEfectiva?: string | null;
  fechaLimiteRecurso?: string | null;
  diasRestantesRecurso?: number | null;
  tieneRecursoInterpuesto: boolean;
  fechaInterposicionRecurso?: string | null;
  resolucionRecurso?: string | null;
  fechaEjecutoria?: string | null;
  enFirmeTituloEjecutivo: boolean;

  // Pérdida de Competencia / Prescripción (ETN Arts. 717 y 817)
  esPrescrito: boolean;
  numeroResolucionPrescripcion?: string | null;
  fechaResolucionPrescripcion?: string | null;
  motivoPrescripcion?: string | null;

  detalles: ActoLiquidacionOficialDetalle[];
  mensaje?: string | null;
}

export interface LiquidacionOficialKpis {
  totalEmplazadosVencidosAptos: number;
  totalLiquidacionesOficialesEmitidas: number;
  totalEnNotificacionPostal: number;
  totalNotificadasEfectivas: number;
  totalEnFirmeTitulosEjecutivos: number;
  totalPrescritasPerdidaCompetencia: number;

  totalCarteraAforada: number;
  totalSancionesNoDeclarar: number;
  totalInteresesMoratorios: number;
  totalEnFirmeCobroCoactivo: number;
}

export interface LiquidacionOficialFiltros {
  page?: number;
  pageSize?: number;
  placa?: string;
  vigencia?: number;
  estadoActo?: string;
  estadoPostal?: string;
  tab?: TabLiquidacionOficial;
  fechaDesde?: string;
  fechaHasta?: string;
}

export interface EmitirLiquidacionOficialRequest {
  placa: string;
  actoEmplazamientoId?: number | null;
  vigencias?: number[];
  responsableEmision?: string;
  observaciones?: string;
}

export interface EmitirLiquidacionOficialMasivaRequest {
  placas?: string[];
  vigenciaEspecifica?: number;
  responsableEmision?: string;
}

export interface ActualizarTrazabilidadPostalLiqOficialRequest {
  actoLiquidacionOficialId: number;
  numeroGuiaPostal?: string;
  empresaEnvio?: string;
  fechaEnvioPostal?: string;
  fechaEntregaNotificacion?: string;
  estadoPostal?: string;
  observacionesPostal?: string;
}

export interface DeclararPrescripcionRequest {
  placa: string;
  actoLiquidacionOficialId?: number | null;
  vigenciasAPrescribir?: number[];
  motivoPrescripcion?: string;
  fundamentoNormativo?: string;
  responsableResolucion?: string;
}

export interface PagedResultLiquidacionOficial<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
