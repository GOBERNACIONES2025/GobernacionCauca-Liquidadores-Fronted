import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CatalogoVehicularFacade } from '../../../../application/facades/catalogo-vehicular.facade';
import { CatalogoTableViewComponent, TableColumn } from '../components/catalogo-table-view/catalogo-table-view';

@Component({
  selector: 'app-automotores-tipos-documento',
  standalone: true,
  imports: [CommonModule, CatalogoTableViewComponent],
  template: `
    <app-catalogo-table-view
      title="Tipos de Documento"
      category="Contribuyentes & Personas"
      subtitle="Tipos de identificación válidos para personas naturales y jurídicas"
      icon="fa-solid fa-address-card"
      [items]="facade.tiposDocumento()"
      [columns]="columns"
      [loading]="facade.loading()"
      (reload)="facade.cargarTodos()"
    />
  `
})
export class TiposDocumentoPage {
  public facade = inject(CatalogoVehicularFacade);

  columns: TableColumn[] = [
    { key: 'id', label: 'ID', type: 'code' },
    { key: 'codigo', label: 'Sigla / Código', type: 'code' },
    { key: 'nombre', label: 'Tipo de Documento', type: 'text' }
  ];
}
