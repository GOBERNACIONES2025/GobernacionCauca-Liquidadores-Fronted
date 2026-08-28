import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CatalogoVehicularFacade } from '../../../../application/facades/catalogo-vehicular.facade';
import { CatalogoTableViewComponent, TableColumn } from '../components/catalogo-table-view/catalogo-table-view';

@Component({
  selector: 'app-automotores-tipos-vehiculo',
  standalone: true,
  imports: [CommonModule, CatalogoTableViewComponent],
  template: `
    <app-catalogo-table-view
      title="Tipos de Vehículo"
      category="Especificaciones Vehiculares"
      subtitle="Tipologías vehiculares oficiales según resolución ministerial"
      icon="fa-solid fa-truck-pickup"
      [items]="facade.tiposVehiculo()"
      [columns]="columns"
      [loading]="facade.loading()"
      (reload)="facade.cargarTodos()"
    />
  `
})
export class TiposVehiculoPage {
  public facade = inject(CatalogoVehicularFacade);

  columns: TableColumn[] = [
    { key: 'id', label: 'ID', type: 'code' },
    { key: 'codigo', label: 'Código', type: 'code' },
    { key: 'nombre', label: 'Tipo de Vehículo', type: 'text' }
  ];
}
