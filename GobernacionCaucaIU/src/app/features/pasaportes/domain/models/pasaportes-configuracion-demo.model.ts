export type ModalidadPrimerPago = 'PORCENTAJE' | 'VALOR_FIJO';
export type ModoCalculoCupos = 'AUTOMATICO' | 'MANUAL';
export type TipoCalculoValor = 'VALOR_FIJO' | 'PORCENTAJE';
export type AplicacionTipoPasaporte = 'AMBOS' | 'ORDINARIO' | 'EJECUTIVO';
export type TipoBeneficioLiquidacion = 'DESCUENTO' | 'EXENCION';

export interface PagoWebDemoConfig {
  habilitado: boolean;
  modalidad: ModalidadPrimerPago;
  valor: number;
}

export interface TarifaPasaporteDemoConfig {
  id: number;
  codigo: 'ORDINARIO' | 'EJECUTIVO';
  nombre: string;
  valor: number;
  vigenciaDesde: string;
  obligatorio: true;
}

export interface ImpuestoLiquidacionDemoConfig {
  id: number;
  nombre: string;
  tipoCalculo: TipoCalculoValor;
  valor: number;
  aplicaA: AplicacionTipoPasaporte;
  activo: boolean;
}

export interface BeneficioLiquidacionDemoConfig {
  id: number;
  nombre: string;
  tipo: TipoBeneficioLiquidacion;
  tipoCalculo: TipoCalculoValor;
  valor: number;
  aplicaA: AplicacionTipoPasaporte;
  activo: boolean;
}

export interface LiquidacionDemoConfig {
  vigencia: number;
  tarifas: TarifaPasaporteDemoConfig[];
  impuestos: ImpuestoLiquidacionDemoConfig[];
  beneficios: BeneficioLiquidacionDemoConfig[];
}

export interface TipoCitaDemoConfig {
  id: number;
  codigo: string;
  nombre: string;
  cupo: number;
  activo: boolean;
}

export interface RangoHorarioDemoConfig {
  id: number;
  horaInicio: string;
  horaFin: string;
  activo: boolean;
}

export interface BloqueoHorarioDemoConfig {
  id: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  motivo: string;
  activo: boolean;
}

export interface FormalizadorDemoConfig {
  id: number;
  nombre: string;
  disponible: boolean;
  activo: boolean;
}

export interface PasaportesConfiguracionDemo {
  pagoWeb: PagoWebDemoConfig;
  liquidacion: LiquidacionDemoConfig;
  modoCalculoCupos: ModoCalculoCupos;
  intervaloMinutos: number;
  tiposCita: TipoCitaDemoConfig[];
  rangosHorarios: RangoHorarioDemoConfig[];
  bloqueos: BloqueoHorarioDemoConfig[];
  formalizadores: FormalizadorDemoConfig[];
}
