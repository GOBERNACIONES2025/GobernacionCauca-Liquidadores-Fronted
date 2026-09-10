export type TipoReporte = 'VEHICULOS' | 'CONTRIBUYENTES';

export interface ReporteVehiculoFiltros {
  buscar?: string;
  estado?: string;
  tipoVehiculo?: string;
  page?: number;
  pageSize?: number;
}

export interface ReporteContribuyenteFiltros {
  buscar?: string;
  estado?: string; // 'Todos' | 'Activos' | 'Inactivos'
  naturalezaJuridicaId?: number; // 0 = Todos, 1 = Natural, 2 = Jurídica
  situacion?: string; // 'Todos' | 'Al Día' | 'Con Deuda'
  page?: number;
  pageSize?: number;
}

export interface ReportePreviewResumen {
  totalRegistros: number;
  tipoReporte: TipoReporte;
  filtrosAplicados: number;
}
