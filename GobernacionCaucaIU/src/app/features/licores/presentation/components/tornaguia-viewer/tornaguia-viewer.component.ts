import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LiquidacionLicores } from '../../../domain/models/licores.models';
import { formatCurrencyCop } from '../../../domain/calculator/licores-tax-calculator';

@Component({
  selector: 'app-tornaguia-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tornaguia-viewer.component.html',
  styles: [`
    @media print {
      body * {
        visibility: hidden;
      }
      #print-section, #print-section * {
        visibility: visible;
      }
      #print-section {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        margin: 0;
        padding: 0;
        background: white;
      }
      .no-print {
        display: none !important;
      }
    }
  `]
})
export class TornaguiaViewerComponent {
  @Input({ required: true }) liquidacion!: LiquidacionLicores;
  @Output() cerrar = new EventEmitter<void>();

  formatMoney(val: number): string {
    return formatCurrencyCop(val);
  }

  imprimir(): void {
    window.print();
  }

  getQrSvgPattern(): string {
    // Genera un patrón representativo de QR visualmente rico
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <rect width="100" height="100" fill="white"/>
        <!-- QR markers -->
        <rect x="5" y="5" width="26" height="26" fill="black"/>
        <rect x="8" y="8" width="20" height="20" fill="white"/>
        <rect x="12" y="12" width="12" height="12" fill="black"/>
        
        <rect x="69" y="5" width="26" height="26" fill="black"/>
        <rect x="72" y="8" width="20" height="20" fill="white"/>
        <rect x="76" y="12" width="12" height="12" fill="black"/>
        
        <rect x="5" y="69" width="26" height="26" fill="black"/>
        <rect x="8" y="72" width="20" height="20" fill="white"/>
        <rect x="12" y="76" width="12" height="12" fill="black"/>
        
        <!-- Random-looking QR data points -->
        <rect x="36" y="10" width="6" height="6" fill="black"/>
        <rect x="46" y="10" width="6" height="6" fill="black"/>
        <rect x="56" y="10" width="6" height="6" fill="black"/>
        <rect x="36" y="20" width="6" height="6" fill="black"/>
        <rect x="50" y="20" width="6" height="6" fill="black"/>
        <rect x="10" y="36" width="6" height="6" fill="black"/>
        <rect x="20" y="36" width="6" height="6" fill="black"/>
        <rect x="36" y="36" width="6" height="6" fill="black"/>
        <rect x="46" y="36" width="6" height="6" fill="black"/>
        <rect x="56" y="36" width="6" height="6" fill="black"/>
        <rect x="66" y="36" width="6" height="6" fill="black"/>
        <rect x="76" y="36" width="6" height="6" fill="black"/>
        <rect x="86" y="36" width="6" height="6" fill="black"/>
        <rect x="36" y="46" width="6" height="6" fill="black"/>
        <rect x="46" y="56" width="6" height="6" fill="black"/>
        <rect x="66" y="56" width="6" height="6" fill="black"/>
        <rect x="86" y="56" width="6" height="6" fill="black"/>
        <rect x="36" y="66" width="6" height="6" fill="black"/>
        <rect x="46" y="66" width="6" height="6" fill="black"/>
        <rect x="66" y="66" width="6" height="6" fill="black"/>
        <rect x="76" y="66" width="6" height="6" fill="black"/>
        <rect x="36" y="76" width="6" height="6" fill="black"/>
        <rect x="56" y="76" width="6" height="6" fill="black"/>
        <rect x="86" y="76" width="6" height="6" fill="black"/>
        <rect x="36" y="86" width="6" height="6" fill="black"/>
        <rect x="46" y="86" width="6" height="6" fill="black"/>
        <rect x="66" y="86" width="6" height="6" fill="black"/>
      </svg>
    `);
  }
}
