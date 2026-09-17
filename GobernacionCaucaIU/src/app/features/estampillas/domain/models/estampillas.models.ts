export type TipoPersona = 'NATURAL' | 'JURIDICA' | 'CONSORCIO' | 'UNION_TEMPORAL';

export type TipoDocumento = 'CC' | 'NIT' | 'CE' | 'PASAPORTE' | 'TI';

export type TipoContribuyente = 
  | 'GRAN_CONTRIBUYENTE' 
  | 'REGIMEN_ORDINARIO' 
  | 'REGIMEN_SIMPLE' 
  | 'PERSONA_NATURAL' 
  | 'ENTIDAD_PUBLICA'
  | 'NO_RESPONSABLE_IVA';

export type EstadoContribuyente = 'ACTIVO' | 'INACTIVO' | 'BLOQUEADO';

export interface Contribuyente {
  id: string;
  tipoPersona: TipoPersona;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  digitoVerificacion?: string;
  primerNombre?: string;
  segundoNombre?: string;
  primerApellido?: string;
  segundoApellido?: string;
  razonSocial?: string;
  nombreCompleto: string;
  
  // Contacto
  direccion: string;
  municipioId: string;
  municipioNombre: string;
  departamentoId: string;
  departamentoNombre: string;
  telefono: string;
  correoElectronico: string;
  
  // Información Tributaria
  tipoContribuyente: TipoContribuyente;
  esResponsableIVA: boolean;
  estado: EstadoContribuyente;
  observaciones?: string;
  fechaRegistro: string;
  fechaActualizacion?: string;
}

export type TipoContrato = 
  | 'PRESTACION_SERVICIOS' 
  | 'OBRA_PUBLICA' 
  | 'SUMINISTRO' 
  | 'CONVENIO_INTERADMINISTRATIVO' 
  | 'ACTO_ADMINISTRATIVO' 
  | 'ORDEN_COMPRA' 
  | 'CONSULTORIA' 
  | 'OTRO';

export type EstadoContrato = 'EN_EJECUCION' | 'LIQUIDADO' | 'SUSPENDIDO' | 'TERMINADO' | 'ANULADO';

export interface Contrato {
  id: string;
  numeroContrato: string; // ej: CT-2026-00452
  tipoContrato: TipoContrato;
  tipoContratoNombre: string;
  fechaSuscripcion: string;
  fechaInicio: string;
  fechaTerminacion: string;
  
  entidadContratante: string; // ej: Gobernación del Cauca - Secretaría de Infraestructura
  
  // Relación con Contribuyente
  contribuyenteId: string;
  contribuyenteNombre: string;
  contribuyenteDocumento: string;
  contribuyenteTipoDoc: TipoDocumento;
  
  objeto: string;
  valorContrato: number; // en pesos COP
  saldoPendiente?: number;
  
  municipioId: string;
  municipioNombre: string;
  vigencia: number; // 2024, 2025, 2026
  
  estado: EstadoContrato;
  observaciones?: string;
  fechaRegistro: string;
}

export type TipoBaseGravable = 
  | 'VALOR_BRUTO_CONTRATO' 
  | 'VALOR_NETO_FACTURADO' 
  | 'VALOR_ACTO' 
  | 'BASE_CONFIGURABLE' 
  | 'VALOR_OPERACION';

export type EstadoEstampilla = 'ACTIVA' | 'INACTIVA';

export interface Estampilla {
  id: string;
  codigo: string; // ej: EST-CULTURA, EST-HOSPITAL
  nombre: string; // ej: Estampilla Pro-Cultura
  descripcion: string;
  fundamentoLegal: string; // ej: Ordenanza Departamental 042 de 2022
  tipoBase: TipoBaseGravable;
  tarifaPorcentaje: number; // ej: 1.0 (significa 1%)
  vigencia: number;
  estado: EstadoEstampilla;
  cuentaBancariaRecaudo?: string;
  bancoDestino?: string;
  requiereExencionValidada?: boolean;
}

export interface TarifaEstampilla {
  id: string;
  estampillaId: string;
  estampillaNombre: string;
  vigencia: number;
  porcentajeTarifa: number;
  fechaInicioVigencia: string;
  fechaFinVigencia?: string;
  estado: 'ACTIVA' | 'INACTIVA' | 'HISTORICA';
  observaciones?: string;
}

export type EstadoVigencia = 'ACTIVA' | 'CERRADA' | 'FUTURA';

export interface VigenciaTributaria {
  anio: number;
  descripcion: string;
  estado: EstadoVigencia;
  fechaApertura: string;
  fechaCierre?: string;
  totalLiquidado: number;
  totalRecaudado: number;
}

export type EstadoLiquidacion = 
  | 'BORRADOR' 
  | 'GENERADA' 
  | 'PENDIENTE_PAGO' 
  | 'PAGADA' 
  | 'ANULADA' 
  | 'VENCIDA';

export interface ItemLiquidacionConcepto {
  estampillaId: string;
  estampillaCodigo: string;
  estampillaNombre: string;
  fundamentoLegal: string;
  valorBaseContrato: number;
  descuentosDeducciones: number;
  baseGravableNeta: number;
  porcentajeExencion: number; // 0 a 100
  baseGravableFinal: number;
  tarifaPorcentaje: number; // ej: 1.0%
  valorImpuesto: number;
}

export interface LiquidacionEstampilla {
  id: string;
  numeroLiquidacion: string; // ej: LIQ-2026-000124
  consecutivo: number;
  vigencia: number;
  fechaGeneracion: string;
  fechaLimitePago: string;
  fechaPago?: string;
  
  // Contribuyente
  contribuyenteId: string;
  contribuyenteNombre: string;
  contribuyenteDocumento: string;
  contribuyenteTipoDoc: TipoDocumento;
  contribuyenteDireccion: string;
  contribuyenteTelefono: string;
  contribuyenteEmail: string;
  contribuyenteMunicipio: string;
  
  // Contrato
  contratoId: string;
  numeroContrato: string;
  objetoContrato: string;
  entidadContratante: string;
  valorContrato: number;
  tipoContratoNombre: string;
  municipioEjecucion: string;
  
  // Detalle de conceptos liquidados
  conceptos: ItemLiquidacionConcepto[];
  
  // Exención aplicada global o por concepto
  aplicaExencion: boolean;
  tipoExencion?: string;
  fundamentoExencion?: string;
  porcentajeExencionGlobal?: number;
  documentoSoporteExencion?: string;
  
  // Totales
  totalBaseGravable: number;
  totalDescuentos: number;
  totalExencionesAhorro: number;
  totalImpuesto: number;
  interesesMora: number;
  sanciones: number;
  totalPagar: number;
  totalPagarLetras: string;
  
  estado: EstadoLiquidacion;
  motivoAnulacion?: string;
  fechaAnulacion?: string;
  
  // Auditoría
  creadoPor: string;
  usuarioRol: string;
  fechaCreacion: string;
  ipTerminal?: string;
  
  // Referencia de recaudo para código de barras (415)7709998000000(8020)000000000...
  codigoBarrasRecaudo: string;
  codigoSeguridadQR: string;
}

export type MedioPago = 
  | 'PSE' 
  | 'BANCO_AGRARIO' 
  | 'BANCOLOMBIA' 
  | 'BANCO_OCCIDENTE' 
  | 'TRANSFERENCIA_BANCARIA' 
  | 'VENTANILLA_TESORERIA' 
  | 'CHEQUE_GERENCIA' 
  | 'OTRO';

export type EstadoPago = 'APROBADO' | 'PENDIENTE' | 'RECHAZADO' | 'CONCILIADO';

export interface PagoEstampilla {
  id: string;
  numeroPago: string; // ej: PAG-2026-00085
  liquidacionId: string;
  numeroLiquidacion: string;
  contribuyenteId: string;
  contribuyenteNombre: string;
  contribuyenteDocumento: string;
  
  valorPagado: number;
  fechaPago: string;
  horaPago: string;
  medioPago: MedioPago;
  medioPagoNombre: string;
  numeroReferencia: string; // CUS o N° Aprobación
  entidadFinanciera: string;
  cuentaBancariaDestino: string;
  
  estado: EstadoPago;
  observaciones?: string;
  registradoPor: string;
  fechaRegistro: string;
  comprobanteUrl?: string;
}

export interface RegistroPagoRequest {
  liquidacionId: string;
  valorPagado: number;
  fechaPago: string;
  medioPago: MedioPago;
  numeroReferencia: string;
  entidadFinanciera: string;
  observaciones?: string;
}

export interface ExencionEstampilla {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  fundamentoLegal: string;
  porcentajeAplicable: number;
  aplicaA: 'TODAS' | 'CULTURA' | 'HOSPITAL' | 'UNIVERSIDAD' | 'ADULTO_MAYOR' | 'DEPORTE';
  estado: 'ACTIVA' | 'INACTIVA';
}

export interface MunicipioCauca {
  id: string;
  codigoDane: string;
  nombre: string;
  subregion: string; // Centro, Norte, Sur, Oriente, Macizo, Pacífico
  departamento: string;
}

export interface Departamento {
  id: string;
  codigoDane: string;
  nombre: string;
}

export type TipoAccionAuditoria = 
  | 'CREACION' 
  | 'ACTUALIZACION' 
  | 'ELIMINACION' 
  | 'LIQUIDACION' 
  | 'PAGO' 
  | 'ANULACION' 
  | 'CONSULTA' 
  | 'REINICIO_DEMO';

export interface RegistroAuditoria {
  id: string;
  fechaHora: string;
  usuarioNombre: string;
  usuarioRol: string;
  accion: TipoAccionAuditoria;
  entidadAfectada: 'CONTRIBUYENTE' | 'CONTRATO' | 'ESTAMPILLA' | 'LIQUIDACION' | 'PAGO' | 'CONFIGURACION';
  referenciaEntidad: string; // ej: LIQ-2026-000124, 900123456-7
  descripcion: string;
  ipOrigen?: string;
}

export interface LiquidacionResumenKpis {
  totalLiquidadoMes: number;
  totalRecaudoRealizado: number;
  totalPendientePago: number;
  totalContribuyentes: number;
  totalContratos: number;
  totalLiquidacionesGeneradas: number;
  totalLiquidacionesPagadas: number;
  totalLiquidacionesAnuladas: number;
  totalLiquidacionesVencidas: number;
  porcentajeEficaciaRecaudo: number;
}

export interface RecaudoPorEstampilla {
  estampillaId: string;
  estampillaNombre: string;
  estampillaCodigo: string;
  totalRecaudado: number;
  totalLiquidaciones: number;
  porcentajeParticipacion: number;
  colorHex: string;
}

export interface RecaudoMensual {
  mes: string;
  mesCorto: string;
  mesNumero: number;
  valorLiquidado: number;
  valorRecaudado: number;
}

export interface RecaudoPorMunicipio {
  municipioNombre: string;
  totalLiquidaciones: number;
  totalRecaudado: number;
}

export interface RecaudoPorVigencia {
  vigencia: number;
  totalLiquidado: number;
  totalRecaudado: number;
  pendientes: number;
}

export interface TopContribuyente {
  id: string;
  nombre: string;
  documento: string;
  municipio: string;
  totalContratos: number;
  totalLiquidado: number;
  totalPagado: number;
}

export type RolUsuario = 'ADMINISTRADOR' | 'FUNCIONARIO' | 'LIQUIDADOR' | 'CONSULTA';

export interface UsuarioMock {
  id: string;
  usuario: string;
  clave: string;
  nombre: string;
  cargo: string;
  rol: RolUsuario;
  email: string;
  dependencia: string;
  avatarUrl?: string;
}
