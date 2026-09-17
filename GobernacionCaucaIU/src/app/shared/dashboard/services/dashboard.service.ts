import { Injectable, inject, signal, computed } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { BaseApiService } from '../../../core/services/base-api.service';
import { TAX_MODULES_CONFIG } from '../constants/tax-config.constant';
import {
  TaxModuleKey,
  TaxModuleMeta,
  DashboardKpi,
  DashboardChartsData,
  RecentActivityItem,
  EChartsOption,
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
   * Carga y orquesta los datos del Dashboard según el impuesto activo desde la API
   */
  public loadDashboardData(taxKey?: TaxModuleKey, vigencia: number = this.vigencia()): void {
    const key = taxKey || this.currentTaxKey();
    this.loading.set(true);
    this.error.set(null);

    const meta = TAX_MODULES_CONFIG[key] || TAX_MODULES_CONFIG['automotores'];

    if (key === 'registros') {
      this.api.get<any>('Dashboard', { params: { vigencia } }, 'REGISTROS').subscribe({
        next: (res) => {
          const apiData = res?.data || {};
          this.buildDashboardForTax(meta, vigencia, apiData);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error al obtener datos del dashboard de registros:', err);
          this.error.set('No fue posible cargar los datos del dashboard de Registros.');
          this.buildDashboardForTax(meta, vigencia, {});
          this.loading.set(false);
        },
      });
    } else if (key === 'automotores') {
      this.api.get<any>('Dashboard', { params: { vigencia } }, 'AUTOMOTORES').subscribe({
        next: (res) => {
          const apiData = res?.data || {};
          this.buildDashboardForTax(meta, vigencia, apiData);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error al obtener datos del dashboard de automotores:', err);
          this.error.set('No fue posible cargar los datos del dashboard de Automotores.');
          this.buildDashboardForTax(meta, vigencia, {});
          this.loading.set(false);
        },
      });
    } else if (key === 'licores') {
      const licoresData = this.buildLicoresDashboardData(vigencia);
      this.buildDashboardForTax(meta, vigencia, licoresData);
      this.loading.set(false);
    } else if (key === 'sobretasa') {
      const sobretasaData = this.buildSobretasaDashboardData(vigencia);
      this.buildDashboardForTax(meta, vigencia, sobretasaData);
      this.loading.set(false);
    } else if (key === 'deguello') {
      const mockDeguello = this.getMockDeguelloDashboard(vigencia);
      this.buildDashboardForTax(meta, vigencia, mockDeguello);
      this.loading.set(false);
    } else {
      this.buildDashboardForTax(meta, vigencia, {});
      this.loading.set(false);
    }
  }

  private buildLicoresDashboardData(vigencia: number): any {
    let rawLiqs: any[] = [];
    try {
      const raw = localStorage.getItem('GOV_CAUCA_ICL_LIQUIDACIONES_V1');
      if (raw) rawLiqs = JSON.parse(raw);
    } catch {}

    const totalRecaudo = rawLiqs.reduce((acc, curr) => {
      const monto = Number(curr.liquidacion?.totalImpuesto ?? curr.totalPagar ?? curr.totalImpuesto ?? 0);
      return acc + (curr.estado === 'APROBADA' || curr.estado === 'PAGADA' || curr.estado === 'LEGALIZADA' || !curr.estado ? monto : 0);
    }, 0) || 842500000;

    const totalLotes = rawLiqs.length || 16;
    const pendientes = rawLiqs.filter((l) => ['EN_RADICACION', 'EN_REVISION', 'REQUERIDA', 'RADICADA'].includes(l.estado)).length || 4;
    const extemporaneas = rawLiqs.filter((l) => l.estado === 'ANULADA' || l.sancionExtemporaneidad > 0).length || 2;
    const tasaExtemp = totalLotes > 0 ? Math.round((extemporaneas / totalLotes) * 100) : 5;

    return {
      kpi: {
        recaudoTotalVigencia: totalRecaudo,
        variacionRecaudoInteranual: 14.8,
        totalVehiculos: totalLotes,
        porcentajeVehiculosLiquidados: 88,
        variacionVehiculos: 12.3,
        tramitesPendientes: pendientes,
        variacionTramitesPendientes: -5.2,
        totalExtemporaneas: extemporaneas,
        porcentajeExtemporaneidad: tasaExtemp,
        variacionExtemporaneidad: -2.1,
      },
      recaudoMensual: [
        { nombreMes: 'Ene', recaudoReal: 68500000 },
        { nombreMes: 'Feb', recaudoReal: 74200000 },
        { nombreMes: 'Mar', recaudoReal: 82000000 },
        { nombreMes: 'Abr', recaudoReal: 69800000 },
        { nombreMes: 'May', recaudoReal: 91400000 },
        { nombreMes: 'Jun', recaudoReal: 104500000 },
        { nombreMes: 'Jul', recaudoReal: 87300000 },
        { nombreMes: 'Ago', recaudoReal: 96000000 },
        { nombreMes: 'Sep', recaudoReal: 89400000 },
        { nombreMes: 'Oct', recaudoReal: 112000000 },
        { nombreMes: 'Nov', recaudoReal: 128500000 },
        { nombreMes: 'Dic', recaudoReal: 198000000 },
      ],
      distribucionTipologia: [
        { tipologia: 'Aguardiente / Anisados', porcentaje: 44 },
        { tipologia: 'Rones Nacionales e Imp.', porcentaje: 26 },
        { tipologia: 'Whiskies y Destilados', porcentaje: 18 },
        { tipologia: 'Vinos y Aperitivos', porcentaje: 12 },
      ],
      topMunicipios: [
        { municipio: 'Popayán', totalVehiculos: 85 },
        { municipio: 'Santander de Quilichao', totalVehiculos: 34 },
        { municipio: 'Puerto Tejada', totalVehiculos: 22 },
        { municipio: 'El Bordo - Patía', totalVehiculos: 16 },
        { municipio: 'Piendamó', totalVehiculos: 12 },
      ],
      extemporaneidad: {
        tasaExtemporaneidad: tasaExtemp,
      },
      ultimasOperaciones: rawLiqs.slice(0, 5).map((l: any, idx: number) => ({
        id: l.id || `LIC-${idx + 1}`,
        numeroLiquidacion: l.radicado || l.numeroLiquidacion || `RAD-2026-000${idx + 1}`,
        propietario: l.contribuyente?.razonSocial || l.entidadProductora?.razonSocial || 'Distribuidora del Cauca SAS',
        monto: Number(l.liquidacion?.totalImpuesto ?? l.totalImpuesto ?? 34500000),
        estadoCodigo: l.estado || 'APROBADA',
        estadoBadgeClase: l.estado === 'APROBADA' || l.estado === 'PAGADA' ? 'success' : l.estado === 'EN_REVISION' ? 'warning' : 'info',
        fechaHora: l.fechaRadicacion || l.fecha || new Date().toISOString(),
        descripcion: l.producto?.nombre || l.lote?.descripcion || 'Lote de Licores Gravados Ley 1816',
      })),
    };
  }

  private buildSobretasaDashboardData(vigencia: number): any {
    let rawDecs: any[] = [];
    try {
      const raw = localStorage.getItem('cauca_sobretasa_declaraciones_v1');
      if (raw) rawDecs = JSON.parse(raw);
    } catch {}

    const totalRecaudo = rawDecs.reduce((acc, curr) => {
      const monto = Number(curr.liquidacion?.totalPagar ?? curr.totalPagar ?? curr.totalSobretasa ?? 0);
      return acc + (curr.estado === 'PAGADA' || curr.estado === 'PRESENTADA' || curr.estado === 'APROBADA' || !curr.estado ? monto : 0);
    }, 0) || 1285000000;

    const totalDeclaraciones = rawDecs.length || 12;
    const pendientes = rawDecs.filter((d) => ['BORRADOR', 'PRESENTADA', 'EN_REVISION'].includes(d.estado)).length || 3;
    const conSancion = rawDecs.filter((d) => Number(d.liquidacion?.sancionesExtemporaneidad ?? d.sancion ?? 0) > 0).length || 1;
    const tasaSancion = totalDeclaraciones > 0 ? Math.round((conSancion / totalDeclaraciones) * 100) : 8;

    return {
      kpi: {
        recaudoTotalVigencia: totalRecaudo,
        variacionRecaudoInteranual: 9.4,
        totalVehiculos: totalDeclaraciones,
        porcentajeVehiculosLiquidados: 92,
        variacionVehiculos: 6.1,
        tramitesPendientes: pendientes,
        variacionTramitesPendientes: -10.0,
        totalExtemporaneas: conSancion,
        porcentajeExtemporaneidad: tasaSancion,
        variacionExtemporaneidad: -1.5,
      },
      recaudoMensual: [
        { nombreMes: 'Ene', recaudoReal: 98000000 },
        { nombreMes: 'Feb', recaudoReal: 102500000 },
        { nombreMes: 'Mar', recaudoReal: 110000000 },
        { nombreMes: 'Abr', recaudoReal: 105400000 },
        { nombreMes: 'May', recaudoReal: 115200000 },
        { nombreMes: 'Jun', recaudoReal: 122000000 },
        { nombreMes: 'Jul', recaudoReal: 118000000 },
        { nombreMes: 'Ago', recaudoReal: 124500000 },
        { nombreMes: 'Sep', recaudoReal: 121000000 },
        { nombreMes: 'Oct', recaudoReal: 130000000 },
        { nombreMes: 'Nov', recaudoReal: 135000000 },
        { nombreMes: 'Dic', recaudoReal: 148000000 },
      ],
      distribucionTipologia: [
        { tipologia: 'Gasolina Motor Corriente', porcentaje: 66 },
        { tipologia: 'ACPM / Diésel', porcentaje: 26 },
        { tipologia: 'Gasolina Extra', porcentaje: 8 },
      ],
      topMunicipios: [
        { municipio: 'Popayán', totalVehiculos: 140 },
        { municipio: 'Santander de Quilichao', totalVehiculos: 62 },
        { municipio: 'Puerto Tejada', totalVehiculos: 38 },
        { municipio: 'El Bordo - Patía', totalVehiculos: 25 },
        { municipio: 'Guachené', totalVehiculos: 19 },
      ],
      extemporaneidad: {
        tasaExtemporaneidad: tasaSancion,
      },
      ultimasOperaciones: rawDecs.slice(0, 5).map((d: any, idx: number) => ({
        id: d.id || `SOB-${idx + 1}`,
        numeroLiquidacion: d.radicado || d.numeroDeclaracion || `SOB-2026-0${800 + idx}`,
        propietario: d.mayoristaNombre || d.mayorista?.razonSocial || 'Distribuidor Mayorista de Combustibles',
        monto: Number(d.liquidacion?.totalPagar ?? d.totalPagar ?? 145000000),
        estadoCodigo: d.estado || 'PRESENTADA',
        estadoBadgeClase: d.estado === 'PAGADA' || d.estado === 'PRESENTADA' ? 'success' : 'warning',
        fechaHora: d.fechaPresentacion || d.fecha || new Date().toISOString(),
        descripcion: `Sobretasa Combustibles - Periodo ${d.periodoMes || '02'}/${d.periodoAnio || 2026}`,
      })),
    };
  }

  private getMockDeguelloDashboard(vigencia: number): any {
    return {
      kpi: {
        recaudoTotalVigencia: 423300000,
        variacionRecaudoInteranual: 8.4,
        totalVehiculos: 8500,
        porcentajeRegistradosEnSistema: 96,
        variacionVehiculos: 5.2,
        tramitesPendientes: 4,
        variacionTramitesPendientes: -12,
        totalExtemporaneas: 14,
        porcentajeExtemporaneidad: 2.1,
        variacionExtemporaneidad: -0.5,
      },
      recaudoMensual: [
        { nombreMes: 'Ene', recaudoReal: 38200000 },
        { nombreMes: 'Feb', recaudoReal: 41500000 },
        { nombreMes: 'Mar', recaudoReal: 46800000 },
        { nombreMes: 'Abr', recaudoReal: 44200000 },
        { nombreMes: 'May', recaudoReal: 49100000 },
        { nombreMes: 'Jun', recaudoReal: 52400000 },
        { nombreMes: 'Jul', recaudoReal: 48900000 },
        { nombreMes: 'Ago', recaudoReal: 53200000 },
        { nombreMes: 'Sep', recaudoReal: 49000000 },
        { nombreMes: 'Oct', recaudoReal: 0 },
        { nombreMes: 'Nov', recaudoReal: 0 },
        { nombreMes: 'Dic', recaudoReal: 0 },
      ],
      distribucionTipologia: [
        { nombre: 'Bovino Macho Ceba', cantidad: 5270 },
        { nombre: 'Bovino Hembra Descarte', cantidad: 2040 },
        { nombre: 'Bufalino Mayor', cantidad: 765 },
        { nombre: 'Terneros Especiales', cantidad: 425 },
      ],
      topMunicipios: [
        { municipio: 'POPAYÁN', totalTramites: 4330, recaudo: 215800000 },
        { municipio: 'PATÍA - EL BORDO', totalTramites: 1780, recaudo: 88600000 },
        { municipio: 'SANTANDER DE QUILICHAO', totalTramites: 1300, recaudo: 64700000 },
        { municipio: 'BOLÍVAR', totalTramites: 625, recaudo: 31200000 },
        { municipio: 'EL TAMBO', totalTramites: 465, recaudo: 23000000 },
      ],
      extemporaneidad: {
        tasaExtemporaneidad: 2.1,
        totalFueraDePlazo: 14,
      },
      ultimasOperaciones: [
        {
          id: '2026-004521',
          codigoTramite: 'FORM-2026-004521',
          descripcion: 'Frigorífico Regional de Popayán — 24 Bovinos',
          propietario: 'FRIGORÍFICO REGIONAL DE POPAYÁN S.A.S.',
          monto: 1075680,
          usuario: 'Ventanilla Rentas',
          fechaHora: '2026-09-16T14:20:00',
          estadoCodigo: 'PAGADO',
          estado: 'Pagado',
        },
        {
          id: '2026-008912',
          codigoTramite: 'FORM-2026-008912',
          descripcion: 'Planta Regional Patía — 12 Bovinos',
          propietario: 'DISTRIBUIDORA DE CARNES EL BORDO LTDA',
          monto: 537840,
          usuario: 'Inspección Sanitaria',
          fechaHora: '2026-09-16T11:05:00',
          estadoCodigo: 'PENDIENTE',
          estado: 'Pendiente',
        },
        {
          id: '2026-007740',
          codigoTramite: 'FORM-2026-007740',
          descripcion: 'Frigorífico Santander Quilichao — 40 Bovinos',
          propietario: 'CARNES DEL NORTE DEL CAUCA S.A.S.',
          monto: 1792800,
          usuario: 'Ventanilla Rentas',
          fechaHora: '2026-09-15T16:45:00',
          estadoCodigo: 'PAGADO',
          estado: 'Pagado',
        },
        {
          id: '2026-003319',
          codigoTramite: 'FORM-2026-003319',
          descripcion: 'Matadero Municipal Bolívar — 8 Bovinos',
          propietario: 'GANADERÍA Y COMERCIALIZADORA DEL MACIZO',
          monto: 358560,
          usuario: 'Ventanilla Rentas',
          fechaHora: '2026-09-14T09:15:00',
          estadoCodigo: 'VENCIDO',
          estado: 'Vencido',
        },
      ],
    };
  }

  /**
   * Construye los KPIs, Gráficos ECharts y Actividades Recientes basándose exclusivamente en los datos de la API
   */
  private buildDashboardForTax(meta: TaxModuleMeta, vigencia: number, apiData: any = {}): void {
    const kpiData = apiData?.kpi || {};

    const recaudoTotal = Number(kpiData.recaudoTotalVigencia ?? apiData.recaudoTotal ?? 0);
    const varInteranual = Number(kpiData.variacionRecaudoInteranual ?? kpiData.variacionInteranual ?? 0);
    const recaudoTrend: 'up' | 'down' | 'neutral' = varInteranual >= 0 ? 'up' : 'down';
    const recaudoTrendVal = `${varInteranual >= 0 ? '+' : ''}${varInteranual}%`;

    const totalTramites = Number(
      kpiData.totalVehiculos ??
      kpiData.totalActosRegistrales ??
      apiData.totalVehiculos ??
      apiData.totalTramites ??
      0
    );
    const porcRegistrados = Number(
      kpiData.porcentajeVehiculosLiquidados ??
      kpiData.porcentajeRegistradosEnSistema ??
      apiData.porcentajeActivos ??
      0
    );
    const varActos = Number(kpiData.variacionVehiculos ?? kpiData.variacionActos ?? 0);
    const totalTramitesTrend: 'up' | 'down' | 'neutral' = varActos >= 0 ? 'up' : 'down';
    const totalTramitesTrendVal = `${varActos >= 0 ? '+' : ''}${varActos}%`;

    const pendientes = Number(
      kpiData.tramitesPendientes ??
      apiData.totalPendientesAprobacion ??
      apiData.tramitesPendientes ??
      0
    );
    const varPendientes = Number(kpiData.variacionTramitesPendientes ?? 0);
    const pendientesTrend: 'up' | 'down' | 'neutral' = varPendientes <= 0 ? 'down' : 'up';
    const pendientesTrendVal = `${varPendientes >= 0 ? '+' : ''}${varPendientes}%`;

    const totalExtemp = Number(
      kpiData.totalExtemporaneas ??
      kpiData.totalExtemporaneidad ??
      apiData?.extemporaneidad?.totalFueraDePlazo ??
      apiData.procesosConSanciones ??
      0
    );
    const porcExtemp = Number(
      kpiData.porcentajeExtemporaneidad ??
      apiData?.extemporaneidad?.tasaExtemporaneidad ??
      apiData.tasaExtemporaneidad ??
      0
    );
    const varExtemp = Number(kpiData.variacionExtemporaneidad ?? 0);
    const extempTrend: 'up' | 'down' | 'neutral' = varExtemp <= 0 ? 'down' : 'up';
    const extempTrendVal = `${varExtemp >= 0 ? '+' : ''}${varExtemp}%`;

    const kpis: DashboardKpi[] = [
      {
        id: 'recaudo_total',
        title: 'Recaudo Total Vigencia',
        value: recaudoTotal.toLocaleString('es-CO'),
        prefix: '$',
        subtext: `Periodo fiscal ${vigencia}`,
        trend: recaudoTrend,
        trendValue: recaudoTrendVal,
        icon: 'fa-solid fa-hand-holding-dollar',
        colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        tooltip: 'Monto total recaudado durante el periodo fiscal activo',
      },
      {
        id: 'total_tramites',
        title: `Total ${meta.entityName}`,
        value: totalTramites.toLocaleString('es-CO'),
        subtext: meta.key === 'automotores'
          ? `${porcRegistrados}% Con Liquidación Oficial`
          : `${porcRegistrados}% Registrados en sistema`,
        trend: totalTramitesTrend,
        trendValue: totalTramitesTrendVal,
        icon: meta.icon,
        colorClass: 'bg-blue-50 text-blue-800 border-blue-200',
        tooltip: `Censo total acumulado de ${meta.entityName.toLowerCase()}`,
      },
      {
        id: 'pendientes',
        title: 'Trámites Pendientes',
        value: pendientes.toLocaleString('es-CO'),
        subtext: 'Requieren validación o firma',
        trend: pendientesTrend,
        trendValue: pendientesTrendVal,
        icon: 'fa-solid fa-clock-rotate-left',
        colorClass: 'bg-amber-50 text-amber-800 border-amber-200',
        tooltip: 'Declaraciones o expedientes en espera de aprobación de un liquidador',
      },
      {
        id: 'cumplimiento',
        title: 'Extemporaneidad / Sanciones',
        value: totalExtemp.toLocaleString('es-CO'),
        subtext: `${porcExtemp}% del total de trámites`,
        trend: extempTrend,
        trendValue: extempTrendVal,
        icon: 'fa-solid fa-triangle-exclamation',
        colorClass: 'bg-orange-50 text-orange-700 border-orange-200',
        tooltip: 'Total de trámites presentados con cobro de sanción por extemporaneidad y su porcentaje correspondiente',
      },
    ];

    const charts: DashboardChartsData = {
      recaudoTrend: this.buildRecaudoTrendOption(meta, vigencia, apiData),
      distribucionCategorias: this.buildDistribucionCategoriasOption(meta, apiData),
      topMunicipios: this.buildTopMunicipiosOption(meta, apiData),
      eficienciaTramites: this.buildEficienciaOption(meta, apiData),
    };

    const actividades: RecentActivityItem[] = this.buildActividadesRecientes(meta, apiData);

    this.kpis.set(kpis);
    this.charts.set(charts);
    this.actividadesRecientes.set(actividades);
  }

  // --------------------------------------------------------------------------
  // GENERADORES DE OPCIONES ECHARTS
  // --------------------------------------------------------------------------

  private buildRecaudoTrendOption(meta: TaxModuleMeta, vigencia: number, apiData: any = {}): EChartsOption {
    const rawMeses = apiData?.recaudoMensual || apiData?.historicoMensual || [];
    let meses: string[] = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    let recaudosBase: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    if (Array.isArray(rawMeses) && rawMeses.length > 0) {
      meses = rawMeses.map((m: any) => m.nombreMes || (typeof m.mes === 'string' ? m.mes : `Mes ${m.mes}`));
      recaudosBase = rawMeses.map((m: any) => Number(m.recaudoReal ?? 0));
    }

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: '#334155',
        textStyle: { color: '#f8fafc', fontSize: 12 },
        formatter: (params: any) => {
          const item = Array.isArray(params) ? params[0] : params;
          return `<div class="font-bold text-xs mb-1.5 pb-1 border-b border-slate-700">${item?.axisValue} - Vigencia ${vigencia}</div>
                  <div class="flex items-center justify-between gap-4 text-xs py-0.5">
                    <span class="text-slate-300">Recaudo Real:</span>
                    <span class="font-semibold text-white">$${Number(item?.value ?? 0).toLocaleString('es-CO')}</span>
                  </div>`;
        },
      },
      grid: {
        left: '2%',
        right: '3%',
        top: '12%',
        bottom: '10%',
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
        name: 'Recaudo (COP)',
        nameTextStyle: { color: '#94a3b8', fontSize: 10 },
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
        axisLabel: {
          color: '#64748b',
          fontSize: 11,
          formatter: (val: number) => `$${val.toLocaleString('es-CO')}`,
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
      ],
    };
  }

  private buildDistribucionCategoriasOption(meta: TaxModuleMeta, apiData: any = {}): EChartsOption {
    const rawCategories = apiData?.distribucionTipologia || apiData?.distribucionCategorias || [];
    let dataCategories: { name: string; value: number; color?: string }[] = [];

    if (Array.isArray(rawCategories) && rawCategories.length > 0) {
      const palette = [meta.primaryColor, meta.accentColor, '#3b82f6', '#f59e0b', '#06b6d4', '#94a3b8', '#8b5cf6', '#ec4899'];
      dataCategories = rawCategories.map((item: any, idx: number) => ({
        name: item.tipologia || item.categoriaNombre || item.nombre || 'Otros',
        value: Number(item.porcentaje ?? item.cantidad ?? 0),
        color: palette[idx % palette.length],
      }));
    } else {
      dataCategories = [
        { name: 'Sin datos registrados', value: 0, color: '#cbd5e1' },
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
          data: dataCategories.map((d) => ({
            name: d.name,
            value: d.value,
            itemStyle: d.color ? { color: d.color } : undefined,
          })),
        },
      ],
    };
  }

  private buildTopMunicipiosOption(meta: TaxModuleMeta, apiData: any = {}): EChartsOption {
    const rawMunicipios = apiData?.topMunicipios || [];
    let municipios: string[] = [];
    let valores: number[] = [];

    if (Array.isArray(rawMunicipios) && rawMunicipios.length > 0) {
      municipios = rawMunicipios.map((m: any) => m.municipio || m.municipioNombre || 'Municipio');
      valores = rawMunicipios.map((m: any) =>
        Number(m.totalVehiculos ?? m.totalTramites ?? m.cantidadTramites ?? m.recaudo ?? 0)
      );
    } else {
      municipios = ['Sin registros'];
      valores = [0];
    }

    const unit = meta.key === 'automotores' ? 'vehículos' : 'trámites';

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        textStyle: { color: '#ffffff', fontSize: 12 },
        formatter: (params: any) => {
          const item = params[0];
          return `<div class="font-bold">${item.name}</div>
                  <div class="text-xs">Total: <span class="font-semibold text-emerald-400">${Number(item.value).toLocaleString('es-CO')} ${unit}</span></div>`;
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

  private buildEficienciaOption(meta: TaxModuleMeta, apiData: any = {}): EChartsOption {
    const val = Number(
      apiData?.extemporaneidad?.tasaExtemporaneidad ??
      apiData?.kpi?.porcentajeExtemporaneidad ??
      apiData?.tasaExtemporaneidad ??
      0
    );

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

  private buildActividadesRecientes(meta: TaxModuleMeta, apiData: any = {}): RecentActivityItem[] {
    const rawOps = apiData?.ultimasOperaciones || apiData?.actividadesRecientes || [];

    if (Array.isArray(rawOps) && rawOps.length > 0) {
      return rawOps.map((op: any, idx: number) => {
        let fecha = 'Hoy';
        let hora = '';
        const fechaRaw = op.fechaHora || op.fecha;
        if (fechaRaw) {
          try {
            const d = new Date(fechaRaw);
            if (!isNaN(d.getTime())) {
              const now = new Date();
              const isToday = d.toDateString() === now.toDateString();
              fecha = isToday ? 'Hoy' : d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
              hora = d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true });
            }
          } catch {
            fecha = 'Hoy';
          }
        }

        const codigo = op.numeroLiquidacion || op.codigoTramite || op.id || `OP-${idx + 1}`;
        const propietario = op.propietario || op.entidadSujeto || op.entidad || (op.placa ? `Placa: ${op.placa}` : 'N/A');
        const estadoCod = op.estadoCodigo || op.estado || 'BORRADOR';
        const estadoLbl = op.estado || op.estadoCodigo || 'Borrador';

        return {
          id: op.id || codigo,
          code: codigo,
          description: op.descripcion || (op.placa ? `Impuesto Vehicular ${op.placa}` : 'Operación registrada'),
          entity: propietario,
          amount: Number(op.monto ?? 0),
          user: op.placa ? `Placa: ${op.placa}` : (op.operador || op.usuario || 'Sistema'),
          date: fecha,
          time: hora,
          status: estadoCod.toUpperCase(),
          statusLabel: estadoLbl,
          badgeClass: op.estadoBadgeClase || 'primary',
          placa: op.placa || undefined,
        };
      });
    }

    return [];
  }
}

