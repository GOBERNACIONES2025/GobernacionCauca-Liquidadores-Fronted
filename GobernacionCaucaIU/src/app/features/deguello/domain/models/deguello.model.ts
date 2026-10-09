export interface DeclaracionDeguelloData {
  consecutivo: string;
  anioGravable: number;
  periodoGravable: string;
  esInicial: boolean;
  esCorreccion: boolean;
  esReliquidacion?: boolean;
  declaracionCorregida?: string;
  declaracionReliquidada?: string;
  
  // Datos del Responsable
  razonSocial: string;
  nit: string;
  dv: string;
  telefonoFijo: string;
  municipio: string;
  direccionNotificacion: string;
  
  // Liquidación Privada
  baseGravable: number;       // Cantidad de cabezas de ganado mayor
  tarifa: number;             // Tarifa por cabeza (ej: $49.800)
  valorBruto: number;         // baseGravable * tarifa
  participacionMunicipios: number; // 10% del valor bruto
  subtotal: number;           // valorBruto - participacionMunicipios
  sanciones: number;
  subtotalMasSanciones: number; // subtotal + sanciones
  interesMora: number;
  totalAPagar: number;        // subtotalMasSanciones + interesMora
  
  // Firmas y Responsables Legales
  firmaContador: boolean;
  firmaRevisor: boolean;
  nombreRepresentante: string;
  tipoDocRep: 'CC' | 'CE';
  numeroDocRepresentante: string;
  nombreContadorORevisor: string;
  tipoDocContador: 'CC' | 'CE';
  numeroDocContadorORevisor: string;
  tarjetaProfesional: string;
  
  // Fechas y Control
  fechaLimitePago: string;
  fechaImpresion?: string;
  codigoBarrasBase64?: string;
  
  // Control de Integración ICA y Semáforo
  numeroGuiaIca?: string;
  predioOrigen?: string;
  plantaBeneficio?: string;
  especie?: string;
  fechaVencimientoGuia?: string;
  estadoPago: 'RADICADA' | 'PENDIENTE' | 'PAGADO' | 'PAGADA' | 'VENCIDO' | 'VENCIDA' | 'CORREGIDA' | 'RELIQUIDADA' | 'ANULADA' | 'RECHAZADA';
  esIntegracionIca: boolean;
  reciboBancario?: string;
  consumida?: boolean;
  rutaArchivoGuiaIca?: string;
  nombreArchivoGuiaIca?: string;
  rutaArchivoLiquidacionPdf?: string;
  nombreArchivoLiquidacion?: string;
  rutaArchivoPago?: string;
  nombreArchivoPago?: string;
  numeroRadicado?: string;
  fechaRadicacion?: string;
  turnoRevision?: number;
  observacionAnulacion?: string;
  fechaHoraAnulacion?: string;
}

export interface ConsultaGuiaRequest {
  tipoDoc: number;
  documento: string;
  numeroGuia: string;
}

export interface PlantaBeneficio {
  id: string;
  idPlanta?: number;
  codigoInvima: string;
  nombre: string;
  municipio: string;
  direccion: string;
  capacidadDiariaCabezas: number;
  esActiva: boolean;
  telefono: string;
  nit?: string;
  claveAcceso?: string;
  emailOficial?: string;
  representanteLegal?: string;
  docRepresentante?: string;
  esFrigorificoRegional?: boolean;
}

export interface ParametrosDeguello {
  vigencia: number;
  valorUvt: number;
  factorTarifaMayorUvt: number;
  tarifaCalculadaCabezas: number;
  porcentajeParticipacionMunicipios: number;
  sancionMinimaUvt: number;
  diasLimiteDeclaracionMensual: number;
}

export interface InformeMunicipioRecaudo {
  municipio: string;
  cabezas: number;
  valorBruto: number;
  participacion10: number;
  totalDepartamental: number;
  formularios: number;
}

export interface InformePlantaBeneficio {
  planta: string;
  municipio: string;
  cabezasFaenadas: number;
  capacidadDiaria: number;
  recaudoTotal: number;
  porcentajeOcupacion: number;
}

export interface ResponsableConsulta {
  existe: boolean;
  tipo: 'PLANTA' | 'HISTORICO_DECLARACIONES' | 'NO_REGISTRADO';
  mensaje: string;
  nit?: string;
  dv?: string;
  razonSocial?: string;
  municipio?: string;
  idMunicipio?: number;
  direccion?: string;
  telefono?: string;
  email?: string;
  representanteLegal?: string;
  docRepresentante?: string;
  codigoInvima?: string;
  idPlanta?: number;
}

// ============================================================================
// MODELOS PARA PASARELA DE PAGOS FINTECH / PSE
// ============================================================================

export interface IniciarPagoDeguelloRequest {
  consecutivo: string;
  nitContribuyente?: string;
  email: string;
  telefono: string;
  direccion?: string;
  urlRetorno?: string;
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

export interface TransactionResult {
  url?: string;
  Url?: string;
  urlBanco?: string;
  UrlBanco?: string;
  ticketId?: string;
  transactionId?: string;
  referencia?: string;
  token?: string;
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
  EstaAprobada?: boolean;
  estaPendiente?: boolean;
  EstaPendiente?: boolean;
}
