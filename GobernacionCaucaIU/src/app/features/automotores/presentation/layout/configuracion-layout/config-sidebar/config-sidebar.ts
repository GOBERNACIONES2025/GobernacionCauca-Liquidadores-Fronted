import { Component, inject, signal, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { filter } from 'rxjs/operators';
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
  icon?: string;
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
  private router = inject(Router);

  readonly closeSidebar = output<void>();

  searchTerm = signal('');
  expandedGroups = signal<Set<string>>(new Set<string>());

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.autoExpandActiveGroup(event.urlAfterRedirects || event.url);
    });

    setTimeout(() => {
      this.autoExpandActiveGroup(this.router.url);
    }, 100);
  }

  autoExpandActiveGroup(url: string) {
    if (!url) return;
    const groups = this.catalogGroups();
    for (const group of groups) {
      const hasActiveChild = group.items.some(item => item.route && url.includes(item.route));
      if (hasActiveChild) {
        this.expandedGroups.update(set => {
          const next = new Set(set);
          next.add(group.name);
          return next;
        });
        break;
      }
    }
  }

  catalogGroups = computed<CatalogGroup[]>(() => [
    {
      name: 'Territorio & Geografía',
      icon: 'map',
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
      icon: 'car',
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
      icon: 'clipboard-document-check',
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
      icon: 'user-group',
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
      icon: 'shield-check',
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

  isGroupExpanded(groupName: string): boolean {
    if (this.searchTerm().trim().length > 0) {
      return true;
    }
    return this.expandedGroups().has(groupName);
  }

  hasActiveChild(group: CatalogGroup): boolean {
    const currentUrl = this.router.url;
    return group.items.some(item => item.route && currentUrl.includes(item.route));
  }

  toggleGroup(groupName: string) {
    this.expandedGroups.update(set => {
      const next = new Set<string>();
      if (!set.has(groupName)) {
        next.add(groupName);
      }
      return next;
    });
  }

  expandAll() {
    const all = new Set(this.catalogGroups().map(g => g.name));
    this.expandedGroups.set(all);
  }

  collapseAll() {
    this.expandedGroups.set(new Set());
  }

  areAllExpanded(): boolean {
    const totalGroups = this.catalogGroups().length;
    return totalGroups > 0 && this.expandedGroups().size === totalGroups;
  }

  toggleAll() {
    if (this.areAllExpanded()) {
      this.collapseAll();
    } else {
      this.expandAll();
    }
  }

  onItemClick() {
    this.closeSidebar.emit();
  }
}
