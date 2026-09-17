import { Injectable, inject, signal, computed } from '@angular/core';
import { EstampillasStorageService } from '../../infrastructure/storage/storage.service';
import { ToastService } from '../../../../core/services/toast.service';
import {
  PagoEstampilla,
  RegistroPagoRequest,
  LiquidacionEstampilla,
  MedioPago
} from '../../domain/models/estampillas.models';

@Injectable({
  providedIn: 'root'
})
export class PagosFacade {
  private storage = inject(EstampillasStorageService);
  private toast = inject(ToastService);

  readonly loading = signal<boolean>(false);
  readonly tabActiva = signal<'PENDIENTES' | 'REALIZADOS' | 'VENCIDOS' | 'CONCILIACION'>('PENDIENTES');

  readonly filtroTexto = signal<string>('');
  readonly filtroMedioPago = signal<string>('TODOS');
  readonly filtroFechaDesde = signal<string>('');
  readonly filtroFechaHasta = signal<string>('');

  readonly paginaActual = signal<number>(1);
  readonly elementosPorPagina = signal<number>(8);

  // Modal de registro de pago
  readonly isModalPagoOpen = signal<boolean>(false);
  readonly liquidacionSeleccionadaParaPago = signal<LiquidacionEstampilla | null>(null);

  readonly liquidacionesPendientes = computed(() => {
    this.storage.dataVersion();
    const texto = this.filtroTexto().toLowerCase().trim();
    return this.storage.getLiquidaciones()
      .filter(l => l.estado === 'PENDIENTE_PAGO' || l.estado === 'GENERADA')
      .filter(l => {
        if (!texto) return true;
        return l.numeroLiquidacion.toLowerCase().includes(texto) ||
          l.contribuyenteNombre.toLowerCase().includes(texto) ||
          l.contribuyenteDocumento.includes(texto) ||
          l.numeroContrato.toLowerCase().includes(texto);
      });
  });

  readonly liquidacionesVencidas = computed(() => {
    this.storage.dataVersion();
    const texto = this.filtroTexto().toLowerCase().trim();
    return this.storage.getLiquidaciones()
      .filter(l => l.estado === 'VENCIDA')
      .filter(l => {
        if (!texto) return true;
        return l.numeroLiquidacion.toLowerCase().includes(texto) ||
          l.contribuyenteNombre.toLowerCase().includes(texto) ||
          l.contribuyenteDocumento.includes(texto);
      });
  });

  readonly pagosRealizados = computed(() => {
    this.storage.dataVersion();
    const texto = this.filtroTexto().toLowerCase().trim();
    const medio = this.filtroMedioPago();
    const desde = this.filtroFechaDesde();
    const hasta = this.filtroFechaHasta();

    return this.storage.getPagos().filter(p => {
      const matchTexto = !texto ||
        p.numeroPago.toLowerCase().includes(texto) ||
        p.numeroLiquidacion.toLowerCase().includes(texto) ||
        p.contribuyenteNombre.toLowerCase().includes(texto) ||
        p.contribuyenteDocumento.includes(texto) ||
        p.numeroReferencia.toLowerCase().includes(texto);

      const matchMedio = medio === 'TODOS' || p.medioPago === medio;

      let matchFecha = true;
      if (desde && p.fechaPago < desde) matchFecha = false;
      if (hasta && p.fechaPago > hasta) matchFecha = false;

      return matchTexto && matchMedio && matchFecha;
    });
  });

  readonly totalPagadoRecaudado = computed(() => {
    return this.pagosRealizados().reduce((sum, p) => sum + p.valorPagado, 0);
  });

  readonly totalPendienteRecaudar = computed(() => {
    return this.liquidacionesPendientes().reduce((sum, l) => sum + l.totalPagar, 0);
  });

  setTab(tab: 'PENDIENTES' | 'REALIZADOS' | 'VENCIDOS' | 'CONCILIACION'): void {
    this.tabActiva.set(tab);
    this.paginaActual.set(1);
  }

  setFiltroTexto(query: string): void {
    this.filtroTexto.set(query);
    this.paginaActual.set(1);
  }

  setFiltroMedioPago(medio: string): void {
    this.filtroMedioPago.set(medio);
    this.paginaActual.set(1);
  }

  setFiltroFechas(desde: string, hasta: string): void {
    this.filtroFechaDesde.set(desde);
    this.filtroFechaHasta.set(hasta);
    this.paginaActual.set(1);
  }

  abrirModalRegistroPago(liquidacion: LiquidacionEstampilla): void {
    this.liquidacionSeleccionadaParaPago.set(liquidacion);
    this.isModalPagoOpen.set(true);
  }

  cerrarModalRegistroPago(): void {
    this.isModalPagoOpen.set(false);
    this.liquidacionSeleccionadaParaPago.set(null);
  }

  registrarPago(req: RegistroPagoRequest): PagoEstampilla | null {
    const liq = this.storage.getLiquidacionById(req.liquidacionId);
    if (!liq) {
      this.toast.error('No se encontró la liquidación seleccionada.');
      return null;
    }

    this.loading.set(true);
    const currentUser = this.storage.getCurrentUser();
    const now = new Date();
    const fechaHoraStr = now.toISOString().replace('T', ' ').substring(0, 19);

    const pagosExistentes = this.storage.getPagos();
    const numPago = `PAG-2026-${(pagosExistentes.length + 1).toString().padStart(6, '0')}`;

    const medioNombres: Record<MedioPago, string> = {
      PSE: 'PSE - Pagos Seguros en Línea',
      BANCO_AGRARIO: 'Banco Agrario de Colombia',
      BANCOLOMBIA: 'Bancolombia S.A.',
      BANCO_OCCIDENTE: 'Banco de Occidente',
      TRANSFERENCIA_BANCARIA: 'Transferencia Interbancaria',
      VENTANILLA_TESORERIA: 'Ventanilla Tesorería Departamental',
      CHEQUE_GERENCIA: 'Cheque de Gerencia',
      OTRO: 'Otro Medio Autorizado'
    };

    const nuevoPago: PagoEstampilla = {
      id: `PAG-${Date.now()}`,
      numeroPago: numPago,
      liquidacionId: liq.id,
      numeroLiquidacion: liq.numeroLiquidacion,
      contribuyenteId: liq.contribuyenteId,
      contribuyenteNombre: liq.contribuyenteNombre,
      contribuyenteDocumento: liq.contribuyenteDocumento,
      valorPagado: Number(req.valorPagado || liq.totalPagar),
      fechaPago: req.fechaPago || now.toISOString().substring(0, 10),
      horaPago: now.toTimeString().substring(0, 8),
      medioPago: req.medioPago,
      medioPagoNombre: medioNombres[req.medioPago] || req.medioPago,
      numeroReferencia: req.numeroReferencia || `REF-${Math.floor(100000 + Math.random() * 900000)}`,
      entidadFinanciera: req.entidadFinanciera || 'Banco Agrario de Colombia',
      cuentaBancariaDestino: 'CTA-CTE 450-99812-3 Recaudo Departamental',
      estado: 'APROBADO',
      observaciones: req.observaciones,
      registradoPor: currentUser.nombre,
      fechaRegistro: fechaHoraStr
    };

    this.storage.savePago(nuevoPago);

    this.storage.registrarAuditoria({
      usuarioNombre: currentUser.nombre,
      usuarioRol: currentUser.rol,
      accion: 'PAGO',
      entidadAfectada: 'PAGO',
      referenciaEntidad: liq.numeroLiquidacion,
      descripcion: `Registro de pago ${nuevoPago.numeroPago} por ${this.storage.formatCOP(nuevoPago.valorPagado)} para liquidación ${liq.numeroLiquidacion}. Medio: ${nuevoPago.medioPagoNombre}`
    });

    this.loading.set(false);
    this.cerrarModalRegistroPago();
    this.toast.success(`Pago ${nuevoPago.numeroPago} registrado exitosamente. La liquidación ahora está PAGADA.`);
    return nuevoPago;
  }
}
