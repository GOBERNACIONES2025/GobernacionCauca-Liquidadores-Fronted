import { TipoPasaporte } from './agendamiento.model';

export interface LiquidacionPasaporteDemo {
  consecutivoCita: number;
  referenciaPago: string;
  fechaGeneracion: string;
  tipoPasaporte: string;
  codigoTipoPasaporte: string;
  ciudadano: string;
  documento: string;
  fechaCita: string;
  horario: string;
  concepto: string;
  valor: number;
  estado: 'SIMULACIÓN';
}

export interface DatosLiquidacionDemo {
  consecutivo: number;
  tipoPasaporte: TipoPasaporte;
  ciudadano: string;
  documento: string;
  fechaCita: string;
  horario: string;
}
