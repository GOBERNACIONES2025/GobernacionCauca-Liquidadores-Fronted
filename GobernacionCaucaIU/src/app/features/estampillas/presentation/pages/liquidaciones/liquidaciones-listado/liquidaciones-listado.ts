import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LiquidacionesFacade } from '../../../../application/facades/liquidaciones.facade';
import { PagosFacade } from '../../../../application/facades/pagos.facade';
import { ConfiguracionFacade } from '../../../../application/facades/configuracion.facade';
import { EstampillasBadgeComponent } from '../../../components/ui-badge/ui-badge.component';
import { RegistrarPagoModalComponent } from '../../../components/registrar-pago-modal/registrar-pago-modal.component';
import { EstampillasStorageService } from '../../../../infrastructure/storage/storage.service';
import { LiquidacionEstampilla, RegistroPagoRequest } from '../../../../domain/models/estampillas.models';

@Component({
  selector: 'app-liquidaciones-listado',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    EstampillasBadgeComponent,
    RegistrarPagoModalComponent
  ],
  templateUrl: './liquidaciones-listado.html'
})
export class LiquidacionesListadoComponent {
  readonly facade = inject(LiquidacionesFacade);
  readonly pagosFacade = inject(PagosFacade);
  readonly configFacade = inject(ConfiguracionFacade);
  readonly storage = inject(EstampillasStorageService);

  textoBusqueda = '';
  estadoSeleccionado = 'TODOS';
  vigenciaSeleccionada = 0;
  municipioSeleccionado = 'TODOS';
  fechaDesde = '';
  fechaHasta = '';

  onBuscar(): void {
    this.facade.setFiltroTexto(this.textoBusqueda);
  }

  onFiltrarEstado(): void {
    this.facade.setFiltroEstado(this.estadoSeleccionado);
  }

  onFiltrarVigencia(): void {
    this.facade.setFiltroVigencia(Number(this.vigenciaSeleccionada));
  }

  onFiltrarMunicipio(): void {
    this.facade.setFiltroMunicipio(this.municipioSeleccionado);
  }

  onFiltrarFechas(): void {
    this.facade.setFiltroFechas(this.fechaDesde, this.fechaHasta);
  }

  onLimpiar(): void {
    this.textoBusqueda = '';
    this.estadoSeleccionado = 'TODOS';
    this.vigenciaSeleccionada = 0;
    this.municipioSeleccionado = 'TODOS';
    this.fechaDesde = '';
    this.fechaHasta = '';
    this.facade.limpiarFiltros();
  }

  abrirModalPago(liq: LiquidacionEstampilla): void {
    this.pagosFacade.abrirModalRegistroPago(liq);
  }

  aplicarPago(req: RegistroPagoRequest): void {
    this.pagosFacade.registrarPago(req);
  }

  anular(liq: LiquidacionEstampilla): void {
    const motivo = prompt('Por favor ingrese el motivo administrativo de anulación de la liquidación:');
    if (motivo) {
      this.facade.anularLiquidacion(liq.id, motivo);
    }
  }

  exportarVisual(): void {
    window.print();
  }
}
