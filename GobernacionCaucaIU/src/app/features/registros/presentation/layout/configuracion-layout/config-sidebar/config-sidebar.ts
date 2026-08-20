import { Component, signal, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

export interface CatalogItem {
  name: string;
  route?: string;
  count: number;
  hasWarning?: boolean;
}

export interface CatalogGroup {
  name: string;
  items: CatalogItem[];
}

@Component({
  selector: 'app-config-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './config-sidebar.html',
  styleUrl: './config-sidebar.css',
})
export class ConfigSidebar {
  readonly closeSidebar = output<void>();

  searchTerm = signal('');

  catalogGroups = signal<CatalogGroup[]>([
    {
      name: 'Territorio',
      items: [
        { name: 'Departamento', route: '/registros/configuracion/territorio/departamento', count: 5 },
        { name: 'Municipio', count: 3, hasWarning: true }
      ]
    },
    {
      name: 'Normatividad',
      items: [
        { name: 'Estado de Norma', count: 3 },
        { name: 'Tipo de Norma', count: 4 },
        { name: 'Vigencia', count: 3 }
      ]
    },
    {
      name: 'Entidades',
      items: [
        { name: 'Tipo de Entidad de Registro', count: 3 },
        { name: 'Entidad de Registro', count: 3, hasWarning: true }
      ]
    },
    {
      name: 'Actos Registrales',
      items: [
        { name: 'Categoría de Acto', count: 5 },
        { name: 'Naturaleza de Acto', count: 2 },
        { name: 'Tipo de Acto de Registro', count: 5, hasWarning: true }
      ]
    },
    {
      name: 'Tarifas',
      items: [
        { name: 'Tipo de Cálculo de Tarifa', count: 2 },
        { name: 'Tarifa', count: 3, hasWarning: true }
      ]
    },
    {
      name: 'Exenciones',
      items: [
        { name: 'Tipo de Beneficiario de Exención', count: 3 },
        { name: 'Exención', count: 2, hasWarning: true }
      ]
    },
    {
      name: 'Contribuyentes',
      items: [
        { name: 'Tipo de Persona', count: 2 },
        { name: 'Tipo de Documento', count: 5 }
      ]
    }
  ]);

  totalCount = computed(() => {
    return this.catalogGroups().reduce((acc, g) => acc + g.items.length, 0);
  });

  filteredGroups = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) return this.catalogGroups();

    return this.catalogGroups()
      .map(group => ({
        ...group,
        items: group.items.filter(item => 
          item.name.toLowerCase().includes(term) || group.name.toLowerCase().includes(term)
        )
      }))
      .filter(group => group.items.length > 0);
  });

  onItemClick() {
    this.closeSidebar.emit();
  }
}

