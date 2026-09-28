// Re-exporta los DTOs del dominio para que los consumidores de la capa
// de aplicación no necesiten importar directamente desde domain/.
export type {
  PropietarioItem,
  LiquidacionItem,
  LiquidacionKpis
} from '../../../domain/models/liquidacion.model';


import { PropietarioItem, LiquidacionItem } from '../../../domain/models/liquidacion.model';
export interface GrupoLiquidacionEmitida {
  placa: string;
  marcaLinea: string;
  modelo?: number;
  propietario: PropietarioItem[];
  totalVehiculo: number;
  impuestoTotal: number;
  sancionTotal: number;
  interesesTotal: number;
  vigencias: LiquidacionItem[];
  descuentosTotal: number;
  sistematizacionTotal: number;

  estadoConsolidado: string;
  diasMoraMaximo: number;
  fechaLimitePago?: string;
  fechaCalculoMora?: string;
  esCalculoHoy: boolean;
  motivoMoraConsolidado: string;
}

export interface ReciboModel {
  esUnificado: boolean;
  placa: string;
  marcaLinea: string;
  modelo?: number;
  propietario: PropietarioItem[];
  fechaEmision: Date;
  fechaLimiteTexto: string;
  esFechaInmediata: boolean;
  totalPagar: number;
  items: {
    numeroLiquidacion: string;
    vigenciaAnio: number;
    impuestoBase: number;
    descuentos: number;
    sancionExtemporaneidad: number;
    interesesMora: number;
    sistematizacionEstampillas: number;
    totalPagar: number;
  }[];
}
