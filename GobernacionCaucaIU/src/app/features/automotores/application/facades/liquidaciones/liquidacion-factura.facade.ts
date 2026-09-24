import { Injectable, inject, signal, computed } from '@angular/core';
import { LiquidacionesApiService } from '../../../infrastructure/api/liquidaciones-api.service';
import { FacturaPreview } from '../../../domain/models/liquidacion.model';
import { downloadPdfFromHtml } from '../../../../../shared/utils/pdf-exporter.util';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

/**
 * Sub-facade responsable del visor de facturas/declaraciones:
 * previsualización HTML en iframe, descarga PDF e impresión.
 */
@Injectable({ providedIn: 'root' })
export class LiquidacionFacturaFacade {
  private api = inject(LiquidacionesApiService);

  // ── Estado del visor ──────────────────────────────────────────────
  readonly isFacturaModalOpen = signal<boolean>(false);
  readonly isFacturaLoading = signal<boolean>(false);
  readonly facturaPreviewData = signal<FacturaPreview | null>(null);
  readonly facturaPreviewHtml = computed(() => this.facturaPreviewData()?.htmlContent ?? '');

  // ── Métodos ───────────────────────────────────────────────────────

  /**
   * Abre el visor y carga la previsualización HTML oficial de la factura.
   */
  abrirFacturaPreview(placa: string, vigencia?: number, esUnificado: boolean = false): void {
    this.isFacturaLoading.set(true);
    this.facturaPreviewData.set(null);
    this.isFacturaModalOpen.set(true);

    this.api.previsualizarFactura(placa, vigencia, esUnificado).pipe(
      catchError(() => {
        this.isFacturaLoading.set(false);
        return of(null);
      })
    ).subscribe(res => {
      this.isFacturaLoading.set(false);
      if (res && res.data) {
        this.facturaPreviewData.set(res.data);
      }
    });
  }

  /** Cierra el modal de previsualización y limpia estado */
  cerrarFacturaModal(): void {
    this.isFacturaModalOpen.set(false);
    this.facturaPreviewData.set(null);
    this.isFacturaLoading.set(false);
  }

  /**
   * Descarga el documento oficial de liquidación en PDF.
   * Prioridad: HTML en memoria → HTML desde API → Blob binario directo.
   */
  descargarFacturaPdf(placa: string, vigencia?: number, esUnificado: boolean = false): void {
    const fileName = esUnificado
      ? `Recibo_Unificado_${placa}.pdf`
      : `Recibo_${placa}_${vigencia || 2026}.pdf`;

    // 1. Usar HTML en memoria si ya está cargado
    const preview = this.facturaPreviewData();
    if (preview && preview.placa?.toUpperCase() === placa.toUpperCase() && preview.htmlContent) {
      downloadPdfFromHtml(preview.htmlContent, fileName);
      return;
    }

    // 2. Obtener HTML oficial desde la API y compilar PDF
    this.api.previsualizarFactura(placa, vigencia, esUnificado).pipe(
      catchError(err => {
        console.warn('Error al consultar HTML de factura, usando fallback binario:', err);
        return of(null);
      })
    ).subscribe(res => {
      if (res && res.data && res.data.htmlContent) {
        downloadPdfFromHtml(res.data.htmlContent, fileName);
      } else {
        // 3. Fallback al endpoint binario del backend
        this.api.descargarPdfBlob(placa, vigencia, esUnificado).pipe(
          catchError(blobErr => {
            console.error('Error al descargar PDF del backend:', blobErr);
            return of(null);
          })
        ).subscribe(blob => {
          if (!blob) return;
          const blobUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
        });
      }
    });
  }

  /**
   * Imprime el documento renderizado en la previsualización del iframe.
   */
  imprimirFacturaPreview(): void {
    const iframe = document.getElementById('facturaIframe') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      return;
    }

    const data = this.facturaPreviewData();
    if (!data || !data.htmlContent) return;

    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const doc = printFrame.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(data.htmlContent);
      doc.close();
      setTimeout(() => {
        printFrame.contentWindow?.focus();
        printFrame.contentWindow?.print();
        setTimeout(() => document.body.removeChild(printFrame), 1000);
      }, 500);
    }
  }
}
