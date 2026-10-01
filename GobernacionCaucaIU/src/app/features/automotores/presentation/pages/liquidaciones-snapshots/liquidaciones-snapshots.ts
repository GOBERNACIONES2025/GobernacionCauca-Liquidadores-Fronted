// Autor: Juan Sebastián Montaño Pérez
// Fecha: 30/09/2026
// Módulo: Liquidaciones Vehiculares / Snapshots
// Descripción: Controlador de página para gestión, inspección y conciliación de preliquidaciones congeladas.

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LiquidacionesSnapshotsFacade } from '../../../application/facades/liquidaciones-snapshots/liquidaciones-snapshots.facade';
import { BreadcrumbComponent } from '../../../../../shared/components/breadcrumb/breadcrumb.component';
import {
  LiquidacionesSnapshotDetalleModalComponent,
  LiquidacionesSnapshotConciliacionModalComponent
} from '../../components/liquidaciones-snapshots';

@Component({
  selector: 'app-liquidaciones-snapshots',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    BreadcrumbComponent,
    LiquidacionesSnapshotDetalleModalComponent,
    LiquidacionesSnapshotConciliacionModalComponent
  ],
  templateUrl: './liquidaciones-snapshots.html'
})
export class LiquidacionesSnapshotsPage implements OnInit {
  readonly facade = inject(LiquidacionesSnapshotsFacade);

  placaFiltroInput: string = '';
  numeroLiqFiltroInput: string = '';
  referenciaFiltroInput: string = '';
  estadoFiltroInput: string = '';
  fechaDesdeInput: string = '';
  fechaHastaInput: string = '';
  vigenciaFiltroInput: number = 0;

  ngOnInit(): void {
    this.facade.cargarSnapshots();
  }

  onBuscar(query: string): void {
    this.facade.setBuscar(query);
  }

  aplicarFiltrosAvanzados(): void {
    if (!this.facade.canExecuteAction()) return;

    if (this.placaFiltroInput !== this.facade.filtroPlaca()) {
      this.facade.setPlaca(this.placaFiltroInput);
    }
    if (this.numeroLiqFiltroInput !== this.facade.filtroNumeroLiquidacion()) {
      this.facade.setNumeroLiquidacion(this.numeroLiqFiltroInput);
    }
    if (this.referenciaFiltroInput !== this.facade.filtroReferencia()) {
      this.facade.setReferencia(this.referenciaFiltroInput);
    }
    if (this.estadoFiltroInput !== this.facade.filtroEstado()) {
      this.facade.setEstadoPago(this.estadoFiltroInput);
    }
    if (this.fechaDesdeInput !== this.facade.filtroFechaDesde() || this.fechaHastaInput !== this.facade.filtroFechaHasta()) {
      this.facade.setFechas(this.fechaDesdeInput, this.fechaHastaInput);
    }
    if (this.vigenciaFiltroInput !== this.facade.filtroVigencia()) {
      this.facade.setVigencia(this.vigenciaFiltroInput);
    }
  }

  onLimpiarFiltros(): void {
    this.placaFiltroInput = '';
    this.numeroLiqFiltroInput = '';
    this.referenciaFiltroInput = '';
    this.estadoFiltroInput = '';
    this.fechaDesdeInput = '';
    this.fechaHastaInput = '';
    this.vigenciaFiltroInput = 0;
    this.facade.limpiarFiltros();
  }

  onAbrirDetalle(id: number): void {
    this.facade.abrirDetalle(id);
  }

  onAbrirConciliacion(): void {
    this.facade.abrirConciliacionModal();
  }

  onCopiarReferencia(ref: string | null | undefined): void {
    if (!ref) return;
    this.facade.copiarAlPortapapeles(ref, 'Referencia bancaria');
  }
}
