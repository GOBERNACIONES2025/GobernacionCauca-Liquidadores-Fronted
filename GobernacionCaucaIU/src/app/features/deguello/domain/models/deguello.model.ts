export interface DeclaracionDeguelloData {
  consecutivo: string;
  anioGravable: number;
  periodoGravable: string;
  esInicial: boolean;
  esCorreccion: boolean;
  declaracionCorregida?: string;
  
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
  estadoPago: 'PAGADO' | 'PENDIENTE' | 'VENCIDO' | 'CORREGIDA';
  esIntegracionIca: boolean;
  reciboBancario?: string;
  consumida?: boolean;
}

export interface ConsultaGuiaRequest {
  tipoDoc: number;
  documento: string;
  numeroGuia: string;
}

export interface PlantaBeneficio {
  id: string;
  codigoInvima: string;
  nombre: string;
  municipio: string;
  direccion: string;
  capacidadDiariaCabezas: number;
  esActiva: boolean;
  telefono: string;
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
