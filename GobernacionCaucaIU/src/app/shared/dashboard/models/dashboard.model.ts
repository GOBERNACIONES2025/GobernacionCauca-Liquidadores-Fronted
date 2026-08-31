import type { EChartsOption } from 'echarts';

export type TaxModuleKey = 
  | 'automotores' 
  | 'registros' 
  | 'licores' 
  | 'deguello' 
  | 'sobretasa' 
  | 'estampillas' 
  | 'pasaporte';

export interface TaxModuleMeta {
  key: TaxModuleKey;
  code: string;
  name: string;
  shortName: string;
  subtitle: string;
  icon: string;
  badge: string;
  primaryColor: string; // e.g. '#1e3a7b'
  accentColor: string;  // e.g. '#70b238'
  lightBg: string;
  darkBg: string;
  entityName: string;   // e.g. 'Vehículos', 'Actos Notariales', 'Botellas'
  apiEndpoint?: string;
}

export interface DashboardKpi {
  id: string;
  title: string;
  value: string | number;
  prefix?: string;
  suffix?: string;
  subtext?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon: string;
  colorClass: string;   // Tailored badge / icon styling
  tooltip?: string;
}

export interface RecentActivityItem {
  id: string | number;
  code: string;
  description: string;
  entity: string;
  amount: number;
  user: string;
  date: string;
  time: string;
  status: 'APROBADO' | 'PENDIENTE' | 'RECHAZADO' | 'LIQUIDADO' | 'PAGADO' | 'BORRADOR' | 'OFICIAL' | string;
  statusLabel?: string;
  badgeClass?: string;
  placa?: string;
  statusColor?: string;
}

export interface DashboardChartsData {
  recaudoTrend: EChartsOption;
  distribucionCategorias: EChartsOption;
  topMunicipios: EChartsOption;
  eficienciaTramites: EChartsOption;
}

export interface DashboardState {
  meta: TaxModuleMeta;
  vigenciaSeleccionada: number;
  kpis: DashboardKpi[];
  charts: DashboardChartsData | null;
  actividadesRecientes: RecentActivityItem[];
  loading: boolean;
  error: string | null;
}
