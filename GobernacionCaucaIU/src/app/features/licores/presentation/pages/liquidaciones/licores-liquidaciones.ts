import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LicoresService } from '../../../application/licores.service';
import { formatCurrencyCop } from '../../../domain/calculator/licores-tax-calculator';
import { LiquidacionLicores } from '../../../domain/models/licores.models';
import { TornaguiaViewerComponent } from '../../components/tornaguia-viewer/tornaguia-viewer.component';
import { PseModalComponent } from '../../components/pse-modal/pse-modal.component';
import { AsobancarioModalComponent } from '../../components/asobancario-modal/asobancario-modal.component';
import { AuditoriaModalComponent } from '../../components/auditoria-modal/auditoria-modal.component';
import { LiquidacionPdfModalComponent } from '../../components/liquidacion-pdf-modal/liquidacion-pdf-modal.component';

@Component({
  selector: 'app-licores-liquidaciones',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TornaguiaViewerComponent,
    PseModalComponent,
    AsobancarioModalComponent,
    AuditoriaModalComponent,
    LiquidacionPdfModalComponent,
  ],
  templateUrl: './licores-liquidaciones.html',
})
export class LicoresLiquidacionesComponent {
  readonly licoresService = inject(LicoresService);

  liquidacionSeleccionada = signal<LiquidacionLicores | null>(null);
  modalActivo = signal<'NINGUNO' | 'TORNAGUIA' | 'PSE' | 'ASOBANCARIO' | 'DETALLE' | 'LIQUIDACION_PDF'>('NINGUNO');
  mensajeExito = signal<string | null>(null);

  formatMoney(val: number): string {
    return formatCurrencyCop(val);
  }

  abrirTornaguia(liq: LiquidacionLicores): void {
    this.liquidacionSeleccionada.set(liq);
    this.modalActivo.set('TORNAGUIA');
  }

  abrirLiquidacionPdf(liq: LiquidacionLicores): void {
    this.liquidacionSeleccionada.set(liq);
    this.modalActivo.set('LIQUIDACION_PDF');
  }

  abrirPse(liq: LiquidacionLicores): void {
    this.liquidacionSeleccionada.set(liq);
    this.modalActivo.set('PSE');
  }

  abrirAsobancario(liq: LiquidacionLicores): void {
    this.liquidacionSeleccionada.set(liq);
    this.modalActivo.set('ASOBANCARIO');
  }

  abrirDetalle(liq: LiquidacionLicores): void {
    this.liquidacionSeleccionada.set(liq);
    this.modalActivo.set('DETALLE');
  }

  cerrarModales(): void {
    this.modalActivo.set('NINGUNO');
    this.liquidacionSeleccionada.set(null);
  }

  onPagoPseExitoso(pagoData: {
    metodo: 'PSE';
    banco: string;
    referencia: string;
    codigoTransaccionPse: string;
  }): void {
    const liq = this.liquidacionSeleccionada();
    if (!liq) return;

    const actualizada = this.licoresService.procesarPago(liq.id, pagoData);
    this.cerrarModales();

    if (actualizada) {
      this.lanzarMensaje(`Pago PSE aprobado. Tornaguía oficial ${actualizada.tornaguiaNumero} emitida.`);
      this.abrirTornaguia(actualizada);
    }
  }

  onPagoAsobancario(pagoData: {
    metodo: 'ASOBANCARIO_VENTANILLA';
    banco: string;
    referencia: string;
  }): void {
    const liq = this.liquidacionSeleccionada();
    if (!liq) return;

    const actualizada = this.licoresService.procesarPago(liq.id, pagoData);
    this.cerrarModales();

    if (actualizada) {
      this.lanzarMensaje(`Extracto bancario relacionado. Tornaguía ${actualizada.tornaguiaNumero} emitida.`);
      this.abrirTornaguia(actualizada);
    }
  }

  private lanzarMensaje(msg: string): void {
    this.mensajeExito.set(msg);
    setTimeout(() => {
      this.mensajeExito.set(null);
    }, 6000);
  }
}
