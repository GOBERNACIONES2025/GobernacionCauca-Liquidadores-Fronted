import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LiquidacionesFacade } from '../../../application/facades/liquidaciones.facade';
import { DocumentViewerComponent } from '../../../../../shared/components/document-viewer/document-viewer';

@Component({
  selector: 'app-liquidaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, DocumentViewerComponent],
  templateUrl: './liquidaciones.html'
})
export class LiquidacionesPage implements OnInit {
  readonly facade = inject(LiquidacionesFacade);

  placaBuscarModal: string = '';

  ngOnInit(): void {
    this.facade.cargarLiquidaciones();
    this.facade.cargarKpis();
  }

  onBuscar(query: string): void {
    this.facade.setBuscar(query);
  }

  onSimularDirecto(): void {
    if (!this.placaBuscarModal.trim()) return;
    this.facade.abrirSimulacion(this.placaBuscarModal.trim());
  }
}
