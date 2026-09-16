import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LiquidacionLicores } from '../../../domain/models/licores.models';
import { formatCurrencyCop } from '../../../domain/calculator/licores-tax-calculator';
import { downloadPdfFromHtml } from '../../../../../shared/utils/pdf-exporter.util';

@Component({
  selector: 'app-liquidacion-pdf-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './liquidacion-pdf-modal.component.html',
  styleUrls: ['./liquidacion-pdf-modal.component.css'],
})
export class LiquidacionPdfModalComponent {
  @Input({ required: true }) liquidacion!: LiquidacionLicores;
  @Output() cerrar = new EventEmitter<void>();
  @Output() pagarPse = new EventEmitter<LiquidacionLicores>();

  zoomLevel = 100;
  isDownloading = false;

  formatMoney(val: number): string {
    return formatCurrencyCop(val);
  }

  zoomIn(): void {
    this.zoomLevel = Math.min(160, this.zoomLevel + 15);
  }

  zoomOut(): void {
    this.zoomLevel = Math.max(70, this.zoomLevel - 15);
  }

  resetZoom(): void {
    this.zoomLevel = 100;
  }

  imprimir(): void {
    window.print();
  }

  async descargarPdf(): Promise<void> {
    if (this.isDownloading) return;
    this.isDownloading = true;

    try {
      const el = document.getElementById('liquidacion-documento-imprimible');
      if (!el) return;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Liquidacion_${this.liquidacion.numeroRadicado}.pdf</title>
          <style>
            * { box-sizing: border-box; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
            body { margin: 0; padding: 20px; background: #fff; color: #1e293b; font-size: 11px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 5px 8px; text-align: left; }
            th { background-color: #f1f5f9; font-weight: bold; font-size: 10px; color: #0f172a; text-transform: uppercase; }
            .header-table td { border: none; padding: 2px 4px; }
            .badge { display: inline-block; padding: 3px 8px; border-radius: 9999px; font-weight: bold; font-size: 10px; }
            .bg-dark { background-color: #0f4984; color: white; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .font-mono { font-family: 'Courier New', Courier, monospace; }
          </style>
        </head>
        <body>
          ${el.innerHTML}
        </body>
        </html>
      `;

      const filename = `Liquidacion_ICL_${this.liquidacion.numeroRadicado}.pdf`;
      await downloadPdfFromHtml(htmlContent, filename);
    } catch (e) {
      console.error('Error al exportar PDF de liquidación:', e);
    } finally {
      this.isDownloading = false;
    }
  }

  getBarcodeNumber(): string {
    const radLimpio = this.liquidacion.numeroRadicado.replace(/\D/g, '').slice(-6).padStart(10, '0');
    const valorLimpio = String(Math.round(this.liquidacion.totalPagar)).padStart(11, '0');
    return `(415)7709998001234(8020)${radLimpio}(3900)${valorLimpio}(96)20261231`;
  }
}
