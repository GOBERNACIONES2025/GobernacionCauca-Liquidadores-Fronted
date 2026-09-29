import { Injectable, inject, signal, computed } from '@angular/core';
import { LiquidacionesApiService } from '../../../infrastructure/api/liquidaciones-api.service';
import { FacturaPreview } from '../../../domain/models/liquidacion.model';
import { downloadPdfFromHtml } from '../../../../../shared/utils/pdf-exporter.util';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';


@Injectable({ providedIn: 'root' })
export class LiquidacionFacturaFacade {
  private api = inject(LiquidacionesApiService);

  readonly isFacturaModalOpen = signal<boolean>(false);
  readonly isFacturaLoading = signal<boolean>(false);
  readonly facturaPreviewData = signal<FacturaPreview | null>(null);
  readonly facturaPreviewHtml = computed(() => this.facturaPreviewData()?.htmlContent ?? '');

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

  cerrarFacturaModal(): void {
    this.isFacturaModalOpen.set(false);
    this.facturaPreviewData.set(null);
    this.isFacturaLoading.set(false);
  }

  descargarFacturaPdf(placa: string, vigencia?: number, esUnificado: boolean = false): void {
    const fileName = esUnificado
      ? `Recibo_Unificado_${placa}.pdf`
      : `Recibo_${placa}_${vigencia || 2026}.pdf`;

    const preview = this.facturaPreviewData();
    if (preview && preview.placa?.toUpperCase() === placa.toUpperCase() && preview.htmlContent) {
      downloadPdfFromHtml(preview.htmlContent, fileName);
      return;
    }

    this.api.previsualizarFactura(placa, vigencia, esUnificado).pipe(
      catchError(err => {
        console.warn('Error al consultar HTML de factura, usando fallback binario:', err);
        return of(null);
      })
    ).subscribe(res => {
      if (res && res.data && res.data.htmlContent) {
        downloadPdfFromHtml(res.data.htmlContent, fileName);
      } else {
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
