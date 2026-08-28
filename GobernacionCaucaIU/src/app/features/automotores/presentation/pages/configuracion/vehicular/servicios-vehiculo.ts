import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CatalogoVehicularFacade } from '../../../../application/facades/catalogo-vehicular.facade';
import { CatalogoTableViewComponent, TableColumn } from '../components/catalogo-table-view/catalogo-table-view';

@Component({
  selector: 'app-automotores-servicios-vehiculo',
  standalone: true,
  imports: [CommonModule, CatalogoTableViewComponent],
  template: `
    <app-catalogo-table-view
      title="Servicios Vehiculares"
      category="Especificaciones Vehiculares"
      subtitle="Modalidades de servicio vehicular (Particular, Público, Oficial, Diplomático, etc.)"
      icon="fa-solid fa-briefcase"
      [items]="facade.serviciosVehiculo()"
      [columns]="columns"
      [loading]="facade.loading()"
      (reload)="facade.cargarTodos()"
    />
  `
})
export class ServiciosVehiculoPage {
  public facade = inject(CatalogoVehicularFacade);

  columns: TableColumn[] = [
    { key: 'id', label: 'ID', type: 'code' },
    { key: 'codigo', label: 'Código', type: 'code' },
    { key: 'nombre', label: 'Servicio Vehicular', type: 'text' }
  ];
}
