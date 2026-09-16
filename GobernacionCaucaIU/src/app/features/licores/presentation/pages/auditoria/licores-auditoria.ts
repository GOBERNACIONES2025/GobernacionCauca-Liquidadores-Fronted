import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LicoresService } from '../../../application/licores.service';
import { formatCurrencyCop } from '../../../domain/calculator/licores-tax-calculator';
import { LiquidacionLicores } from '../../../domain/models/licores.models';
import { AuditoriaModalComponent } from '../../components/auditoria-modal/auditoria-modal.component';
import { TornaguiaViewerComponent } from '../../components/tornaguia-viewer/tornaguia-viewer.component';
import { LiquidacionPdfModalComponent } from '../../components/liquidacion-pdf-modal/liquidacion-pdf-modal.component';

@Component({
  selector: 'app-licores-auditoria',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AuditoriaModalComponent,
    TornaguiaViewerComponent,
    LiquidacionPdfModalComponent,
  ],
  templateUrl: './licores-auditoria.html',
})
export class LicoresAuditoriaComponent {
  readonly licoresService = inject(LicoresService);

  liquidacionSeleccionada = signal<LiquidacionLicores | null>(null);
  modalActivo = signal<'NINGUNO' | 'AUDITORIA' | 'TORNAGUIA' | 'LIQUIDACION_PDF'>('NINGUNO');
  mensajeExito = signal<string | null>(null);

  formatMoney(val: number): string {
    return formatCurrencyCop(val);
  }

  abrirAuditoria(liq: LiquidacionLicores): void {
    this.liquidacionSeleccionada.set(liq);
    this.modalActivo.set('AUDITORIA');
  }

  abrirLiquidacionPdf(liq: LiquidacionLicores): void {
    this.liquidacionSeleccionada.set(liq);
    this.modalActivo.set('LIQUIDACION_PDF');
  }

  abrirTornaguia(liq: LiquidacionLicores): void {
    this.liquidacionSeleccionada.set(liq);
    this.modalActivo.set('TORNAGUIA');
  }

  cerrarModales(): void {
    this.modalActivo.set('NINGUNO');
    this.liquidacionSeleccionada.set(null);
  }

  onAprobar(evento: { id: string; observacion: string }): void {
    this.licoresService.aprobarDeclaracion(evento.id, evento.observacion);
    this.cerrarModales();
    this.lanzarMensaje('Declaración aprobada exitosamente. Se emitió la orden de pago (PENDIENTE_PAGO).');
  }

  onRequerir(evento: { id: string; motivo: string }): void {
    this.licoresService.requerirDeclaracion(evento.id, evento.motivo);
    this.cerrarModales();
    this.lanzarMensaje('Requerimiento notificado al declarante. Estado cambiado a REQUERIDO.');
  }

  onRechazar(evento: { id: string; motivo: string }): void {
    this.licoresService.rechazarDeclaracion(evento.id, evento.motivo);
    this.cerrarModales();
    this.lanzarMensaje('Declaración rechazada por la autoridad fiscal.');
  }

  private lanzarMensaje(msg: string): void {
    this.mensajeExito.set(msg);
    setTimeout(() => {
      this.mensajeExito.set(null);
    }, 6000);
  }
}
