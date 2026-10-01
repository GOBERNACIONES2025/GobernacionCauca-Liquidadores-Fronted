import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
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
  private sanitizer = inject(DomSanitizer);

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

  // Soporte de Pago / Archivo FTP
  readonly archivoComprobanteSeleccionado = signal<File | null>(null);
  readonly subiendoComprobanteFtp = signal<boolean>(false);
  readonly errorArchivoComprobante = signal<string | null>(null);

  // Modal de VISUALIZACIÓN DE COMPROBANTE DE RECAUDO (Para declaraciones Pagadas)
  readonly declaracionParaComprobante = signal<DeclaracionDeguelloData | null>(null);

  // Modal de PREVISUALIZACIÓN DE SOPORTES (Guías ICA, Comprobantes de pago) - Sin descarga
  readonly previewSoporteVisible = signal<boolean>(false);
  readonly previewSoporteUrl = signal<SafeResourceUrl | null>(null);
  readonly previewSoporteUrlRaw = signal<string>('');
  readonly previewSoporteNombre = signal<string>('');
  readonly previewSoporteEsPdf = signal<boolean>(true);

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
    this.archivoComprobanteSeleccionado.set(null);
    this.subiendoComprobanteFtp.set(false);
    this.errorArchivoComprobante.set(null);
    this.declaracionParaPagoBancario.set(d);
  }

  cerrarPagoBancario(): void {
    this.declaracionParaPagoBancario.set(null);
    this.archivoComprobanteSeleccionado.set(null);
    this.subiendoComprobanteFtp.set(false);
    this.errorArchivoComprobante.set(null);
  }

  onArchivoComprobanteSeleccionado(event: any): void {
    const file = event?.target?.files?.[0];
    if (!file) {
      this.archivoComprobanteSeleccionado.set(null);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.errorArchivoComprobante.set('El comprobante no debe superar los 10MB.');
      this.archivoComprobanteSeleccionado.set(null);
      return;
    }

    this.errorArchivoComprobante.set(null);
    this.archivoComprobanteSeleccionado.set(file);
  }

  eliminarArchivoComprobante(): void {
    this.archivoComprobanteSeleccionado.set(null);
    this.errorArchivoComprobante.set(null);
  }

  confirmarPagoBancario(): void {
    const dec = this.declaracionParaPagoBancario();
    if (!dec) return;

    const recibo = this.numeroComprobante().trim() || `REC-${Math.floor(100000 + Math.random() * 900000)}`;
    const detalleRecibo = `${recibo} (${this.bancoSeleccionado().split(' - ')[0]} - ${this.canalPago()})`;
    const file = this.archivoComprobanteSeleccionado();

    // Si se adjuntó archivo, se sube por FTP directamente a la carpeta del mismo contribuyente:
    // /DEGUELLO/EMPRESAS/{nitContribuyente}/{anio}/SOPORTES_PAGO
    if (file) {
      this.subiendoComprobanteFtp.set(true);
      const nitContribuyente = (dec.nit || 'GENERAL').replace(/[^0-9a-zA-Z]/g, '');
      const anio = dec.anioGravable || 2026;

      this.deguelloFtpService.subirSoportePago(file, nitContribuyente, anio).subscribe({
        next: (ftpRes) => {
          this.subiendoComprobanteFtp.set(false);
          const rutaFtp = ftpRes?.remoteFullPath || '';
          const nombreFtp = ftpRes?.originalFileName || file.name;
          this.ejecutarRegistroPago(dec, detalleRecibo, rutaFtp, nombreFtp);
        },
        error: (err) => {
          console.warn('FTP no disponible o error al subir comprobante. Registrando pago con referencia.', err);
          this.subiendoComprobanteFtp.set(false);
          this.ejecutarRegistroPago(dec, detalleRecibo, '', file.name);
        }
      });
    } else {
      this.ejecutarRegistroPago(dec, detalleRecibo, '', '');
    }
  }

  private ejecutarRegistroPago(
    dec: DeclaracionDeguelloData, 
    detalleRecibo: string, 
    rutaFtp: string, 
    nombreFtp: string
  ): void {
    this.deguelloService.marcarComoPagada(dec.consecutivo, detalleRecibo, rutaFtp, nombreFtp).subscribe({
      next: (ok) => {
        this.cerrarPagoBancario();
        if (ok) {
          this.cargarDatos();
          this.mensajeAccion.set({
            texto: `✅ Se registró exitosamente el recaudo bancario para el formulario N° ${dec.consecutivo} (Comprobante: ${detalleRecibo}${rutaFtp ? ' · Guardado en FTP del contribuyente' : ''}).`,
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

  // --- PREVISUALIZACIÓN DE SOPORTES (ICA, COMPROBANTES) SIN DESCARGA ---
  abrirPreviewSoporte(ruta?: string, nombreArchivo?: string): void {
    if (!ruta) return;
    const rawUrl = this.deguelloFtpService.obtenerUrlPreview(ruta);
    this.previewSoporteUrlRaw.set(rawUrl);
    this.previewSoporteUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(rawUrl));
    this.previewSoporteNombre.set(nombreArchivo || 'Soporte_Guia_ICA.pdf');
    const esPdf = !nombreArchivo || nombreArchivo.toLowerCase().endsWith('.pdf') || ruta.toLowerCase().endsWith('.pdf');
    this.previewSoporteEsPdf.set(esPdf);
    this.previewSoporteVisible.set(true);
  }

  cerrarPreviewSoporte(): void {
    this.previewSoporteVisible.set(false);
    this.previewSoporteUrl.set(null);
    this.previewSoporteUrlRaw.set('');
  }
}
