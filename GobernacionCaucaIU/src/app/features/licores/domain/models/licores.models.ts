/**
 * Modelos de datos para el módulo de Impuesto al Consumo de Licores (ICL)
 * Gobernación del Cauca - Secretaría de Hacienda Departamental
 */

export type TipoBebida = 'DESTILADO' | 'VINO' | 'APERITIVO';

export type TipoEntidad = 'Fábrica Departamental' | 'Importador' | 'Productor Artesanal' | 'Distribuidor Mayorista';

export type EstadoEntidad = 'Habilitado' | 'En Revisión' | 'Suspendido';

export type EstadoLiquidacion = 
  | 'BORRADOR'
  | 'EN_REVISION'
  | 'REQUERIDO'
  | 'PENDIENTE_PAGO'
  | 'PAGADO_EMITIDO'
  | 'LEGALIZADO'
  | 'RECHAZADO';

export type MetodoPago = 'PSE' | 'ASOBANCARIO_VENTANILLA' | 'TRANSFERENCIA_BANCOLOMBIA';

export interface EntidadProductora {
  id: string;
  nit: string;
  razonSocial: string;
  nombreComercial: string;
  tipo: TipoEntidad;
  registroInvimaPrincipal: string;
  departamentoOrigen: string;
  municipioOrigen: string;
  direccion: string;
  telefono: string;
  email: string;
  estado: EstadoEntidad;
  prefijoEstampilla: string;
}

export interface ProductoLicor {
  id: string;
  sku: string;
  nombre: string;
  marca: string;
  tipoBebida: TipoBebida;
  gradosAlcohol: number; // Ej: 29 para 29°
  volumenCm3: number;   // Ej: 750 para 750 cm3
  registroInvima: string;
  pvpDaneOficial: number; // Precio de Venta al Público certificado por el DANE (COP)
  descripcion?: string;
  imagenUrl?: string;
}

export interface CalculoSubtotales {
  tarifaGradoAplicada: number;
  factorVolumen: number;
  especificoUnitario: number;
  adValoremUnitario: number;
  ivaCedidoUnitario: number;
  totalUnitario: number;
  subtotalEspecifico: number;
  subtotalAdValorem: number;
  subtotalIva: number;
  totalItem: number;
}

export interface ItemLote {
  id: string;
  productoId: string;
  producto: ProductoLicor;
  cantidad: number; // Número de botellas / unidades
  calculo: CalculoSubtotales;
  observaciones?: string;
}

export interface RangoEstampillas {
  desde: string; // Ej: FLA-000001
  hasta: string; // Ej: FLA-000500
  cantidadTotal: number;
  prefijo: string;
  numeroInicial: number;
  numeroFinal: number;
}

export interface VehiculoTransporte {
  id: string;
  placaVehiculo: string;
  placaRemolque?: string;
  tipoVehiculo: string;
  nombreConductor: string;
  cedulaConductor: string;
  telefonoConductor?: string;
  numeroPrecintoSeguridad?: string;
  botellasAsignadas?: number;
}

export interface InformacionTransporte {
  departamentoOrigen: string;
  municipioOrigen: string;
  departamentoDestino: string;
  municipioDestino: string;
  direccionDestino: string;
  empresaTransportadora: string;
  nitTransportador: string;
  nombreConductor: string;
  cedulaConductor: string;
  telefonoConductor: string;
  placaVehiculo: string;
  placaRemolque?: string;
  tipoVehiculo: string;
  rutaAutorizada: string;
  tiempoEstimadoHoras: number;
  vehiculos?: VehiculoTransporte[];
}

export interface RegistroPago {
  metodo: MetodoPago;
  referenciaPago: string;
  codigoTransaccionPse?: string;
  banco?: string;
  fechaPago: string;
  valorPagado: number;
  estadoPago: 'APROBADO' | 'PENDIENTE' | 'RECHAZADO';
  comprobanteUrl?: string;
}

export interface HistorialAuditoria {
  fecha: string;
  funcionario: string;
  cargo: string;
  accion: 'CREACION' | 'REQUERIMIENTO' | 'SUBSANACION' | 'APROBACION' | 'PAGO_REGISTRADO' | 'EMISION_TORNAGUIA' | 'LEGALIZACION' | 'RECHAZO';
  observacion: string;
  estadoAnterior?: EstadoLiquidacion;
  estadoNuevo: EstadoLiquidacion;
}

export interface LiquidacionLicores {
  id: string;
  numeroRadicado: string; // Ej: RAD-2026-0001
  fechaRadicacion: string;
  fechaActualizacion?: string;
  entidadProductoraId: string;
  entidadProductora: EntidadProductora;
  transporte: InformacionTransporte;
  items: ItemLote[];
  totalBotellas: number;
  
  // Totales de la liquidación
  subtotalEspecifico: number;
  subtotalAdValorem: number;
  subtotalIva: number;
  totalPagar: number;
  
  // Estado y ciclo de vida
  estado: EstadoLiquidacion;
  observacionesFuncionario?: string;
  observacionesSubsanacion?: string;
  historial: HistorialAuditoria[];
  
  // Datos de pago
  pago?: RegistroPago;
  
  // Datos de Tornaguía y Estampillas (cuando está PAGADO_EMITIDO o LEGALIZADO)
  tornaguiaNumero?: string; // Ej: TGN-2026-0045
  fechaEmisionTornaguia?: string;
  fechaVencimientoTornaguia?: string;
  rangoEstampillas?: RangoEstampillas;
  fechaLegalizacion?: string;
  funcionarioLegalizador?: string;
  actaLegalizacionNumero?: string;
  codigoQrData?: string;
  hashFirmaDigital?: string;
}

export interface KpiLicores {
  totalRecaudado: number;
  totalBotellasDeclaradas: number;
  pendientesAuditoria: number;
  requeridosSubsanacion: number;
  pendientesPago: number;
  tornaguiasActivas: number;
  tornaguiasLegalizadas: number;
  totalRadicados: number;
}
