import { Component, Input, Output, EventEmitter, inject, signal, computed, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DeclaracionDeguelloData } from '../../../domain/models/deguello.model';
import { DeguelloService } from '../../../infrastructure/services/deguello.service';
import { DeguelloFtpService } from '../../../infrastructure/services/deguello-ftp.service';

@Component({
  selector: 'app-factura-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './factura-modal.html',
})
export class FacturaModalComponent implements AfterViewInit {
  private deguelloService = inject(DeguelloService);
  private deguelloFtpService = inject(DeguelloFtpService);
  private sanitizer = inject(DomSanitizer);

  @Input({ required: true }) declaracion!: DeclaracionDeguelloData;
  @Output() cerrar = new EventEmitter<void>();

  @ViewChild('printFrame') printFrame?: ElementRef<HTMLIFrameElement>;

  readonly guardandoLiquidacionFtp = signal<boolean>(false);
  readonly liquidacionGuardadaEnFtp = signal<boolean>(false);
  readonly rutaLiquidacionFtp = signal<string | null>(null);

  readonly htmlContent = computed<string>(() => {
    return this.deguelloService.renderizarHtmlFactura(this.declaracion);
  });

  ngAfterViewInit(): void {
    this.cargarIframe();
    if (this.declaracion.rutaArchivoLiquidacionPdf) {
      this.rutaLiquidacionFtp.set(this.declaracion.rutaArchivoLiquidacionPdf);
      this.liquidacionGuardadaEnFtp.set(true);
    } else {
      this.guardarLiquidacionEnFtp();
    }
  }

  cargarIframe(): void {
    if (this.printFrame?.nativeElement) {
      const doc = this.printFrame.nativeElement.contentDocument || this.printFrame.nativeElement.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(this.htmlContent());
        doc.close();
      }
    }
  }

  guardarLiquidacionEnFtp(): void {
    const html = this.htmlContent();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    this.guardandoLiquidacionFtp.set(true);

    this.deguelloFtpService.subirLiquidacion(
      blob, 
      this.declaracion.nit, 
      this.declaracion.anioGravable, 
      this.declaracion.consecutivo
    ).subscribe({
      next: (res) => {
        this.guardandoLiquidacionFtp.set(false);
        this.liquidacionGuardadaEnFtp.set(true);
        this.rutaLiquidacionFtp.set(res.remoteFullPath);
        this.declaracion.rutaArchivoLiquidacionPdf = res.remoteFullPath;
        this.declaracion.nombreArchivoLiquidacion = res.originalFileName || `LIQ_${this.declaracion.consecutivo}.pdf`;
      },
      error: () => {
        this.guardandoLiquidacionFtp.set(false);
      }
    });
  }

  imprimir(): void {
    if (this.printFrame?.nativeElement?.contentWindow) {
      this.printFrame.nativeElement.contentWindow.focus();
      this.printFrame.nativeElement.contentWindow.print();
    } else {
      window.print();
    }
  }

  verGuiaIcaFtp(): void {
    if (this.declaracion.rutaArchivoGuiaIca) {
      const url = this.deguelloFtpService.obtenerUrlDescarga(this.declaracion.rutaArchivoGuiaIca);
      window.open(url, '_blank');
    }
  }

  verLiquidacionFtp(): void {
    const ruta = this.rutaLiquidacionFtp() || this.declaracion.rutaArchivoLiquidacionPdf;
    if (ruta) {
      const url = this.deguelloFtpService.obtenerUrlDescarga(ruta);
      window.open(url, '_blank');
    }
  }
}
