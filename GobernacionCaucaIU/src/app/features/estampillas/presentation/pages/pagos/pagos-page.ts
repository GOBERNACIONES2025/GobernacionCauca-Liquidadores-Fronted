import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PagosFacade } from '../../../application/facades/pagos.facade';
import { EstampillasStorageService } from '../../../infrastructure/storage/storage.service';
import { EstampillasBadgeComponent } from '../../components/ui-badge/ui-badge.component';
import { RegistrarPagoModalComponent } from '../../components/registrar-pago-modal/registrar-pago-modal.component';
import { LiquidacionEstampilla, RegistroPagoRequest } from '../../../domain/models/estampillas.models';

@Component({
  selector: 'app-pagos-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    EstampillasBadgeComponent,
    RegistrarPagoModalComponent
  ],
  templateUrl: './pagos-page.html'
})
export class PagosPageComponent {
  readonly facade = inject(PagosFacade);
  readonly storage = inject(EstampillasStorageService);

  textoBusqueda = '';
  medioSeleccionado = 'TODOS';
  fechaDesde = '';
  fechaHasta = '';

  onBuscar(): void {
    this.facade.setFiltroTexto(this.textoBusqueda);
  }

  onFiltrarMedio(): void {
    this.facade.setFiltroMedioPago(this.medioSeleccionado);
  }

  onFiltrarFechas(): void {
    this.facade.setFiltroFechas(this.fechaDesde, this.fechaHasta);
  }

  onLimpiar(): void {
    this.textoBusqueda = '';
    this.medioSeleccionado = 'TODOS';
    this.fechaDesde = '';
    this.fechaHasta = '';
    this.facade.setFiltroTexto('');
    this.facade.setFiltroMedioPago('TODOS');
    this.facade.setFiltroFechas('', '');
  }

  abrirModalPago(liq: LiquidacionEstampilla): void {
    this.facade.abrirModalRegistroPago(liq);
  }

  aplicarPago(req: RegistroPagoRequest): void {
    this.facade.registrarPago(req);
  }

  exportar(): void {
    window.print();
  }
}
