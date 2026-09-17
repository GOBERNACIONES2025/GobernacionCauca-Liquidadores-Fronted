import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ContribuyentesFacade } from '../../../../application/facades/contribuyentes.facade';
import { ConfiguracionFacade } from '../../../../application/facades/configuracion.facade';
import { EstampillasBadgeComponent } from '../../../components/ui-badge/ui-badge.component';
import { EstampillasStorageService } from '../../../../infrastructure/storage/storage.service';
import { Contribuyente } from '../../../../domain/models/estampillas.models';

@Component({
  selector: 'app-contribuyentes-listado',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, EstampillasBadgeComponent],
  templateUrl: './contribuyentes-listado.html'
})
export class ContribuyentesListadoComponent {
  readonly facade = inject(ContribuyentesFacade);
  readonly configFacade = inject(ConfiguracionFacade);
  readonly storage = inject(EstampillasStorageService);

  textoBusqueda = '';
  tipoSeleccionado = 'TODOS';
  municipioSeleccionado = 'TODOS';
  estadoSeleccionado = 'TODOS';

  onBuscar(): void {
    this.facade.setFiltroTexto(this.textoBusqueda);
  }

  onFiltrarTipo(): void {
    this.facade.setFiltroTipoPersona(this.tipoSeleccionado);
  }

  onFiltrarMunicipio(): void {
    this.facade.setFiltroMunicipio(this.municipioSeleccionado);
  }

  onFiltrarEstado(): void {
    this.facade.setFiltroEstado(this.estadoSeleccionado);
  }

  onLimpiar(): void {
    this.textoBusqueda = '';
    this.tipoSeleccionado = 'TODOS';
    this.municipioSeleccionado = 'TODOS';
    this.estadoSeleccionado = 'TODOS';
    this.facade.limpiarFiltros();
  }

  eliminar(c: Contribuyente): void {
    if (confirm(`¿Está seguro de eliminar el contribuyente ${c.nombreCompleto}?`)) {
      this.facade.eliminarContribuyente(c.id);
    }
  }

  exportarVisual(): void {
    window.print();
  }
}
