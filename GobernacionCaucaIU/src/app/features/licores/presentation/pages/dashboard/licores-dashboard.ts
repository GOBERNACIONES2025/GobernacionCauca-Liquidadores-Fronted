import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LicoresService } from '../../../application/licores.service';
import { formatCurrencyCop } from '../../../domain/calculator/licores-tax-calculator';
import { LiquidacionLicores } from '../../../domain/models/licores.models';
import { TornaguiaViewerComponent } from '../../components/tornaguia-viewer/tornaguia-viewer.component';
import { AuditoriaModalComponent } from '../../components/auditoria-modal/auditoria-modal.component';

@Component({
  selector: 'app-licores-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, TornaguiaViewerComponent, AuditoriaModalComponent],
  templateUrl: './licores-dashboard.html',
})
export class LicoresDashboardComponent {
  readonly licoresService = inject(LicoresService);

  liquidacionSeleccionada = signal<LiquidacionLicores | null>(null);
  modalActivo = signal<'NINGUNO' | 'TORNAGUIA' | 'AUDITORIA'>('NINGUNO');

  formatMoney(val: number): string {
    return formatCurrencyCop(val);
  }

  abrirTornaguia(liq: LiquidacionLicores): void {
    this.liquidacionSeleccionada.set(liq);
    this.modalActivo.set('TORNAGUIA');
  }

  abrirAuditoria(liq: LiquidacionLicores): void {
    this.liquidacionSeleccionada.set(liq);
    this.modalActivo.set('AUDITORIA');
  }

  cerrarModales(): void {
    this.modalActivo.set('NINGUNO');
    this.liquidacionSeleccionada.set(null);
  }
}
