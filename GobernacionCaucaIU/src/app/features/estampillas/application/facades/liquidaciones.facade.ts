import { Injectable, inject, signal, computed } from '@angular/core';
import { EstampillasStorageService } from '../../infrastructure/storage/storage.service';
import { ToastService } from '../../../../core/services/toast.service';
import {
  LiquidacionEstampilla,
  EstadoLiquidacion,
  LiquidacionResumenKpis,
  PagoEstampilla
} from '../../domain/models/estampillas.models';

@Injectable({
  providedIn: 'root'
})
export class LiquidacionesFacade {
  private storage = inject(EstampillasStorageService);
  private toast = inject(ToastService);

  readonly loading = signal<boolean>(false);
  readonly filtroTexto = signal<string>('');
  readonly filtroEstado = signal<string>('TODOS');
  readonly filtroVigencia = signal<number>(0);
  readonly filtroMunicipio = signal<string>('TODOS');
  readonly filtroFechaDesde = signal<string>('');
  readonly filtroFechaHasta = signal<string>('');

  readonly paginaActual = signal<number>(1);
  readonly elementosPorPagina = signal<number>(8);

  readonly liquidaciones = computed(() => {
    this.storage.dataVersion();
    const items = this.storage.getLiquidaciones();
    const texto = this.filtroTexto().toLowerCase().trim();
    const est = this.filtroEstado();
    const vig = this.filtroVigencia();
    const mun = this.filtroMunicipio();
    const desde = this.filtroFechaDesde();
    const hasta = this.filtroFechaHasta();

    return items.filter(l => {
      const matchTexto = !texto ||
        l.numeroLiquidacion.toLowerCase().includes(texto) ||
        l.contribuyenteNombre.toLowerCase().includes(texto) ||
        l.contribuyenteDocumento.includes(texto) ||
        l.numeroContrato.toLowerCase().includes(texto) ||
        (l.objetoContrato && l.objetoContrato.toLowerCase().includes(texto));

      const matchEst = est === 'TODOS' || l.estado === est;
      const matchVig = vig === 0 || l.vigencia === vig;
      const matchMun = mun === 'TODOS' || (l.contribuyenteMunicipio && l.contribuyenteMunicipio.toLowerCase() === mun.toLowerCase()) || (l.municipioEjecucion && l.municipioEjecucion.toLowerCase() === mun.toLowerCase());

      let matchFecha = true;
      if (desde && l.fechaGeneracion < desde) matchFecha = false;
      if (hasta && l.fechaGeneracion > hasta) matchFecha = false;

      return matchTexto && matchEst && matchVig && matchMun && matchFecha;
    });
  });

  readonly totalElementos = computed(() => this.liquidaciones().length);
  readonly totalPaginas = computed(() => Math.max(1, Math.ceil(this.totalElementos() / this.elementosPorPagina())));

  readonly liquidacionesPaginadas = computed(() => {
    const page = this.paginaActual();
    const size = this.elementosPorPagina();
    const start = (page - 1) * size;
    return this.liquidaciones().slice(start, start + size);
  });

  readonly kpis = computed<LiquidacionResumenKpis>(() => {
    this.storage.dataVersion();
    const allLiqs = this.storage.getLiquidaciones();
    const allPagos = this.storage.getPagos();
    const allContribuyentes = this.storage.getContribuyentes();
    const allContratos = this.storage.getContratos();

    const noAnuladas = allLiqs.filter(l => l.estado !== 'ANULADA');
    const totalLiquidadoMes = noAnuladas.reduce((sum, l) => sum + l.totalPagar, 0);
    const totalRecaudoRealizado = allPagos.reduce((sum, p) => sum + p.valorPagado, 0);
    const totalPendientePago = Math.max(0, totalLiquidadoMes - totalRecaudoRealizado);

    const totalLiquidacionesGeneradas = allLiqs.length;
    const totalLiquidacionesPagadas = allLiqs.filter(l => l.estado === 'PAGADA').length;
    const totalLiquidacionesAnuladas = allLiqs.filter(l => l.estado === 'ANULADA').length;
    const totalLiquidacionesVencidas = allLiqs.filter(l => l.estado === 'VENCIDA').length;

    const eficacia = totalLiquidadoMes > 0 
      ? Math.min(100, Math.round((totalRecaudoRealizado / totalLiquidadoMes) * 100))
      : 0;

    return {
      totalLiquidadoMes,
      totalRecaudoRealizado,
      totalPendientePago,
      totalContribuyentes: allContribuyentes.length,
      totalContratos: allContratos.length,
      totalLiquidacionesGeneradas,
      totalLiquidacionesPagadas,
      totalLiquidacionesAnuladas,
      totalLiquidacionesVencidas,
      porcentajeEficaciaRecaudo: eficacia
    };
  });

  setFiltroTexto(query: string): void {
    this.filtroTexto.set(query);
    this.paginaActual.set(1);
  }

  setFiltroEstado(estado: string): void {
    this.filtroEstado.set(estado);
    this.paginaActual.set(1);
  }

  setFiltroVigencia(vigencia: number): void {
    this.filtroVigencia.set(vigencia);
    this.paginaActual.set(1);
  }

  setFiltroMunicipio(municipio: string): void {
    this.filtroMunicipio.set(municipio);
    this.paginaActual.set(1);
  }

  setFiltroFechas(desde: string, hasta: string): void {
    this.filtroFechaDesde.set(desde);
    this.filtroFechaHasta.set(hasta);
    this.paginaActual.set(1);
  }

  setPagina(page: number): void {
    if (page >= 1 && page <= this.totalPaginas()) {
      this.paginaActual.set(page);
    }
  }

  limpiarFiltros(): void {
    this.filtroTexto.set('');
    this.filtroEstado.set('TODOS');
    this.filtroVigencia.set(0);
    this.filtroMunicipio.set('TODOS');
    this.filtroFechaDesde.set('');
    this.filtroFechaHasta.set('');
    this.paginaActual.set(1);
  }

  obtenerPorId(id: string): LiquidacionEstampilla | undefined {
    return this.storage.getLiquidacionById(id);
  }

  obtenerPagosDeLiquidacion(liquidacionId: string): PagoEstampilla[] {
    return this.storage.getPagos().filter(p => p.liquidacionId === liquidacionId || p.numeroLiquidacion === liquidacionId);
  }

  anularLiquidacion(id: string, motivo: string): void {
    const liq = this.obtenerPorId(id);
    if (!liq) return;

    if (liq.estado === 'PAGADA') {
      this.toast.error('No se puede anular una liquidación que ya ha sido pagada en tesorería.');
      return;
    }

    liq.estado = 'ANULADA';
    liq.motivoAnulacion = motivo || 'Anulación administrativa autorizada';
    liq.fechaAnulacion = new Date().toISOString().replace('T', ' ').substring(0, 19);

    this.storage.saveLiquidacion(liq);

    const currentUser = this.storage.getCurrentUser();
    this.storage.registrarAuditoria({
      usuarioNombre: currentUser.nombre,
      usuarioRol: currentUser.rol,
      accion: 'ANULACION',
      entidadAfectada: 'LIQUIDACION',
      referenciaEntidad: liq.numeroLiquidacion,
      descripcion: `Anulación de liquidación ${liq.numeroLiquidacion}. Motivo: ${liq.motivoAnulacion}`
    });

    this.toast.warning(`Liquidación ${liq.numeroLiquidacion} ha sido anulada.`);
  }

  imprimirLiquidacion(liq: LiquidacionEstampilla): void {
    window.print();
  }
}
