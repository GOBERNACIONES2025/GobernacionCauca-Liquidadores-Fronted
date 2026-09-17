/**
 * Modelos de datos para el módulo de Sobretasa a la Gasolina Motor y ACPM
 * Gobernación del Cauca - Secretaría de Hacienda Departamental
 * Normatividad: Ley 2093 de 2021
 */

export type TipoCombustible = 'GMC' | 'GME' | 'ACPM';

export type EstadoDeclaracion = 
  | 'BORRADOR'
  | 'EN_REVISION'
  | 'REQUERIDO'
  | 'OBSERVADO'
  | 'PENDIENTE_PAGO'
  | 'PAGADO_APROBADO'
  | 'RECHAZADO';

export type MetodoPagoSobretasa = 'PSE' | 'ASOBANCARIO_VENTANILLA' | 'TRANSFERENCIA_BANCOLOMBIA';

export interface DistribuidorMayorista {
  id: string;
  nit: string;
  razonSocial: string;
  nombreComercial: string;
  codigoSicomPlanta: string;
  municipioPlanta: string;
  departamentoPlanta: string;
  direccion: string;
  telefono: string;
  email: string;
  estado: 'Habilitado' | 'En Revisión' | 'Suspendido';
}

export interface EstacionServicioDestino {
  id: string;
  codigoSicomEds: string;
  nombreComercial: string;
  razonSocial: string;
  nit: string;
  municipio: string;
  departamento: string;
  direccion: string;
}

export interface DespachoItem {
  id: string;
  codigoGuiaSicom: string;
  fechaDespacho: string;
  placaVehiculo: string;
  tipoCombustible: TipoCombustible;
  galonesDespachados: number; // Galones americanos a 60 °F
  codigoSicomEds: string;
  estacionServicio?: EstacionServicioDestino;
  tarifaMunicipalAplicada: number;
  tarifaDepartamentalAplicada: number;
  subtotalMunicipal: number;
  subtotalDepartamental: number;
  totalItem: number;
  validadoSicom?: boolean;
}

export interface RegistroPagoSobretasa {
  metodo: MetodoPagoSobretasa;
  referenciaPago: string;
  codigoCus?: string;
  banco: string;
  fechaPago: string;
  valorPagado: number;
  estadoPago: 'APROBADO' | 'PENDIENTE' | 'RECHAZADO';
  comprobanteUrl?: string;
}

export interface HistorialFiscalizacionSobretasa {
  fecha: string;
  funcionario: string;
  cargo: string;
  accion: 'RADICACION' | 'VALIDACION_SICOM' | 'APROBACION' | 'REQUERIMIENTO' | 'OBSERVACION' | 'SUBSANACION' | 'PAGO_REGISTRADO' | 'RECHAZO';
  observacion: string;
  estadoAnterior?: EstadoDeclaracion;
  estadoNuevo: EstadoDeclaracion;
}

export interface DeclaracionSobretasa {
  id: string;
  numeroRadicado: string; // Ej: SOB-2026-0801
  periodoMes: number;     // 1 a 12
  periodoAnio: number;    // Ej: 2026
  mayoristaId: string;
  mayorista: DistribuidorMayorista;
  fechaRadicacion: string;
  fechaActualizacion?: string;
  fechaLimitePago: string;
  esExtemporanea: boolean;
  diasRetraso: number;
  sancionExtemporaneidad: number;
  
  despachos: DespachoItem[];
  
  // Acumulados de galones por tipo
  totalGalonesGMC: number;
  totalGalonesGME: number;
  totalGalonesACPM: number;
  totalGalonesGeneral: number;
  
  // Totales de la liquidación
  totalMunicipalGMC: number;
  totalDepartamentalGMC: number;
  totalMunicipalGME: number;
  totalDepartamentalGME: number;
  totalDepartamentalACPM: number;
  
  totalMunicipal: number;
  totalDepartamental: number;
  subtotalImpuesto: number;
  totalPagar: number;
  
  estado: EstadoDeclaracion;
  observacionesFiscalizacion?: string;
  observacionesSubsanacion?: string;
  historial: HistorialFiscalizacionSobretasa[];
  
  pago?: RegistroPagoSobretasa;
  comprobantePagoRef?: string;
  codigoBarrasBancario?: string;
  validacionSicomCompleta?: boolean;
}

export interface KpiSobretasa {
  totalGalonesJurisdiccion: number;
  totalGalonesGMC: number;
  totalGalonesGME: number;
  totalGalonesACPM: number;
  recaudoMunicipalTotal: number;
  recaudoDepartamentalTotal: number;
  recaudoGeneralEfectivo: number;
  declaracionesPendientesRevision: number;
  declaracionesObservadas: number;
  declaracionesPendientesPago: number;
  declaracionesPagadas: number;
  totalDeclaraciones: number;
}
