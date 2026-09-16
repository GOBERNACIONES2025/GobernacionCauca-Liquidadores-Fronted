import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LicoresService } from '../../../application/licores.service';
import { formatCurrencyCop } from '../../../domain/calculator/licores-tax-calculator';
import { LiquidacionLicores } from '../../../domain/models/licores.models';
import { LegalizarModalComponent } from '../../components/legalizar-modal/legalizar-modal.component';
import { TornaguiaViewerComponent } from '../../components/tornaguia-viewer/tornaguia-viewer.component';

@Component({
  selector: 'app-licores-legalizacion',
  standalone: true,
  imports: [CommonModule, FormsModule, LegalizarModalComponent, TornaguiaViewerComponent],
  templateUrl: './licores-legalizacion.html',
})
export class LicoresLegalizacionComponent {
  readonly licoresService = inject(LicoresService);

  liquidacionSeleccionada = signal<LiquidacionLicores | null>(null);
  modalActivo = signal<'NINGUNO' | 'LEGALIZAR' | 'TORNAGUIA'>('NINGUNO');
  mensajeExito = signal<string | null>(null);

  formatMoney(val: number): string {
    return formatCurrencyCop(val);
  }

  abrirLegalizar(liq: LiquidacionLicores): void {
    this.liquidacionSeleccionada.set(liq);
    this.modalActivo.set('LEGALIZAR');
  }

  abrirTornaguia(liq: LiquidacionLicores): void {
    this.liquidacionSeleccionada.set(liq);
    this.modalActivo.set('TORNAGUIA');
  }

  cerrarModales(): void {
    this.modalActivo.set('NINGUNO');
    this.liquidacionSeleccionada.set(null);
  }

  onLegalizar(evento: { id: string; funcionario: string; acta: string }): void {
    this.licoresService.legalizarTornaguia(evento.id, evento.funcionario, evento.acta);
    this.cerrarModales();
    this.lanzarMensaje(`¡Tornaguía legalizada con éxito en destino! Acta ${evento.acta} registrada.`);
  }

  private lanzarMensaje(msg: string): void {
    this.mensajeExito.set(msg);
    setTimeout(() => {
      this.mensajeExito.set(null);
    }, 6000);
  }
}
