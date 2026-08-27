import { Injectable, inject, signal, computed } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import type { EChartsOption } from 'echarts';
import { BaseApiService } from '../../../core/services/base-api.service';
import { TAX_MODULES_CONFIG } from '../constants/tax-config.constant';
import {
  TaxModuleKey,
  TaxModuleMeta,
  DashboardKpi,
  DashboardChartsData,
  RecentActivityItem,
} from '../models/dashboard.model';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private router = inject(Router);
  private api = inject(BaseApiService);

  // Estados Reactivos
  readonly currentTaxKey = signal<TaxModuleKey>('automotores');
  readonly vigencia = signal<number>(2026);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  readonly kpis = signal<DashboardKpi[]>([]);
  readonly charts = signal<DashboardChartsData | null>(null);
  readonly actividadesRecientes = signal<RecentActivityItem[]>([]);

  // Metadatos del impuesto activo
  readonly currentTaxMeta = computed<TaxModuleMeta>(() => {
    return TAX_MODULES_CONFIG[this.currentTaxKey()] || TAX_MODULES_CONFIG['automotores'];
  });

  constructor() {
    // Detectar cambios de ruta para adaptar el dashboard automáticamente
    this.detectRouteTaxModule(this.router.url);

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.detectRouteTaxModule(event.urlAfterRedirects || event.url);
      });
  }

  /**
   * Detecta el impuesto a partir del segmento inicial de la URL
   */
  public detectRouteTaxModule(url: string): void {
    const segments = url.toLowerCase().split('/').filter(Boolean);
    const firstSegment = segments[0] as TaxModuleKey;

    if (firstSegment && TAX_MODULES_CONFIG[firstSegment]) {
      if (this.currentTaxKey() !== firstSegment) {
        this.currentTaxKey.set(firstSegment);
        this.loadDashboardData(firstSegment, this.vigencia());
      }
    }
  }

  /**
   * Cambia manualmente la vigencia fiscal y recalcula las métricas
   */
  public setVigencia(nuevaVigencia: number): void {
    this.vigencia.set(nuevaVigencia);
    this.loadDashboardData(this.currentTaxKey(), nuevaVigencia);
  }

  /**
   * Carga y orquesta los datos del Dashboard según el impuesto activo
   */
  public loadDashboardData(taxKey?: TaxModuleKey, vigencia: number = this.vigencia()): void {
    const key = taxKey || this.currentTaxKey();
    this.loading.set(true);
    this.error.set(null);

    const meta = TAX_MODULES_CONFIG[key] || TAX_MODULES_CONFIG['automotores'];

    // Si es automotores, intentamos consultar el endpoint real de KPIs
    if (key === 'automotores') {
      this.api.get<any>('/vehiculos/kpis', {}, 'AUTOMOTORES').subscribe({
        next: (res) => {
          const apiData = res?.data || {};
          this.buildDashboardForTax(meta, vigencia, apiData);
          this.loading.set(false);
        },
        error: () => {
          // Fallback controlado con datos coherentes en caso de no disponibilidad de la API
          this.buildDashboardForTax(meta, vigencia);
          this.loading.set(false);
        },
      });
    } else {
      // Para otros impuestos, generamos el dataset con métricas realistas y adaptadas
      setTimeout(() => {
        this.buildDashboardForTax(meta, vigencia);
        this.loading.set(false);
      }, 250);
    }
  }

  /**
   * Construye los KPIs, Gráficos ECharts y Actividades Recientes específicos para cada impuesto
   */
  private buildDashboardForTax(meta: TaxModuleMeta, vigencia: number, apiData: any = {}): void {
    const isVehicular = meta.key === 'automotores';
    const isRegistros = meta.key === 'registros';

    // 1. GENERACIÓN DE KPIS
    const kpis: DashboardKpi[] = [
      {
        id: 'recaudo_total',
        title: 'Recaudo Total Vigencia',
        value: isVehicular ? '14.850.420.000' : isRegistros ? '8.420.300.000' : '4.650.000.000',
        prefix: '$',
        subtext: `Meta ${vigencia}: 84.5% alcanzada`,
        trend: 'up',
        trendValue: '+12.4%',
        icon: 'fa-solid fa-hand-holding-dollar',
        colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        tooltip: 'Monto total recaudado durante el periodo fiscal activo',
      },
      {
        id: 'total_tramites',
        title: `Total ${meta.entityName}`,
        value: apiData.totalVehiculos || (isVehicular ? '128.450' : isRegistros ? '45.120' : '18.900'),
        subtext: `${isVehicular ? '92% Activos' : '88% Registrados'} en sistema`,
        trend: 'up',
        trendValue: '+4.8%',
        icon: meta.icon,
        colorClass: 'bg-blue-50 text-blue-800 border-blue-200',
        tooltip: `Censo total acumulado de ${meta.entityName.toLowerCase()}`,
      },
      {
        id: 'pendientes',
        title: 'Trámites Pendientes',
        value: apiData.totalPendientesAprobacion || (isVehicular ? '142' : isRegistros ? '58' : '23'),
        subtext: 'Requieren validación o firma',
        trend: 'down',
        trendValue: '-18.2%',
        icon: 'fa-solid fa-clock-rotate-left',
        colorClass: 'bg-amber-50 text-amber-800 border-amber-200',
        tooltip: 'Declaraciones o expedientes en espera de aprobación de un liquidador',
      },
      {
        id: 'cumplimiento',
        title: 'Extemporaneidad / Sanciones',
        value: isVehicular ? '15.934' : isRegistros ? '3.880' : '1.850',
        subtext: isVehicular ? '12.4% del total de trámites' : isRegistros ? '8.6% del total de trámites' : '15.2% del total de trámites',
        trend: 'down',
        trendValue: '-1.8%',
        icon: 'fa-solid fa-triangle-exclamation',
        colorClass: 'bg-orange-50 text-orange-700 border-orange-200',
        tooltip: 'Total de trámites presentados con cobro de sanción por extemporaneidad y su porcentaje correspondiente',
      },
    ];

    // 2. GENERACIÓN DE OPCIONES DE GRÁFICOS ECHARTS
    const charts: DashboardChartsData = {
      recaudoTrend: this.buildRecaudoTrendOption(meta, vigencia),
      distribucionCategorias: this.buildDistribucionCategoriasOption(meta),
      topMunicipios: this.buildTopMunicipiosOption(meta),
      eficienciaTramites: this.buildEficienciaOption(meta),
    };

    // 3. ACTIVIDADES RECIENTES
    const actividades: RecentActivityItem[] = this.buildActividadesRecientes(meta);

    this.kpis.set(kpis);
    this.charts.set(charts);
    this.actividadesRecientes.set(actividades);
  }

  // --------------------------------------------------------------------------
  // GENERADORES DE OPCIONES ECHARTS
  // --------------------------------------------------------------------------

  private buildRecaudoTrendOption(meta: TaxModuleMeta, vigencia: number): EChartsOption {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const recaudosBase = meta.key === 'automotores' 
      ? [1200, 1850, 2400, 3100, 2900, 2100, 1950, 2300, 2800, 3400, 3100, 3900]
      : [800, 950, 1400, 1600, 1500, 1300, 1250, 1400, 1750, 1900, 1850, 2200];
    
    const metasBase = recaudosBase.map(v => Math.round(v * 1.12));

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: '#334155',
        textStyle: { color: '#f8fafc', fontSize: 12 },
        formatter: (params: any) => {
          let html = `<div class="font-bold text-xs mb-1.5 pb-1 border-b border-slate-700">${params[0]?.axisValue} - Vigencia ${vigencia}</div>`;
          params.forEach((item: any) => {
            const colorDot = `<span style="display:inline-block;margin-right:6px;border-radius:10px;width:9px;height:9px;background-color:${item.color};"></span>`;
            html += `<div class="flex items-center justify-between gap-4 text-xs py-0.5">
              <span>${colorDot}${item.seriesName}:</span>
              <span class="font-semibold text-white">$${item.value.toLocaleString()} Millones</span>
            </div>`;
          });
          return html;
        },
      },
      legend: {
        data: ['Recaudo Real', 'Meta Presupuestal'],
        bottom: 0,
        textStyle: { color: '#64748b', fontSize: 11 },
        icon: 'roundRect',
      },
      grid: {
        left: '2%',
        right: '3%',
        top: '12%',
        bottom: '12%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: meses,
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        axisLabel: { color: '#64748b', fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        name: 'Millones (COP)',
        nameTextStyle: { color: '#94a3b8', fontSize: 10 },
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
        axisLabel: {
          color: '#64748b',
          fontSize: 11,
          formatter: (val: number) => `$${val}`,
        },
      },
      series: [
        {
          name: 'Recaudo Real',
          type: 'line',
          smooth: true,
          showSymbol: true,
          symbolSize: 6,
          itemStyle: { color: meta.primaryColor },
          lineStyle: { width: 3, color: meta.primaryColor },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: `${meta.primaryColor}33` },
                { offset: 1, color: `${meta.primaryColor}00` },
              ],
            },
          },
          data: recaudosBase,
        },
        {
          name: 'Meta Presupuestal',
          type: 'line',
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 2, type: 'dashed', color: meta.accentColor },
          itemStyle: { color: meta.accentColor },
          data: metasBase,
        },
      ],
    };
  }

  private buildDistribucionCategoriasOption(meta: TaxModuleMeta): EChartsOption {
    let dataCategories: { name: string; value: number; color?: string }[] = [];

    if (meta.key === 'automotores') {
      dataCategories = [
        { name: 'Automóviles Particulares', value: 45, color: meta.primaryColor },
        { name: 'Motocicletas > 125cc', value: 30, color: meta.accentColor },
        { name: 'Camionetas y Camperos', value: 15, color: '#3b82f6' },
        { name: 'Servicio Público', value: 7, color: '#f59e0b' },
        { name: 'Otros / Oficiales', value: 3, color: '#94a3b8' },
      ];
    } else if (meta.key === 'registros') {
      dataCategories = [
        { name: 'Compraventa de Inmuebles', value: 50, color: meta.primaryColor },
        { name: 'Hipotecas y Gravámenes', value: 25, color: meta.accentColor },
        { name: 'Constitución de Sociedades', value: 12, color: '#06b6d4' },
        { name: 'Cancelaciones y Levantamientos', value: 8, color: '#f59e0b' },
        { name: 'Otros Actos Notariales', value: 5, color: '#94a3b8' },
      ];
    } else {
      dataCategories = [
        { name: 'Declaraciones Principales', value: 60, color: meta.primaryColor },
        { name: 'Gravámenes Secundarios', value: 25, color: meta.accentColor },
        { name: 'Sanciones / Extemporaneidad', value: 10, color: '#f97316' },
        { name: 'Exenciones de Ley', value: 5, color: '#10b981' },
      ];
    }

    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        textStyle: { color: '#ffffff', fontSize: 12 },
        formatter: '{b}: <span class="font-bold">{c}%</span> ({d}%)',
      },
      legend: {
        orient: 'horizontal',
        bottom: 0,
        icon: 'circle',
        textStyle: { color: '#64748b', fontSize: 10 },
      },
      series: [
        {
          name: 'Distribución',
          type: 'pie',
          radius: ['48%', '74%'],
          center: ['50%', '42%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 6,
            borderColor: '#ffffff',
            borderWidth: 2,
          },
          label: {
            show: false,
            position: 'center',
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold',
              color: '#1e293b',
              formatter: '{b}\n{c}%',
            },
          },
          data: dataCategories.map(d => ({
            name: d.name,
            value: d.value,
            itemStyle: d.color ? { color: d.color } : undefined,
          })),
        },
      ],
    };
  }

  private buildTopMunicipiosOption(meta: TaxModuleMeta): EChartsOption {
    const municipios = ['Popayán', 'Santander de Q.', 'Puerto Tejada', 'Piendamó', 'Patía', 'Bolívar', 'Guapi'];
    const valores = [4850, 2920, 1680, 1140, 950, 720, 410];

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        textStyle: { color: '#ffffff', fontSize: 12 },
        formatter: (params: any) => {
          const item = params[0];
          return `<div class="font-bold">${item.name}</div>
                  <div class="text-xs">Trámites / Recaudo: <span class="font-semibold text-emerald-400">${item.value.toLocaleString()} unidades</span></div>`;
        },
      },
      grid: {
        left: '3%',
        right: '5%',
        top: '6%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#f1f5f9' } },
        axisLabel: { color: '#64748b', fontSize: 10 },
      },
      yAxis: {
        type: 'category',
        data: [...municipios].reverse(),
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        axisLabel: { color: '#334155', fontSize: 11, fontWeight: 'bold' },
      },
      series: [
        {
          name: 'Volumen',
          type: 'bar',
          barWidth: '55%',
          data: [...valores].reverse(),
          itemStyle: {
            borderRadius: [0, 4, 4, 0],
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                { offset: 0, color: meta.primaryColor },
                { offset: 1, color: meta.accentColor },
              ],
            },
          },
        },
      ],
    };
  }

  private buildEficienciaOption(meta: TaxModuleMeta): EChartsOption {
    const isVehicular = meta.key === 'automotores';
    const isRegistros = meta.key === 'registros';
    const val = isVehicular ? 12.4 : isRegistros ? 8.6 : 15.2;

    return {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b} : {c}%',
      },
      series: [
        {
          name: 'Extemporaneidad / Sanciones',
          type: 'gauge',
          center: ['50%', '55%'],
          radius: '85%',
          startAngle: 190,
          endAngle: -10,
          min: 0,
          max: 100,
          splitNumber: 5,
          itemStyle: {
            color: meta.accentColor,
          },
          progress: {
            show: true,
            width: 14,
            roundCap: true,
          },
          pointer: {
            show: false,
          },
          axisLine: {
            roundCap: true,
            lineStyle: {
              width: 14,
              color: [[1, '#e2e8f0']],
            },
          },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          title: {
            show: true,
            offsetCenter: [0, '25%'],
            fontSize: 12,
            color: '#64748b',
          },
          detail: {
            valueAnimation: true,
            offsetCenter: [0, '-10%'],
            fontSize: 28,
            fontWeight: 'bolder',
            formatter: '{value}%',
            color: '#0f172a',
          },
          data: [
            {
              value: val,
              name: 'Tasa de Extemporaneidad',
            },
          ],
        },
      ],
    };
  }

  private buildActividadesRecientes(meta: TaxModuleMeta): RecentActivityItem[] {
    const isVehicular = meta.key === 'automotores';

    if (isVehicular) {
      return [
        {
          id: '1',
          code: 'LQ-2026-00941',
          description: 'Liquidación Oficial Anual — Placa KJH821',
          entity: 'Mazda CX-30 Grand Touring (2023)',
          amount: 1420500,
          user: 'carlos.mendoza',
          date: 'Hoy',
          time: '10:42 AM',
          status: 'APROBADO',
        },
        {
          id: '2',
          code: 'LQ-2026-00940',
          description: 'Declaración y Pago Electrónico PSE — Placa THY312',
          entity: 'Renault Duster Zen 1.6 (2021)',
          amount: 890000,
          user: 'portal.ciudadano',
          date: 'Hoy',
          time: '10:15 AM',
          status: 'PAGADO',
        },
        {
          id: '3',
          code: 'REG-2026-00122',
          description: 'Solicitud de Exención — Entidad Pública',
          entity: 'Toyota Hilux 4x4 (2024)',
          amount: 0,
          user: 'maria.gomez',
          date: 'Hoy',
          time: '09:50 AM',
          status: 'PENDIENTE',
        },
        {
          id: '4',
          code: 'PZ-2026-00412',
          description: 'Expedición de Paz y Salvo Vehicular — Placa URE901',
          entity: 'Chevrolet Onix LTZ (2022)',
          amount: 45000,
          user: 'samuel.diaz',
          date: 'Ayer',
          time: '04:10 PM',
          status: 'LIQUIDADO',
        },
      ];
    }

    return [
      {
        id: '1',
        code: 'ACT-2026-00310',
        description: 'Escritura Pública No. 1420 — Compraventa Inmueble',
        entity: 'Notaría Primera de Popayán',
        amount: 3850000,
        user: 'laura.silva',
        date: 'Hoy',
        time: '11:05 AM',
        status: 'APROBADO',
      },
      {
        id: '2',
        code: 'ACT-2026-00309',
        description: 'Cancelación de Hipoteca Abierta',
        entity: 'Notaría Segunda Santander de Quilichao',
        amount: 450000,
        user: 'juan.perez',
        date: 'Hoy',
        time: '10:30 AM',
        status: 'PAGADO',
      },
      {
        id: '3',
        code: 'ACT-2026-00308',
        description: 'Constitución Sociedad S.A.S — Registro Mercantil',
        entity: 'Cámara de Comercio del Cauca',
        amount: 1120000,
        user: 'portal.notarial',
        date: 'Hoy',
        time: '09:12 AM',
        status: 'PENDIENTE',
      },
    ];
  }
}
