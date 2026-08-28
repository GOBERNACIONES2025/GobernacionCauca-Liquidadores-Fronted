import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogoVehicularFacade } from '../../../../application/facades/catalogo-vehicular.facade';
import { CatalogoTableViewComponent, TableColumn } from '../components/catalogo-table-view/catalogo-table-view';

@Component({
  selector: 'app-automotores-municipios',
  standalone: true,
  imports: [CommonModule, FormsModule, CatalogoTableViewComponent],
  template: `
    <div class="space-y-4">
      <!-- Selector de Departamento -->
      <div class="px-6 pt-4 max-w-7xl mx-auto">
        <div class="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-center space-x-3">
            <span class="text-xs font-semibold text-slate-700">Filtrar por Departamento:</span>
            <select
              [ngModel]="selectedDepartamentoId()"
              (ngModelChange)="onDepartamentoChange($event)"
              class="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600 font-medium"
            >
              @for (d of facade.departamentos(); track d.id) {
                <option [value]="d.id">{{ d.nombre }} (ID: {{ d.id }})</option>
              }
            </select>
          </div>
          <span class="text-xs text-slate-500">
            Mostrando municipios del departamento seleccionado
          </span>
        </div>
      </div>

      <app-catalogo-table-view
        title="Municipios y Ciudades"
        category="Territorio & Geografía"
        subtitle="Directorio de municipios para liquidación por jurisdicción y domicilio del contribuyente"
        icon="fa-solid fa-city"
        [items]="facade.municipios()"
        [columns]="columns"
        [loading]="facade.loading()"
        (reload)="onReload()"
      />
    </div>
  `
})
export class MunicipiosPage {
  public facade = inject(CatalogoVehicularFacade);

  selectedDepartamentoId = signal<number>(19); // 19 = Cauca por defecto

  columns: TableColumn[] = [
    { key: 'id', label: 'ID / Código DANE', type: 'code' },
    { key: 'nombre', label: 'Nombre del Municipio / Ciudad', type: 'text' },
    { key: 'departamentoId', label: 'ID Departamento', type: 'code' }
  ];

  onDepartamentoChange(id: number | string) {
    const numId = Number(id);
    this.selectedDepartamentoId.set(numId);
    this.facade.cargarCiudadesPorDepartamento(numId);
  }

  onReload() {
    this.facade.cargarCiudadesPorDepartamento(this.selectedDepartamentoId());
  }
}
