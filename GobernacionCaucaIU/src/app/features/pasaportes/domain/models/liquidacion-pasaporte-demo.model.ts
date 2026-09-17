import type { TipoPasaporte } from './agendamiento.model';
import type { ConceptoDemo } from './flujo-pasaporte-demo.model';

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

  // Se conservan por compatibilidad con el generador actual.
  concepto: string;
  valor: number;

  estado: 'SIMULACIÓN';
  pagoAprobado: boolean;

  // Datos reales de la liquidación demo.
  conceptos: ConceptoDemo[];
  totalLiquidado: number;
  valorPagado: number;
  saldoPendiente: number;
}

export interface DatosLiquidacionDemo {
  consecutivo: number;
  referenciaPago: string;
  pagoAprobado: boolean;
  tipoPasaporte: TipoPasaporte;
  ciudadano: string;
  documento: string;
  fechaCita: string;
  horario: string;

  // Se utilizan exactamente los valores ya calculados
  // en el flujo del liquidador. El PDF no debe recalcularlos.
  conceptos: ConceptoDemo[];
  totalLiquidado: number;
  primerPago: number;
  saldoPendiente: number;
}