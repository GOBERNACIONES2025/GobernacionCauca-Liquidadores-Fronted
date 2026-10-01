// Autor: Juan Sebastián Montaño Pérez
// Fecha: 30/09/2026
// Módulo: Liquidaciones Vehiculares / Snapshots
// Descripción: Modal para inspección unitaria de preliquidaciones congeladas con desglose de conceptos.

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LiquidacionesSnapshotsFacade } from '../../../../application/facades/liquidaciones-snapshots/liquidaciones-snapshots.facade';

@Component({
  selector: 'app-liquidaciones-snapshot-detalle-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './liquidaciones-snapshot-detalle-modal.html'
})
export class LiquidacionesSnapshotDetalleModalComponent {
  readonly facade = inject(LiquidacionesSnapshotsFacade);

  copiarReferencia(ref: string | null | undefined): void {
    if (!ref) return;
    this.facade.copiarAlPortapapeles(ref, 'Referencia de pago');
  }
}
