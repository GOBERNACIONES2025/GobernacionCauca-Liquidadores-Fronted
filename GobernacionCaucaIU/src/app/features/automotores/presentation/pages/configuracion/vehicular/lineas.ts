import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CatalogoVehicularFacade } from '../../../../application/facades/catalogo-vehicular.facade';
import { CatalogoTableViewComponent, TableColumn } from '../components/catalogo-table-view/catalogo-table-view';

@Component({
  selector: 'app-automotores-lineas',
  standalone: true,
  imports: [CommonModule, CatalogoTableViewComponent],
  template: `
    <app-catalogo-table-view
      title="Líneas Oficiales"
      category="Especificaciones Vehiculares"
      subtitle="Catálogo de líneas y modelos con especificaciones técnicas por defecto"
      icon="fa-solid fa-list-ol"
      [items]="facade.lineas()"
      [columns]="columns"
      [loading]="facade.loading()"
      (reload)="facade.cargarTodos()"
    />
  `
})
export class LineasPage {
  public facade = inject(CatalogoVehicularFacade);

  columns: TableColumn[] = [
    { key: 'id', label: 'ID', type: 'code' },
    { key: 'nombre', label: 'Línea de Vehículo', type: 'text' },
    { key: 'marcaNombre', label: 'Marca', type: 'badge' },
    { key: 'clase', label: 'Clase', type: 'text' },
    { key: 'cilindraje', label: 'Cilindraje (cc)', type: 'code' },
    { key: 'combustible', label: 'Combustible', type: 'text' }
  ];
}
