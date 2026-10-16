import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LiquidacionesFacade } from '../../../application/facades/liquidaciones.facade';
import { BreadcrumbComponent } from '../../../../../shared/components/breadcrumb/breadcrumb.component';
import {
  LiquidacionesSimulacionModalComponent,
  LiquidacionesMasivaModalComponent,
  LiquidacionesFacturaModalComponent
} from '../../components/liquidaciones';

@Component({
  selector: 'app-liquidaciones',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    BreadcrumbComponent,
    LiquidacionesSimulacionModalComponent,
    LiquidacionesMasivaModalComponent,
    LiquidacionesFacturaModalComponent
  ],
  templateUrl: './liquidaciones.html'
})
export class LiquidacionesPage implements OnInit {
  readonly facade = inject(LiquidacionesFacade);

  placaBuscarModal: string = '';
  textoBuscar: string = '';

  ngOnInit(): void {
    this.facade.cargarLiquidaciones();
    this.facade.cargarKpis();
    this.textoBuscar = this.facade.buscar();
  }

  onBuscar(): void {
    this.facade.setBuscar(this.textoBuscar.trim());
  }

  onSimularDirecto(): void {
    if (!this.placaBuscarModal.trim()) return;
    this.facade.abrirSimulacion(this.placaBuscarModal.trim());
  }
}
