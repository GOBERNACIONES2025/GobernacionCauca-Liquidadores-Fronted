// Autor: Juan Sebastián Montaño Pérez
// Fecha: 30/09/2026
// Módulo: Liquidaciones Vehiculares / Snapshots
// Descripción: Fachada reactiva para la gestión de preliquidaciones congeladas y conciliación bancaria.

import { Injectable, inject, signal, computed } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { LiquidacionesSnapshotsApiService } from '../../../infrastructure/api/liquidaciones-snapshots-api.service';
import {
  LiquidacionSnapshotItem,
  LiquidacionSnapshotDetalle,
  LiquidacionSnapshotFilterParams,
  SnapshotKpis
} from '../../../domain/models/liquidacion-snapshot.model';

@Injectable({
  providedIn: 'root'
})
export class LiquidacionesSnapshotsFacade {
  private readonly api = inject(LiquidacionesSnapshotsApiService);

  readonly snapshots = signal<LiquidacionSnapshotItem[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  readonly page = signal<number>(1);
  readonly pageSize = signal<number>(10);
  readonly totalCount = signal<number>(0);

  readonly filtroBuscar = signal<string>('');
  readonly filtroPlaca = signal<string>('');
  readonly filtroNumeroLiquidacion = signal<string>('');
  readonly filtroReferencia = signal<string>('');
  readonly filtroEstado = signal<string>('');
  readonly filtroFechaDesde = signal<string>('');
  readonly filtroFechaHasta = signal<string>('');
  readonly filtroVigencia = signal<number>(0);

  readonly selectedSnapshot = signal<LiquidacionSnapshotDetalle | null>(null);
  readonly isDetalleModalOpen = signal<boolean>(false);
  readonly loadingDetalle = signal<boolean>(false);
  readonly detalleError = signal<string | null>(null);

  readonly isConciliacionModalOpen = signal<boolean>(false);
  readonly conciliacionNumeroLiquidacion = signal<string>('');
  readonly conciliacionFechaPago = signal<string>('');
  readonly conciliacionResultado = signal<LiquidacionSnapshotDetalle | null>(null);
  readonly loadingConciliacion = signal<boolean>(false);
  readonly conciliacionError = signal<string | null>(null);

  readonly busquedaRapidaReferencia = signal<string>('');
  readonly loadingBusquedaRapida = signal<boolean>(false);
  readonly copiadoExitoso = signal<string | null>(null);

  readonly totalPaginas = computed(() => Math.ceil(this.totalCount() / this.pageSize()) || 1);
  readonly rangoInicio = computed(() => (this.totalCount() === 0 ? 0 : (this.page() - 1) * this.pageSize() + 1));
  readonly rangoFin = computed(() => Math.min(this.page() * this.pageSize(), this.totalCount()));

  readonly hayFiltrosActivos = computed(() => {
    return (
      this.filtroBuscar().trim().length > 0 ||
      this.filtroPlaca().trim().length > 0 ||
      this.filtroNumeroLiquidacion().trim().length > 0 ||
      this.filtroReferencia().trim().length > 0 ||
      this.filtroEstado().trim().length > 0 ||
      this.filtroFechaDesde().trim().length > 0 ||
      this.filtroFechaHasta().trim().length > 0 ||
      this.filtroVigencia() > 0
    );
  });

  readonly kpis = computed<SnapshotKpis>(() => {
    const items = this.snapshots();
    let pendientes = 0;
    let pagados = 0;
    let vencidos = 0;
    let valPendiente = 0;
    let valRecaudado = 0;

    for (const item of items) {
      const estadoUpper = (item.estadoPago || '').toUpperCase();
      if (estadoUpper === 'PAGADO') {
        pagados++;
        valRecaudado += item.valorTotalPagar || 0;
      } else if (estadoUpper === 'PENDIENTE') {
        pendientes++;
        valPendiente += item.valorTotalPagar || 0;
      }

      if (item.esVencido && estadoUpper !== 'PAGADO') {
        vencidos++;
      }
    }

    return {
      totalSnapshots: this.totalCount(),
      totalPendientes: pendientes,
      totalPagados: pagados,
      totalVencidos: vencidos,
      valorTotalPendiente: valPendiente,
      valorTotalRecaudado: valRecaudado
    };
  });

  private sanitizarEntrada(texto: string, longitudMax: number = 100): string {
    if (!texto) return '';
    let limpio = texto.trim();
    limpio = limpio.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    limpio = limpio.replace(/--/g, '');
    limpio = limpio.replace(/;/g, '');
    limpio = limpio.replace(/['"\\]/g, '');
    return limpio.slice(0, longitudMax);
  }

  public canExecuteAction(): boolean {
    return !this.loading() && !this.loadingDetalle() && !this.loadingConciliacion();
  }

  cargarSnapshots(): void {
    if (this.loading()) return;

    this.loading.set(true);
    this.error.set(null);

    const params: LiquidacionSnapshotFilterParams = {
      page: this.page(),
      pageSize: this.pageSize(),
      buscar: this.sanitizarEntrada(this.filtroBuscar()),
      placa: this.sanitizarEntrada(this.filtroPlaca(), 10).toUpperCase(),
      numeroLiquidacion: this.sanitizarEntrada(this.filtroNumeroLiquidacion(), 50),
      referenciaPago: this.sanitizarEntrada(this.filtroReferencia(), 100),
      estadoPago: this.sanitizarEntrada(this.filtroEstado(), 40).toUpperCase(),
      fechaEmisionDesde: this.filtroFechaDesde() || undefined,
      fechaEmisionHasta: this.filtroFechaHasta() || undefined,
      vigencia: this.filtroVigencia() > 0 ? this.filtroVigencia() : undefined
    };

    if (params.fechaEmisionDesde && params.fechaEmisionHasta) {
      if (params.fechaEmisionDesde > params.fechaEmisionHasta) {
        this.error.set('La fecha inicial no puede ser posterior a la fecha final.');
        this.loading.set(false);
        return;
      }
    }

    this.api.getSnapshots(params)
      .pipe(
        catchError(err => {
          this.error.set(err?.error?.message || 'Error al conectar con el servidor de liquidaciones.');
          this.loading.set(false);
          return of(null);
        })
      )
      .subscribe(res => {
        this.loading.set(false);
        if (res && res.data) {
          this.snapshots.set(res.data.items || []);
          this.totalCount.set(res.data.totalCount || 0);
        } else {
          this.snapshots.set([]);
          this.totalCount.set(0);
        }
      });
  }

  setBuscar(query: string): void {
    this.filtroBuscar.set(this.sanitizarEntrada(query));
    this.page.set(1);
    this.cargarSnapshots();
  }

  setPlaca(placa: string): void {
    this.filtroPlaca.set(placa.replace(/[^a-zA-Z0-9\-]/g, '').slice(0, 10).toUpperCase());
    this.page.set(1);
    this.cargarSnapshots();
  }

  setNumeroLiquidacion(numero: string): void {
    this.filtroNumeroLiquidacion.set(this.sanitizarEntrada(numero, 50));
    this.page.set(1);
    this.cargarSnapshots();
  }

  setReferencia(referencia: string): void {
    this.filtroReferencia.set(this.sanitizarEntrada(referencia, 100));
    this.page.set(1);
    this.cargarSnapshots();
  }

  setEstadoPago(estado: string): void {
    this.filtroEstado.set(estado);
    this.page.set(1);
    this.cargarSnapshots();
  }

  setFechas(desde: string, hasta: string): void {
    this.filtroFechaDesde.set(desde);
    this.filtroFechaHasta.set(hasta);
    this.page.set(1);
    this.cargarSnapshots();
  }

  setVigencia(vigencia: number): void {
    this.filtroVigencia.set(vigencia);
    this.page.set(1);
    this.cargarSnapshots();
  }

  limpiarFiltros(): void {
    this.filtroBuscar.set('');
    this.filtroPlaca.set('');
    this.filtroNumeroLiquidacion.set('');
    this.filtroReferencia.set('');
    this.filtroEstado.set('');
    this.filtroFechaDesde.set('');
    this.filtroFechaHasta.set('');
    this.filtroVigencia.set(0);
    this.page.set(1);
    this.cargarSnapshots();
  }

  setPage(nuevaPagina: number): void {
    if (nuevaPagina < 1 || nuevaPagina > this.totalPaginas() || nuevaPagina === this.page()) {
      return;
    }
    this.page.set(nuevaPagina);
    this.cargarSnapshots();
  }

  setPageSize(nuevoTamano: number): void {
    if (nuevoTamano <= 0 || nuevoTamano === this.pageSize()) return;
    this.pageSize.set(nuevoTamano);
    this.page.set(1);
    this.cargarSnapshots();
  }

  abrirDetalle(id: number): void {
    if (!id || id <= 0) return;

    this.selectedSnapshot.set(null);
    this.detalleError.set(null);
    this.loadingDetalle.set(true);
    this.isDetalleModalOpen.set(true);

    this.api.getSnapshotById(id)
      .pipe(
        catchError(err => {
          this.detalleError.set(err?.error?.message || 'No fue posible cargar el detalle del snapshot.');
          this.loadingDetalle.set(false);
          return of(null);
        })
      )
      .subscribe(res => {
        this.loadingDetalle.set(false);
        if (res && res.data) {
          this.selectedSnapshot.set(res.data);
        } else {
          this.detalleError.set('No se encontró información para el snapshot solicitado.');
        }
      });
  }

  cerrarDetalle(): void {
    this.isDetalleModalOpen.set(false);
    this.selectedSnapshot.set(null);
    this.detalleError.set(null);
  }

  abrirConciliacionModal(): void {
    this.conciliacionNumeroLiquidacion.set('');
    this.conciliacionFechaPago.set('');
    this.conciliacionResultado.set(null);
    this.conciliacionError.set(null);
    this.isConciliacionModalOpen.set(true);
  }

  cerrarConciliacionModal(): void {
    this.isConciliacionModalOpen.set(false);
    this.conciliacionResultado.set(null);
    this.conciliacionError.set(null);
  }

  ejecutarConciliacion(): void {
    if (this.loadingConciliacion()) return;

    const numLiq = this.sanitizarEntrada(this.conciliacionNumeroLiquidacion(), 50);
    const fechaPago = this.conciliacionFechaPago().trim();

    if (!numLiq) {
      this.conciliacionError.set('Debe ingresar el número de liquidación oficial.');
      return;
    }

    if (!fechaPago) {
      this.conciliacionError.set('Debe ingresar la fecha exacta en la que se efectuó el pago bancario.');
      return;
    }

    const regexFecha = /^\d{4}-\d{2}-\d{2}$/;
    if (!regexFecha.test(fechaPago)) {
      this.conciliacionError.set('El formato de fecha de pago debe ser AAAA-MM-DD.');
      return;
    }

    this.loadingConciliacion.set(true);
    this.conciliacionError.set(null);
    this.conciliacionResultado.set(null);

    this.api.getSnapshotParaConciliacion(numLiq, fechaPago)
      .pipe(
        catchError(err => {
          this.conciliacionError.set(
            err?.error?.message ||
            `No se encontró preliquidación congelada para la liquidación '${numLiq}' con fecha de pago '${fechaPago}'.`
          );
          this.loadingConciliacion.set(false);
          return of(null);
        })
      )
      .subscribe(res => {
        this.loadingConciliacion.set(false);
        if (res && res.data) {
          this.conciliacionResultado.set(res.data);
        }
      });
  }

  consultarPorReferencia(referencia: string): void {
    const refLimpia = this.sanitizarEntrada(referencia, 100);
    if (!refLimpia) {
      this.error.set('Por favor ingrese una referencia de pago válida.');
      return;
    }

    if (this.loadingBusquedaRapida()) return;

    this.loadingBusquedaRapida.set(true);
    this.error.set(null);

    this.api.getSnapshotByReferencia(refLimpia)
      .pipe(
        catchError(err => {
          this.error.set(err?.error?.message || `No se encontró preliquidación asociada a la referencia '${refLimpia}'.`);
          this.loadingBusquedaRapida.set(false);
          return of(null);
        })
      )
      .subscribe(res => {
        this.loadingBusquedaRapida.set(false);
        if (res && res.data) {
          this.selectedSnapshot.set(res.data);
          this.isDetalleModalOpen.set(true);
        } else {
          this.error.set(`No se encontró preliquidación asociada a la referencia de pago '${refLimpia}'.`);
        }
      });
  }

  copiarAlPortapapeles(texto: string, etiqueta: string = 'Referencia'): void {
    if (!texto) return;
    navigator.clipboard.writeText(texto).then(() => {
      this.copiadoExitoso.set(`${etiqueta} copiada al portapapeles`);
      setTimeout(() => {
        this.copiadoExitoso.set(null);
      }, 2500);
    }).catch(err => {
      console.warn('Error al copiar al portapapeles:', err);
    });
  }
}
