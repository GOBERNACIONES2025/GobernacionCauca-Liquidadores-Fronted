import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DeguelloService } from '../../../infrastructure/services/deguello.service';
import { DeguelloFtpService } from '../../../infrastructure/services/deguello-ftp.service';
import { DeclaracionDeguelloData } from '../../../domain/models/deguello.model';
import { FacturaModalComponent } from '../../components/factura-modal/factura-modal';

@Component({
  selector: 'app-deguello-facturacion',
  standalone: true,
  imports: [CommonModule, FormsModule, FacturaModalComponent],
  templateUrl: './deguello-facturacion.html',
})
export class DeguelloFacturacionComponent implements OnInit {
  private deguelloService = inject(DeguelloService);
  private deguelloFtpService = inject(DeguelloFtpService);
  private router = inject(Router);

  readonly listaDeclaraciones = signal<DeclaracionDeguelloData[]>([]);
  readonly filtroTexto = signal<string>('');
  readonly filtroEstado = signal<'TODOS' | 'RADICADA' | 'PENDIENTE' | 'PAGADO' | 'VENCIDO' | 'RELIQUIDADA'>('TODOS');
  readonly mensajeAccion = signal<{ texto: string; tipo: 'success' | 'info' | 'error' } | null>(null);

  // Modal para ver/imprimir el formulario oficial
  readonly declaracionParaModal = signal<DeclaracionDeguelloData | null>(null);

  // Modal de REVISIÓN DE RADICACIÓN (Funcionario)
  readonly declaracionParaRevision = signal<DeclaracionDeguelloData | null>(null);
  readonly observacionesRevision = signal<string>('Soporte ICA verificado y conforme. Cumple requisitos sanitarios y destinación a PBA autorizada.');

  // Modal de REGISTRO DE PAGO BANCARIO / VENTANILLA (Funcionario / Tesorería)
  readonly declaracionParaPagoBancario = signal<DeclaracionDeguelloData | null>(null);
  readonly bancoSeleccionado = signal<string>('Banco de Occidente - Cta Recaudadora Deptal #072-84192-3');
  readonly canalPago = signal<string>('Ventanilla / Taquilla Bancaria');
  readonly numeroComprobante = signal<string>('');
  readonly fechaPagoBancario = signal<string>(new Date().toISOString().substring(0, 10));

  // Modal de VISUALIZACIÓN DE COMPROBANTE DE RECAUDO (Para declaraciones Pagadas)
  readonly declaracionParaComprobante = signal<DeclaracionDeguelloData | null>(null);

  // KPIs
  readonly totalRecaudado = computed(() => {
    return this.listaDeclaraciones()
      .filter((d) => d.estadoPago === 'PAGADO')
      .reduce((acc, curr) => acc + curr.totalAPagar, 0);
  });

  readonly totalCabezas = computed(() => {
    return this.listaDeclaraciones().reduce((acc, curr) => acc + curr.baseGravable, 0);
  });

  readonly totalPendientes = computed(() => {
    return this.listaDeclaraciones().filter((d) => d.estadoPago === 'PENDIENTE').length;
  });

  readonly totalRadicadas = computed(() => {
    return this.listaDeclaraciones().filter((d) => d.estadoPago === 'RADICADA').length;
  });

  // Lista Filtrada
  readonly declaracionesFiltradas = computed(() => {
    const texto = this.filtroTexto().toLowerCase().trim();
    const est = this.filtroEstado();

    return this.listaDeclaraciones().filter((d) => {
      const matchEstado = est === 'TODOS' || d.estadoPago === est;
      const matchTexto =
        texto === '' ||
        d.consecutivo.toLowerCase().includes(texto) ||
        d.razonSocial.toLowerCase().includes(texto) ||
        d.nit.toLowerCase().includes(texto) ||
        (d.numeroGuiaIca || '').toLowerCase().includes(texto) ||
        (d.numeroRadicado || '').toLowerCase().includes(texto) ||
        d.municipio.toLowerCase().includes(texto);

      return matchEstado && matchTexto;
    });
  });

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.deguelloService.listarDeclaraciones().subscribe((items) => {
      this.listaDeclaraciones.set(items);
    });
  }

  // --- MODAL FACTURA / FORMULARIO OFICIAL ---
  abrirFacturaModal(d: DeclaracionDeguelloData): void {
    this.declaracionParaModal.set(d);
  }

  cerrarFacturaModal(): void {
    this.declaracionParaModal.set(null);
  }

  // --- MODAL DE REVISIÓN OFICIAL (FUNCIONARIO) ---
  abrirRevision(d: DeclaracionDeguelloData): void {
    this.observacionesRevision.set('Soporte ICA verificado y conforme. Cumple requisitos sanitarios y destinación a PBA autorizada.');
    this.declaracionParaRevision.set(d);
  }

  cerrarRevision(): void {
    this.declaracionParaRevision.set(null);
  }

  confirmarAprobacion(): void {
    const dec = this.declaracionParaRevision();
    if (!dec) return;

    this.deguelloService.aprobarLiquidacion(dec.consecutivo).subscribe({
      next: () => {
        this.cerrarRevision();
        this.cargarDatos();
        this.mensajeAccion.set({
          texto: `✅ La declaración N° ${dec.consecutivo} ha sido APROBADA y VALIDADA oficialmente por la Gobernación del Cauca. Pasa a estado PENDIENTE y queda habilitada para pago.`,
          tipo: 'success'
        });
        setTimeout(() => this.mensajeAccion.set(null), 6000);
      },
      error: () => {
        this.cerrarRevision();
        this.cargarDatos();
        this.mensajeAccion.set({
          texto: `Declaración N° ${dec.consecutivo} procesada.`,
          tipo: 'info'
        });
        setTimeout(() => this.mensajeAccion.set(null), 4000);
      }
    });
  }

  // --- MODAL REGISTRO DE PAGO BANCARIO ---
  abrirPagoBancario(d: DeclaracionDeguelloData): void {
    if (d.estadoPago === 'VENCIDO') {
      this.mensajeAccion.set({
        texto: `⚠️ La liquidación N° ${d.consecutivo} está VENCIDA. No es válida para pago directo; debe reliquidarse primero.`,
        tipo: 'error'
      });
      return;
    }
    if (d.estadoPago === 'RELIQUIDADA') {
      this.mensajeAccion.set({
        texto: `ℹ️ La declaración N° ${d.consecutivo} se encuentra RELIQUIDADA (sustituida). No admite pago; debe consultar y cancelar la nueva factura emitida.`,
        tipo: 'info'
      });
      return;
    }

    const radRandom = Math.floor(100000 + Math.random() * 900000);
    this.numeroComprobante.set(`REC-BAN-${radRandom}`);
    this.fechaPagoBancario.set(new Date().toISOString().substring(0, 10));
    this.declaracionParaPagoBancario.set(d);
  }

  cerrarPagoBancario(): void {
    this.declaracionParaPagoBancario.set(null);
  }

  confirmarPagoBancario(): void {
    const dec = this.declaracionParaPagoBancario();
    if (!dec) return;

    const recibo = this.numeroComprobante().trim() || `REC-${Math.floor(100000 + Math.random() * 900000)}`;
    const detalleRecibo = `${recibo} (${this.bancoSeleccionado().split(' - ')[0]} - ${this.canalPago()})`;

    this.deguelloService.marcarComoPagada(dec.consecutivo, detalleRecibo).subscribe({
      next: (ok) => {
        this.cerrarPagoBancario();
        if (ok) {
          this.cargarDatos();
          this.mensajeAccion.set({
            texto: `✅ Se registró exitosamente el recaudo bancario para el formulario N° ${dec.consecutivo} (Comprobante: ${detalleRecibo}).`,
            tipo: 'success'
          });
          setTimeout(() => this.mensajeAccion.set(null), 6000);
        } else {
          this.mensajeAccion.set({
            texto: `No se pudo registrar el pago. Verifique que la liquidación esté aprobada y vigente.`,
            tipo: 'error'
          });
        }
      },
      error: () => {
        this.cerrarPagoBancario();
        this.cargarDatos();
      }
    });
  }

  // --- COMPROBANTE DE RECAUDO (PAGADOS) ---
  abrirComprobantePago(d: DeclaracionDeguelloData): void {
    this.declaracionParaComprobante.set(d);
  }

  cerrarComprobantePago(): void {
    this.declaracionParaComprobante.set(null);
  }

  reliquidar(d: DeclaracionDeguelloData): void {
    if (d.estadoPago === 'RELIQUIDADA') {
      this.mensajeAccion.set({
        texto: `Esta factura ya fue reliquidada con anterioridad (Sustituida).`,
        tipo: 'info'
      });
      return;
    }
    this.deguelloService.setDeclaracionEnEdicion(d);
    this.router.navigate(['/deguello/liquidacion']);
  }

  irANuevaLiquidacion(): void {
    this.deguelloService.setDeclaracionEnEdicion(null);
    this.router.navigate(['/deguello/liquidacion']);
  }

  obtenerUrlDescarga(ruta?: string): string {
    return ruta ? this.deguelloFtpService.obtenerUrlDescarga(ruta) : '#';
  }
}
