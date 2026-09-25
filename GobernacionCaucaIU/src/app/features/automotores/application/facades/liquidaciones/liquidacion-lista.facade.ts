import { Injectable, inject, signal, computed } from '@angular/core';
import { LiquidacionesApiService } from '../../../infrastructure/api/liquidaciones-api.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import {
  LiquidacionItem,
  LiquidacionKpis,
  GrupoLiquidacionEmitida
} from './liquidaciones.models';

/**
 * Sub-facade responsable de la lista principal: tabs, paginación,
 * filtros, búsqueda y KPIs del módulo de Liquidaciones.
 */
@Injectable({ providedIn: 'root' })
export class LiquidacionListaFacade {
  private api = inject(LiquidacionesApiService);

  /** Pestaña activa: 'sin-liquidar' | 'liquidadas' */
  readonly activeTab = signal<'sin-liquidar' | 'liquidadas'>('sin-liquidar');

  /** Lista reactiva de liquidaciones para la tabla */
  readonly liquidaciones = signal<LiquidacionItem[]>([]);
  readonly kpis = signal<LiquidacionKpis | null>(null);
  readonly loadingTabla = signal<boolean>(false);
  readonly page = signal<number>(1);
  readonly pageSize = signal<number>(7);
  readonly totalCount = signal<number>(0);
  readonly buscar = signal<string>('');
  readonly vigenciaFiltro = signal<number>(0);

  /** Selección múltiple de placas para liquidación masiva */
  readonly selectedPlacas = signal<string[]>([]);

  /** Agrupación de emitidas por placa para el acordeón */
  readonly placasExpandidasEmitidas = signal<string[]>([]);

  // ── Computados de paginación ──────────────────────────────────────
  readonly totalPaginas = computed(() => Math.ceil(this.totalCount() / this.pageSize()) || 1);
  readonly rangoInicio = computed(() => this.totalCount() === 0 ? 0 : (this.page() - 1) * this.pageSize() + 1);
  readonly rangoFin = computed(() => Math.min(this.page() * this.pageSize(), this.totalCount()));

  /** Agrupa las liquidaciones emitidas por placa vehicular para la vista de acordeón */
  readonly liquidacionesEmitidasAgrupadas = computed(() => {
    const items = this.liquidaciones();
    if (!items || items.length === 0) return [];
    console.log(items);

    const gruposMap = new Map<string, GrupoLiquidacionEmitida>();

    for (const item of items) {
      const key = item.placa.toUpperCase();
      if (!gruposMap.has(key)) {
        gruposMap.set(key, {
          placa: item.placa,
          marcaLinea: item.marcaLinea,
          modelo: item.modelo,
          propietario: item.propietario || [],
          totalVehiculo: 0,
          impuestoTotal: 0,
          sancionTotal: 0,
          interesesTotal: 0,
          descuentosTotal: 0,
          sistematizacionTotal: 0,
          vigencias: [],
          estadoConsolidado: 'AL DIA',
          diasMoraMaximo: 0,
          fechaLimitePago: item.fechaLimitePago,
          fechaCalculoMora: item.fechaCalculoMora || item.fechaCalculo,
          esCalculoHoy: item.esCalculoHoy ?? false,
          motivoMoraConsolidado: item.motivoMora || ''
        });
      }

      const g = gruposMap.get(key)!;
      g.vigencias.push(item);
      g.totalVehiculo       += item.totalPagar;
      g.impuestoTotal       += item.impuestoBase;
      g.sancionTotal        += item.sancionExtemporaneidad;
      g.interesesTotal      += item.interesesMora;
      g.descuentosTotal     += item.descuentos;
      g.sistematizacionTotal += (item.sistematizacionEstampillas || 0);

      if ((item.diasMora || 0) > g.diasMoraMaximo) {
        g.diasMoraMaximo = item.diasMora || 0;
      }
      if (item.estado?.includes('MORA') || item.estado?.includes('PRESCRITA') || (item.diasMora && item.diasMora > 0)) {
        g.estadoConsolidado = 'EN MORA';
      }
      if (item.esCalculoHoy) {
        g.esCalculoHoy = true;
      }
      if (item.fechaCalculoMora) {
        g.fechaCalculoMora = item.fechaCalculoMora;
      }
      if (item.fechaLimitePago) {
        g.fechaLimitePago = item.fechaLimitePago;
      }
    }

    // Ajustar motivo consolidado
    for (const g of gruposMap.values()) {
      if (g.diasMoraMaximo > 0 || g.estadoConsolidado === 'EN MORA') {
        const fechaLimiteTxt = g.fechaLimitePago ? new Date(g.fechaLimitePago).toLocaleDateString('es-CO') : '31/07';
        g.motivoMoraConsolidado = `Vencida ${fechaLimiteTxt} (${g.diasMoraMaximo} días mora)`;
      } else {
        const fechaLimiteTxt = g.fechaLimitePago ? new Date(g.fechaLimitePago).toLocaleDateString('es-CO') : '31/07';
        g.motivoMoraConsolidado = `En plazo ordinario (Vence ${fechaLimiteTxt})`;
      }
    }

    return Array.from(gruposMap.values());
  });


  cargarLiquidaciones(): void {
    this.loadingTabla.set(true);
    const params = {
      page: this.page(),
      pageSize: this.pageSize(),
      buscar: this.buscar(),
      vigencia: this.vigenciaFiltro() > 0 ? this.vigenciaFiltro() : undefined,
      tab: this.activeTab() === 'sin-liquidar' ? 'pendientes' : 'emitidas'
    };

    const call$ = this.api.getLiquidaciones(params);

    call$.pipe(
      catchError(err => {
        console.warn('Error al consultar liquidaciones:', err);
        this.loadingTabla.set(false);
        return of(null);
      })
    ).subscribe(res => {
      this.loadingTabla.set(false);
      if (res && res.data) {
        this.liquidaciones.set(res.data.items || []);
        this.totalCount.set(res.data.totalCount || 0);
      }
    });
  }

  /** Consulta los indicadores KPI del módulo */
  cargarKpis(): void {
    this.api.getKpis().pipe(
      catchError(err => {
        console.warn('Error al cargar KPIs de liquidaciones:', err);
        return of(null);
      })
    ).subscribe(res => {
      if (res && res.data) {
        this.kpis.set(res.data);
      }
    });
  }

  setTab(tab: 'sin-liquidar' | 'liquidadas'): void {
    this.activeTab.set(tab);
    this.page.set(1);
    this.cargarLiquidaciones();
  }

  setBuscar(query: string): void {
    this.buscar.set(query);
    this.page.set(1);
    this.cargarLiquidaciones();
  }

  /** Actualiza el filtro por vigencia fiscal y recarga */
  setVigenciaFiltro(vigencia: number): void {
    this.vigenciaFiltro.set(vigencia);
    this.page.set(1);
    this.cargarLiquidaciones();
  }

  /** Cambia la página actual */
  setPage(nuevaPagina: number): void {
    if (nuevaPagina < 1 || nuevaPagina > this.totalPaginas()) return;
    this.page.set(nuevaPagina);
    this.cargarLiquidaciones();
  }

  /** Cambia el tamaño de página y recarga */
  setPageSize(nuevoTamano: number): void {
    this.pageSize.set(nuevoTamano);
    this.page.set(1);
    this.cargarLiquidaciones();
  }


  /** Selecciona o deselecciona una placa en la tabla */
  toggleSelectPlaca(placa: string): void {
    let curr = [...this.selectedPlacas()];
    if (curr.includes(placa)) {
      curr = curr.filter(p => p !== placa);
    } else {
      curr.push(placa);
    }
    this.selectedPlacas.set(curr);
  }

  /** Selecciona o deselecciona todas las placas de la tabla actual */
  toggleSelectAllPlacas(): void {
    const todasPlacas = this.liquidaciones().map(i => i.placa);
    if (this.selectedPlacas().length === todasPlacas.length) {
      this.selectedPlacas.set([]);
    } else {
      this.selectedPlacas.set(todasPlacas);
    }
  }

  /** Expande o colapsa el acordeón de un vehículo en la pestaña de emitidas */
  toggleExpandirPlacaEmitida(placa: string): void {
    let curr = [...this.placasExpandidasEmitidas()];
    if (curr.includes(placa)) {
      curr = curr.filter(p => p !== placa);
    } else {
      curr.push(placa);
    }
    this.placasExpandidasEmitidas.set(curr);
  }
}
