import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CatalogoVehicularFacade } from '../../../../application/facades/catalogo-vehicular.facade';
import { CatalogoTableViewComponent, TableColumn } from '../components/catalogo-table-view/catalogo-table-view';

@Component({
  selector: 'app-automotores-naturalezas-juridicas',
  standalone: true,
  imports: [CommonModule, CatalogoTableViewComponent],
  template: `
    <app-catalogo-table-view
      title="Naturalezas Jurídicas"
      category="Contribuyentes & Personas"
      subtitle="Clasificación jurídica tributaria del contribuyente (Natural, Jurídica, Pública, etc.)"
      icon="fa-solid fa-scale-balanced"
      [items]="facade.naturalezasJuridicas()"
      [columns]="columns"
      [loading]="facade.loading()"
      (reload)="facade.cargarTodos()"
    />
  `
})
export class NaturalezasJuridicasPage {
  public facade = inject(CatalogoVehicularFacade);

  columns: TableColumn[] = [
    { key: 'id', label: 'ID', type: 'code' },
    { key: 'codigo', label: 'Código DIAN', type: 'code' },
    { key: 'nombre', label: 'Naturaleza Jurídica', type: 'text' }
  ];
}
