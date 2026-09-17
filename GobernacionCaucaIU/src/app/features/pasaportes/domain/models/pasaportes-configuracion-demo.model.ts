export type ModalidadPrimerPago = 'PORCENTAJE' | 'VALOR_FIJO';
export type ModoCalculoCupos = 'AUTOMATICO' | 'MANUAL';

export interface PagoWebDemoConfig {
  habilitado: boolean;
  modalidad: ModalidadPrimerPago;
  valor: number;
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
  modoCalculoCupos: ModoCalculoCupos;
  intervaloMinutos: number;
  tiposCita: TipoCitaDemoConfig[];
  rangosHorarios: RangoHorarioDemoConfig[];
  bloqueos: BloqueoHorarioDemoConfig[];
  formalizadores: FormalizadorDemoConfig[];
}
