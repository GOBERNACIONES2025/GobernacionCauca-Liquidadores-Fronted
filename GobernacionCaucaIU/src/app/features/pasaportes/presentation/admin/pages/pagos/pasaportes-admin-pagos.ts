import { Component, computed, inject, signal } from '@angular/core';
import { PasaportesAdminDemoService } from '../../../../application/demo/pasaportes-admin-demo.service';
import { AdminAppointment } from '../../../../domain/models/pasaportes-admin.model';

type EstadoLiquidacion = 'Pagada' | 'Pago parcial' | 'Pendiente';
type EstadoPago = 'Aprobado' | 'Pendiente';

interface PagoLiquidacionDemo {
  id: number;
  tipo: 'Pago inicial' | 'Segundo pago';
  fechaIso: string | null;
  fecha: string;
  valor: number;
  estado: EstadoPago;
  referencia: string;
}

interface LiquidacionCitaDemo {
  id: number;
  numero: string;
  referenciaPago: string;
  fechaLiquidacionIso: string;
  fechaLiquidacion: string;
  cita: AdminAppointment;
  total: number;
  valorPagado: number;
  saldoPendiente: number;
  estado: EstadoLiquidacion;
  pagos: PagoLiquidacionDemo[];
}

@Component({
  selector: 'app-pasaportes-admin-pagos',
  standalone: true,
  templateUrl: './pasaportes-admin-pagos.html',
})
export class PasaportesAdminPagos {
  private readonly demo = inject(PasaportesAdminDemoService);
  private readonly pageSize = 8;

  readonly liquidaciones = this.construirLiquidaciones(this.demo.getAppointments());
  readonly mes = signal(this.mesActual());
  readonly busqueda = signal('');
  readonly estado = signal<'Todos' | EstadoLiquidacion>('Todos');
  readonly tipoPasaporte = signal('Todos');
  readonly pagina = signal(1);
  readonly seleccionada = signal<LiquidacionCitaDemo | null>(null);

  readonly liquidacionesMes = computed(() =>
    this.liquidaciones.filter((item) => item.fechaLiquidacionIso.startsWith(this.mes())),
  );

  readonly filtradas = computed(() => {
    const term = this.normalizar(this.busqueda());
    const estado = this.estado();
    const tipoPasaporte = this.tipoPasaporte();

    return this.liquidacionesMes().filter((item) => {
      const matchesTerm = !term || this.normalizar([
        item.numero,
        item.referenciaPago,
        item.cita.ticket,
        item.cita.citizen,
        item.cita.document,
        item.cita.passportType,
      ].join(' ')).includes(term);
      const matchesState = estado === 'Todos' || item.estado === estado;
      const matchesPassport = tipoPasaporte === 'Todos' || item.cita.passportType === tipoPasaporte;
      return matchesTerm && matchesState && matchesPassport;
    });
  });

  readonly resumen = computed(() => {
    const items = this.liquidacionesMes();
    return {
      liquidaciones: items.length,
      totalLiquidado: items.reduce((total, item) => total + item.total, 0),
      recaudado: items.reduce((total, item) => total + item.valorPagado, 0),
      saldoPendiente: items.reduce((total, item) => total + item.saldoPendiente, 0),
    };
  });

  readonly totalPaginas = computed(() => Math.max(1, Math.ceil(this.filtradas().length / this.pageSize)));
  readonly visibles = computed(() => {
    const paginaSegura = Math.min(this.pagina(), this.totalPaginas());
    const inicio = (paginaSegura - 1) * this.pageSize;
    return this.filtradas().slice(inicio, inicio + this.pageSize);
  });

  readonly etiquetaMes = computed(() => {
    const [year, month] = this.mes().split('-').map(Number);
    if (!year || !month) return 'Mes seleccionado';
    return new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' })
      .format(new Date(year, month - 1, 1));
  });

  cambiarMes(value: string): void {
    if (!value) return;
    this.mes.set(value);
    this.pagina.set(1);
  }

  cambiarBusqueda(value: string): void {
    this.busqueda.set(value);
    this.pagina.set(1);
  }

  cambiarEstado(value: string): void {
    this.estado.set(value as 'Todos' | EstadoLiquidacion);
    this.pagina.set(1);
  }

  cambiarTipoPasaporte(value: string): void {
    this.tipoPasaporte.set(value);
    this.pagina.set(1);
  }

  limpiarFiltros(): void {
    this.busqueda.set('');
    this.estado.set('Todos');
    this.tipoPasaporte.set('Todos');
    this.pagina.set(1);
  }

  paginaAnterior(): void {
    this.pagina.update((value) => Math.max(1, value - 1));
  }

  paginaSiguiente(): void {
    this.pagina.update((value) => Math.min(this.totalPaginas(), value + 1));
  }

  abrirDetalle(item: LiquidacionCitaDemo): void {
    this.seleccionada.set(item);
  }

  cerrarDetalle(): void {
    this.seleccionada.set(null);
  }

  moneda(valor: number): string {
    return valor.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  }

  porcentajePagado(item: LiquidacionCitaDemo): number {
    if (!item.total) return 0;
    return Math.min(100, Math.round((item.valorPagado / item.total) * 100));
  }

  ultimoPago(item: LiquidacionCitaDemo): PagoLiquidacionDemo | null {
    const aprobados = item.pagos.filter((pago) => pago.estado === 'Aprobado' && pago.fechaIso);
    return aprobados.at(-1) ?? null;
  }

  estadoClass(estado: EstadoLiquidacion): string {
    switch (estado) {
      case 'Pagada': return 'bg-emerald-100 text-emerald-700';
      case 'Pago parcial': return 'bg-blue-100 text-blue-700';
      case 'Pendiente': return 'bg-amber-100 text-amber-700';
    }
  }

  estadoDotClass(estado: EstadoLiquidacion): string {
    switch (estado) {
      case 'Pagada': return 'bg-emerald-500';
      case 'Pago parcial': return 'bg-blue-500';
      case 'Pendiente': return 'bg-amber-500';
    }
  }

  citaEstadoClass(estado: AdminAppointment['status']): string {
    switch (estado) {
      case 'Finalizada': return 'bg-emerald-100 text-emerald-700';
      case 'Agendada': return 'bg-violet-100 text-violet-700';
      case 'Pendiente': return 'bg-amber-100 text-amber-700';
      case 'Cancelada': return 'bg-rose-100 text-rose-700';
    }
  }

  pagoEstadoClass(estado: EstadoPago): string {
    return estado === 'Aprobado' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700';
  }

  private construirLiquidaciones(citas: readonly AdminAppointment[]): LiquidacionCitaDemo[] {
    return citas
      .filter((cita) => !!cita.paymentReference)
      .map((cita, index) => {
        const total = this.valorPasaporte(cita.passportType);
        const primerPago = Math.min(185000, total);
        const liquidacionIso = this.restarDias(cita.dateIso, cita.status === 'Finalizada' ? 7 : 4);
        const segundoPagoAprobado = cita.status === 'Finalizada';
        const valorPagado = segundoPagoAprobado ? total : primerPago;
        const saldoPendiente = Math.max(0, total - valorPagado);
        const referencia = cita.paymentReference!;
        const pagos: PagoLiquidacionDemo[] = [
          {
            id: index * 2 + 1,
            tipo: 'Pago inicial',
            fechaIso: liquidacionIso,
            fecha: this.formatearFecha(liquidacionIso),
            valor: primerPago,
            estado: 'Aprobado',
            referencia: `${referencia}-01`,
          },
          {
            id: index * 2 + 2,
            tipo: 'Segundo pago',
            fechaIso: segundoPagoAprobado ? cita.dateIso : null,
            fecha: segundoPagoAprobado ? cita.date : 'Pendiente de atención',
            valor: Math.max(0, total - primerPago),
            estado: segundoPagoAprobado ? 'Aprobado' : 'Pendiente',
            referencia: segundoPagoAprobado ? `${referencia}-02` : '—',
          },
        ];

        const estadoLiquidacion: EstadoLiquidacion = saldoPendiente === 0
          ? 'Pagada'
          : valorPagado > 0
            ? 'Pago parcial'
            : 'Pendiente';

        return {
          id: index + 1,
          numero: `LIQ-${liquidacionIso.slice(0, 4)}-${String(index + 1).padStart(5, '0')}`,
          referenciaPago: referencia,
          fechaLiquidacionIso: liquidacionIso,
          fechaLiquidacion: this.formatearFecha(liquidacionIso),
          cita,
          total,
          valorPagado,
          saldoPendiente,
          estado: estadoLiquidacion,
          pagos,
        };
      })
      .sort((a, b) => b.fechaLiquidacionIso.localeCompare(a.fechaLiquidacionIso));
  }

  private valorPasaporte(tipo: AdminAppointment['passportType']): number {
    switch (tipo) {
      case 'Ordinario': return 321000;
      case 'Ejecutivo': return 429000;
      case 'Emergencia': return 500000;
    }
  }

  private restarDias(iso: string, dias: number): string {
    const [year, month, day] = iso.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() - dias);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  private formatearFecha(iso: string): string {
    const [year, month, day] = iso.split('-').map(Number);
    if (!year || !month || !day) return iso;
    return new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })
      .format(new Date(year, month - 1, day));
  }

  private mesActual(): string {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  private normalizar(value: string): string {
    return value.toLocaleLowerCase('es-CO').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }
}
