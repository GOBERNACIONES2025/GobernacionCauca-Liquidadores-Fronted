// Autor: Juan Sebastián Montaño Pérez
// Fecha: 30/09/2026
// Módulo: Liquidaciones Vehiculares / Snapshots
// Descripción: Modelos e interfaces fuertemente tipadas para preliquidaciones congeladas (LiquidacionSnapshots).

export type EstadoPagoSnapshot = 'PENDIENTE' | 'PAGADO' | 'ANULADO';

export interface ConceptoSnapshotItem {
  codigo: string;
  nombre: string;
  valor: number;
}

export interface LiquidacionSnapshotItem {
  idLiquidacionSnapshots: number;
  idLiquidacion: number;
  numeroLiquidacion: string;
  placa: string;
  marcaLinea?: string | null;
  modelo?: number | null;
  vigenciaAnio: number;
  propietarioNombreCompleto?: string | null;
  propietarioIdentificacion?: string | null;
  fechaEmisionSnapshot: string;
  fechaVencimientoFactura: string;
  diasMoraAlEmitir: number;
  valorImpuestoPrincipal: number;
  valorInteresesMora: number;
  valorDescuentoProntoPago: number;
  valorTotalPagar: number;
  referenciaPagoOnline?: string | null;
  estadoPago: EstadoPagoSnapshot | string;
  createdAt: string;
  esVencido: boolean;
}

export interface LiquidacionSnapshotDetalle extends LiquidacionSnapshotItem {
  conceptosSnapshotJsonRaw?: string | null;
  conceptos: ConceptoSnapshotItem[];
  claseVehiculo?: string | null;
  tipoVehiculo?: string | null;
  servicioVehiculo?: string | null;
  numeroMotor?: string | null;
  numeroChasis?: string | null;
}

export interface LiquidacionSnapshotFilterParams {
  page?: number;
  pageSize?: number;
  buscar?: string;
  idLiquidacion?: number;
  placa?: string;
  numeroLiquidacion?: string;
  referenciaPago?: string;
  estadoPago?: string;
  fechaEmisionDesde?: string;
  fechaEmisionHasta?: string;
  vigencia?: number;
}

export interface ConciliacionSnapshotParams {
  numeroLiquidacion: string;
  fechaPago: string;
}

export interface SnapshotKpis {
  totalSnapshots: number;
  totalPendientes: number;
  totalPagados: number;
  totalVencidos: number;
  valorTotalPendiente: number;
  valorTotalRecaudado: number;
}
