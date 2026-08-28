import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CatalogoVehicularFacade } from '../../../../application/facades/catalogo-vehicular.facade';
import { CatalogoTableViewComponent, TableColumn } from '../components/catalogo-table-view/catalogo-table-view';

@Component({
  selector: 'app-automotores-departamentos',
  standalone: true,
  imports: [CommonModule, CatalogoTableViewComponent],
  template: `
    <app-catalogo-table-view
      title="Departamentos"
      category="Territorio & Geografía"
      subtitle="Catálogo oficial de departamentos territoriales para radicación y matrícula"
      icon="fa-solid fa-map-location-dot"
      [items]="facade.departamentos()"
      [columns]="columns"
      [loading]="facade.loading()"
      (reload)="facade.cargarTodos()"
    />
  `
})
export class DepartamentosPage {
  public facade = inject(CatalogoVehicularFacade);

  columns: TableColumn[] = [
    { key: 'id', label: 'ID DANE / Código', type: 'code' },
    { key: 'codigo', label: 'Código Postal / Ref', type: 'code' },
    { key: 'nombre', label: 'Nombre del Departamento', type: 'text' }
  ];
}
