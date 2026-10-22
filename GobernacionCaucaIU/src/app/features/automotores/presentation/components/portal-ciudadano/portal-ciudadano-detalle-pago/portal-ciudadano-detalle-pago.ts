// Autor: Juan Sebastián Montaño Pérez
// Fecha: 01/10/2026 - Actualizado: 15/10/2026
// Módulo: Portal Ciudadano / Previsualizador de Liquidación Oficial
// Descripción: Panel de pantalla completa animado desde abajo (slide-up) con renderizado HTML directo del documento oficial, botones Pagar con PSE, Descargar PDF y Cerrar/Salir.

import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml, SafeResourceUrl } from '@angular/platform-browser';
import { LiquidacionCiudadano, PropietarioCiudadano } from '../../../../domain/interfaces/consulta-vehicular.interface';
import { PagosApiService } from '../../../../infrastructure/api/pagos-api.service';
import { LiquidacionesApiService } from '../../../../infrastructure/api/liquidaciones-api.service';

@Component({
  selector: 'app-portal-ciudadano-detalle-pago',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './portal-ciudadano-detalle-pago.html',
  styles: [`
    :host {
      display: block;
    }
    .documento-liquidacion-container {
      width: 100%;
      height: auto !important;
      overflow: visible !important;
    }
    .documento-liquidacion-container ::ng-deep * {
      max-height: none !important;
    }
    .pdf-full-embed {
      width: 100%;
      min-height: 1180px;
      height: 1250px;
      border: none;
      overflow: hidden;
      display: block;
    }
  `]
})
export class PortalCiudadanoDetallePago implements OnInit, OnDestroy {
  @Input() liquidacion: LiquidacionCiudadano | null = null;
  @Input() propietario: PropietarioCiudadano | null = null;
  @Input() placa: string = '';
  @Output() cerrar = new EventEmitter<void>();
  @Output() pagar = new EventEmitter<void>();

  private pagosApi = inject(PagosApiService);
  private liquidacionesApi = inject(LiquidacionesApiService);
  private sanitizer = inject(DomSanitizer);

  // Control de animación slide-up / slide-down
  readonly animacionAbierta = signal<boolean>(false);

  // Estados de carga y error
  readonly cargando = signal<boolean>(false);
  readonly descargandoPdf = signal<boolean>(false);
  readonly cargandoHtml = signal<boolean>(true);
  readonly errorMensaje = signal<string | null>(null);
  readonly errorHtml = signal<string | null>(null);

  // Contenido HTML seguro del documento oficial (altura total, sin scroll interno)
  readonly htmlSeguro = signal<SafeHtml | null>(null);

  // URL del PDF seguro si se consume directamente del servicio que envía el PDF
  readonly pdfUrlSeguro = signal<SafeResourceUrl | null>(null);
  private pdfObjectUrl: string | null = null;

  get placaEfectiva(): string {
    return (this.liquidacion?.placa || this.placa || '').toUpperCase().trim();
  }

  ngOnInit(): void {
    // 1. Activar animación de entrada fluida (slide-up desde abajo)
    setTimeout(() => {
      this.animacionAbierta.set(true);
    }, 25);

    // 2. Cargar el documento oficial de la liquidación (HTML o PDF directo)
    this.cargarDocumentoHtml();
  }

  ngOnDestroy(): void {
    if (this.pdfObjectUrl) {
      window.URL.revokeObjectURL(this.pdfObjectUrl);
      this.pdfObjectUrl = null;
    }
  }

  cargarDocumentoHtml(): void {
    if (!this.liquidacion) return;
    const placa = this.placaEfectiva;
    const vigencia = Number(this.liquidacion.vigencia) || undefined;

    this.cargandoHtml.set(true);
    this.errorHtml.set(null);
    this.htmlSeguro.set(null);
    this.pdfUrlSeguro.set(null);

    // 1. Intentamos consultar la previsualización oficial en HTML
    this.liquidacionesApi.previsualizarFactura(placa, vigencia, false).subscribe({
      next: (res) => {
        if (res && res.data && res.data.htmlContent) {
          this.cargandoHtml.set(false);
          this.htmlSeguro.set(this.sanitizer.bypassSecurityTrustHtml(res.data.htmlContent));
        } else {
          // Si el endpoint no retorna HTML, cargamos directamente el PDF del servicio oficial
          this.cargarPdfDirecto(placa, vigencia);
        }
      },
      error: () => {
        // En caso de que el backend envíe directamente el PDF en /liquidaciones/pdf
        this.cargarPdfDirecto(placa, vigencia);
      }
    });
  }

  /**
   * Carga el archivo PDF directamente desde el servicio oficial y lo muestra a altura total
   */
  cargarPdfDirecto(placa: string, vigencia?: number): void {
    this.liquidacionesApi.descargarPdfBlob(placa, vigencia, false).subscribe({
      next: (blob: Blob) => {
        this.cargandoHtml.set(false);
        if (blob && blob.size > 0) {
          if (this.pdfObjectUrl) {
            window.URL.revokeObjectURL(this.pdfObjectUrl);
          }
          this.pdfObjectUrl = window.URL.createObjectURL(blob);
          this.pdfUrlSeguro.set(
            this.sanitizer.bypassSecurityTrustResourceUrl(`${this.pdfObjectUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`)
          );
        } else {
          this.errorHtml.set('No fue posible cargar el documento oficial de la liquidación.');
        }
      },
      error: (err) => {
        this.cargandoHtml.set(false);
        console.error('Error al cargar PDF directo:', err);
        this.errorHtml.set('No fue posible cargar el documento oficial para previsualización.');
      }
    });
  }

  /**
   * Cierra el visor con animación slide-down fluida y perceptible (ocultándose debajo de la página)
   */
  cerrarConAnimacion(): void {
    if (this.cargando()) return;
    this.animacionAbierta.set(false);
    setTimeout(() => {
      this.cerrar.emit();
    }, 2000);
  }

  /**
   * Consume el endpoint oficial que envía directamente el archivo PDF
   */
  descargarPdf(): void {
    if (!this.liquidacion || this.descargandoPdf()) return;
    this.descargandoPdf.set(true);

    const placa = this.placaEfectiva;
    const vigencia = Number(this.liquidacion.vigencia) || undefined;

    this.liquidacionesApi.descargarPdfBlob(placa, vigencia, false).subscribe({
      next: (blob: Blob) => {
        this.descargandoPdf.set(false);
        if (blob && blob.size > 0) {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Liquidacion_Oficial_${placa}_${vigencia || ''}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        } else {
          const directUrl = this.liquidacionesApi.construirPdfUrl(placa, vigencia, false, true);
          window.open(directUrl, '_blank');
        }
      },
      error: (err) => {
        this.descargandoPdf.set(false);
        console.warn('Fallo la descarga binaria por blob, abriendo enlace directo:', err);
        const directUrl = this.liquidacionesApi.construirPdfUrl(placa, vigencia, false, true);
        window.open(directUrl, '_blank');
      }
    });
  }

  /**
   * Conecta con la pasarela oficial PSE
   */
  confirmarPago(): void {
    if (!this.liquidacion || this.cargando()) return;

    this.cargando.set(true);
    this.errorMensaje.set(null);

    const request = {
      liquidacionId: this.liquidacion.liquidacionId,
      placa: this.placaEfectiva,
      documento: this.propietario?.documento ?? '',
      email: this.propietario?.email ?? undefined,
      telefono: this.propietario?.telefono ?? undefined,
      urlRetorno: `${window.location.origin}/automotores/portal-ciudadano`
    };

    this.pagosApi.iniciarPago(request).subscribe({
      next: (res) => {
        const exitoso = res.isSuccess ?? res.IsSuccess ?? false;
        const resultado = res.result ?? res.Result;

        if (!exitoso || !resultado) {
          this.cargando.set(false);
          const msg = res.message ?? res.Message ?? 'No fue posible iniciar el proceso de pago. Intente nuevamente.';
          this.errorMensaje.set(msg);
          return;
        }

        const urlPasarela = resultado.urlPagoEfectiva 
          ?? resultado.url 
          ?? resultado.Url 
          ?? resultado.urlBanco 
          ?? resultado.UrlBanco;

        if (urlPasarela) {
          window.location.href = urlPasarela;
        } else {
          this.cargando.set(false);
          this.errorMensaje.set('La pasarela no retornó una URL de pago válida. Contacte al administrador.');
        }
      },
      error: (err) => {
        this.cargando.set(false);
        const serverMsg = err?.error?.message 
          ?? err?.error?.Message 
          ?? err?.error?.detail 
          ?? err?.error?.title;
        this.errorMensaje.set(
          serverMsg || 'No fue posible iniciar el proceso de pago. Verifique los datos o intente nuevamente.'
        );
      }
    });
  }
}
