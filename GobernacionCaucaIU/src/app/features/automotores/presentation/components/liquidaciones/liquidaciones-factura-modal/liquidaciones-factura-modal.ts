import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { LiquidacionesFacade } from '../../../../application/facades/liquidaciones.facade';

@Component({
  selector: 'app-liquidaciones-factura-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './liquidaciones-factura-modal.html'
})
export class LiquidacionesFacturaModalComponent {
  readonly facade = inject(LiquidacionesFacade);
  private sanitizer = inject(DomSanitizer);

  getSafeHtml(html: string | null | undefined): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html || '');
  }
}
