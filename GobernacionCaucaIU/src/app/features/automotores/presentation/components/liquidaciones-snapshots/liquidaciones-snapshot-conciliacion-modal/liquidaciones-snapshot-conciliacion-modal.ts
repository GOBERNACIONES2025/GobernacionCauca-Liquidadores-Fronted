// Autor: Juan Sebastián Montaño Pérez
// Fecha: 30/09/2026
// Módulo: Liquidaciones Vehiculares / Snapshots
// Descripción: Modal para la conciliación de extractos bancarios Asobancaria por fecha de pago y liquidación.

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LiquidacionesSnapshotsFacade } from '../../../../application/facades/liquidaciones-snapshots/liquidaciones-snapshots.facade';

@Component({
  selector: 'app-liquidaciones-snapshot-conciliacion-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './liquidaciones-snapshot-conciliacion-modal.html'
})
export class LiquidacionesSnapshotConciliacionModalComponent {
  readonly facade = inject(LiquidacionesSnapshotsFacade);

  modoBusqueda: 'conciliacion-fecha' | 'referencia-directa' = 'conciliacion-fecha';
  referenciaDirectaInput: string = '';

  cambiarModo(modo: 'conciliacion-fecha' | 'referencia-directa'): void {
    this.modoBusqueda = modo;
  }

  onEjecutarConciliacion(): void {
    if (!this.facade.canExecuteAction()) return;
    this.facade.ejecutarConciliacion();
  }

  onConsultarReferencia(): void {
    if (!this.referenciaDirectaInput.trim()) return;
    this.facade.consultarPorReferencia(this.referenciaDirectaInput.trim());
  }

  verDetalleCompleto(id: number): void {
    this.facade.cerrarConciliacionModal();
    this.facade.abrirDetalle(id);
  }
}
