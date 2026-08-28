import { Component, inject, signal, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CatalogoVehicularFacade } from '../../../../application/facades/catalogo-vehicular.facade';

export interface CatalogItem {
  name: string;
  route?: string;
  count?: number;
  hasWarning?: boolean;
  badge?: string;
}

export interface CatalogGroup {
  name: string;
  items: CatalogItem[];
}

@Component({
  selector: 'app-automotores-config-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './config-sidebar.html',
  styleUrl: './config-sidebar.css',
})
export class AutomotoresConfigSidebar {
  public facade = inject(CatalogoVehicularFacade);

  readonly closeSidebar = output<void>();

  searchTerm = signal('');

  catalogGroups = computed<CatalogGroup[]>(() => [
    {
      name: 'Territorio & Geografía',
      items: [
        {
          name: 'Departamentos',
          route: '/automotores/configuracion/territorio/departamentos',
          count: this.facade.departamentos().length
        },
        {
          name: 'Municipios',
          route: '/automotores/configuracion/territorio/municipios',
          count: this.facade.municipios().length,
          hasWarning: true
        }
      ]
    },
    {
      name: 'Especificaciones Vehiculares',
      items: [
        {
          name: 'Clases de Vehículo',
          route: '/automotores/configuracion/vehicular/clases',
          count: this.facade.clasesVehiculo().length
        },
        {
          name: 'Tipos de Vehículo',
          route: '/automotores/configuracion/vehicular/tipos',
          count: this.facade.tiposVehiculo().length
        },
        {
          name: 'Marcas Oficiales',
          route: '/automotores/configuracion/vehicular/marcas',
          count: this.facade.marcas().length
        },
        {
          name: 'Líneas Oficiales',
          route: '/automotores/configuracion/vehicular/lineas',
          count: this.facade.lineas().length,
          hasWarning: true
        },
        {
          name: 'Tipos de Combustible',
          route: '/automotores/configuracion/vehicular/combustibles',
          count: this.facade.combustibles().length
        },
        {
          name: 'Servicios Vehiculares',
          route: '/automotores/configuracion/vehicular/servicios',
          count: this.facade.serviciosVehiculo().length
        }
      ]
    },
    {
      name: 'Tránsito & Matrícula',
      items: [
        {
          name: 'Estados de Matrícula',
          route: '/automotores/configuracion/transito/estados-matricula',
          count: this.facade.estadosMatricula().length
        },
        {
          name: 'Organismos de Tránsito',
          route: '/automotores/configuracion/transito/organismos-transito',
          count: this.facade.organismosTransito().length
        },
        {
          name: 'Tipos de Vínculo',
          route: '/automotores/configuracion/transito/tipos-vinculo',
          count: this.facade.tiposVinculo().length
        }
      ]
    },
    {
      name: 'Contribuyentes & Personas',
      items: [
        {
          name: 'Tipos de Documento',
          route: '/automotores/configuracion/contribuyentes/tipos-documento',
          count: this.facade.tiposDocumento().length
        },
        {
          name: 'Naturalezas Jurídicas',
          route: '/automotores/configuracion/contribuyentes/naturalezas-juridicas',
          count: this.facade.naturalezasJuridicas().length
        },
        {
          name: 'Directorio de Propietarios',
          route: '/automotores/contribuyentes-index',
          count: this.facade.totalPropietarios()
        }
      ]
    },
    {
      name: 'Control & Auditoría',
      items: [
        {
          name: 'Pendientes por Aprobación',
          route: '/automotores/configuracion/control/pendientes-aprobacion',
          count: this.facade.pendientesAprobacion().length,
          hasWarning: this.facade.pendientesAprobacion().length > 0
        }
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
