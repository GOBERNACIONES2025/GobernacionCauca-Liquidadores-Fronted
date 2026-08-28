import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CatalogoVehicularFacade } from '../../../../application/facades/catalogo-vehicular.facade';
import { CatalogoTableViewComponent, TableColumn } from '../components/catalogo-table-view/catalogo-table-view';

@Component({
  selector: 'app-automotores-marcas',
  standalone: true,
  imports: [CommonModule, CatalogoTableViewComponent],
  template: `
    <app-catalogo-table-view
      title="Marcas Oficiales"
      category="Especificaciones Vehiculares"
      subtitle="Catálogo de marcas automotrices homologadas por el Ministerio de Transporte"
      icon="fa-solid fa-tags"
      [items]="facade.marcas()"
      [columns]="columns"
      [loading]="facade.loading()"
      (reload)="facade.cargarTodos()"
    />
  `
})
export class MarcasPage {
  public facade = inject(CatalogoVehicularFacade);

  columns: TableColumn[] = [
    { key: 'id', label: 'ID Marca', type: 'code' },
    { key: 'codigo', label: 'Código', type: 'code' },
    { key: 'nombre', label: 'Marca Oficial', type: 'text' }
  ];
}
