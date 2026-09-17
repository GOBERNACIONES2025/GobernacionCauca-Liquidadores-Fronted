import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ContratosFacade } from '../../../../application/facades/contratos.facade';
import { EstampillasBadgeComponent } from '../../../components/ui-badge/ui-badge.component';
import { EstampillasStorageService } from '../../../../infrastructure/storage/storage.service';
import { Contrato } from '../../../../domain/models/estampillas.models';

@Component({
  selector: 'app-contratos-listado',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, EstampillasBadgeComponent],
  templateUrl: './contratos-listado.html'
})
export class ContratosListadoComponent {
  readonly facade = inject(ContratosFacade);
  readonly storage = inject(EstampillasStorageService);

  textoBusqueda = '';
  tipoSeleccionado = 'TODOS';
  vigenciaSeleccionada = 0;
  estadoSeleccionado = 'TODOS';

  onBuscar(): void {
    this.facade.setFiltroTexto(this.textoBusqueda);
  }

  onFiltrarTipo(): void {
    this.facade.setFiltroTipoContrato(this.tipoSeleccionado);
  }

  onFiltrarVigencia(): void {
    this.facade.setFiltroVigencia(Number(this.vigenciaSeleccionada));
  }

  onFiltrarEstado(): void {
    this.facade.setFiltroEstado(this.estadoSeleccionado);
  }

  onLimpiar(): void {
    this.textoBusqueda = '';
    this.tipoSeleccionado = 'TODOS';
    this.vigenciaSeleccionada = 0;
    this.estadoSeleccionado = 'TODOS';
    this.facade.limpiarFiltros();
  }

  eliminar(ct: Contrato): void {
    if (confirm(`¿Está seguro de eliminar el contrato ${ct.numeroContrato}?`)) {
      this.facade.eliminarContrato(ct.id);
    }
  }

  exportarVisual(): void {
    window.print();
  }
}
