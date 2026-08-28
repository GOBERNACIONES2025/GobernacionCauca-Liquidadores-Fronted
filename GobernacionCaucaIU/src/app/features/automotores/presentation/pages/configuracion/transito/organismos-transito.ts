import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CatalogoVehicularFacade } from '../../../../application/facades/catalogo-vehicular.facade';
import { CatalogoTableViewComponent, TableColumn } from '../components/catalogo-table-view/catalogo-table-view';

@Component({
  selector: 'app-automotores-organismos-transito',
  standalone: true,
  imports: [CommonModule, CatalogoTableViewComponent],
  template: `
    <app-catalogo-table-view
      title="Organismos de Tránsito"
      category="Tránsito & Matrícula"
      subtitle="Secretarías e institutos de tránsito y transporte autorizados a nivel nacional"
      icon="fa-solid fa-building-shield"
      [items]="facade.organismosTransito()"
      [columns]="columns"
      [loading]="facade.loading()"
      (reload)="facade.cargarTodos()"
    />
  `
})
export class OrganismosTransitoPage {
  public facade = inject(CatalogoVehicularFacade);

  columns: TableColumn[] = [
    { key: 'id', label: 'ID Organismo', type: 'code' },
    { key: 'codigo', label: 'Código RUNT / MinTransporte', type: 'code' },
    { key: 'nombre', label: 'Nombre del Organismo de Tránsito', type: 'text' }
  ];
}
