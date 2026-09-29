import { TipoPasaporte } from './agendamiento.model';

export interface ConfiguracionPasaporteDemo { pagoWebHabilitado: boolean }
export interface EstadoPersonaDemo { existe: boolean; documento: string; tienePagoValido?: boolean; tieneCita?: boolean; estadoCita?: 'PENDIENTE_AGENDAMIENTO' | 'AGENDADA'; tipoPasaporteId?: number }
export interface ConceptoDemo { nombre: string; valor: number }
export interface CalculoPasaporteDemo {
  tipoPasaporte: TipoPasaporte;
  conceptos: ConceptoDemo[];
  total: number;
  primerPago: number;
  saldo: number;
}
export interface CitaDemo {
  citaId: number;
  consecutivo: number;
  estadoCita: 'PENDIENTE_AGENDAMIENTO' | 'AGENDADA';
  pagoAprobado: boolean;
  referenciaPago: string;
  tipoPasaporte: TipoPasaporte;
  calculo: CalculoPasaporteDemo;
  fecha?: string;
  hora?: string;
  programacion?: { fecha: string; hora: string };
}
