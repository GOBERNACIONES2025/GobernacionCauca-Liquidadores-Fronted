import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CatalogoVehicularFacade } from '../../../../application/facades/catalogo-vehicular.facade';
import { CatalogoTableViewComponent, TableColumn } from '../components/catalogo-table-view/catalogo-table-view';

@Component({
  selector: 'app-automotores-clases-vehiculo',
  standalone: true,
  imports: [CommonModule, CatalogoTableViewComponent],
  template: `
    <app-catalogo-table-view
      title="Clases de Vehículo"
      category="Especificaciones Vehiculares"
      subtitle="Clasificación general del automotor (Automóvil, Motocicleta, Campero, etc.)"
      icon="fa-solid fa-car"
      [items]="facade.clasesVehiculo()"
      [columns]="columns"
      [loading]="facade.loading()"
      (reload)="facade.cargarTodos()"
    />
  `
})
export class ClasesVehiculoPage {
  public facade = inject(CatalogoVehicularFacade);

  columns: TableColumn[] = [
    { key: 'id', label: 'ID', type: 'code' },
    { key: 'codigo', label: 'Código', type: 'code' },
    { key: 'nombre', label: 'Clase de Vehículo', type: 'text' }
  ];
}
