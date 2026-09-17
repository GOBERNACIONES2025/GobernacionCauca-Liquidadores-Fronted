import { Component, input, output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ConfiguracionFacade } from '../../../application/facades/configuracion.facade';
import { LiquidacionesFacade } from '../../../application/facades/liquidaciones.facade';

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  route?: string;
  badge?: string;
  badgeColor?: string;
  roles?: string[];
  children?: {
    id: string;
    label: string;
    route: string;
    badge?: string;
  }[];
}

@Component({
  selector: 'app-estampillas-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './estampillas-sidebar.html',
  styleUrls: ['./estampillas-sidebar.css']
})
export class EstampillasSidebarComponent {
  readonly isCollapsed = input<boolean>(false);
  readonly toggleCollapse = output<void>();

  readonly configFacade = inject(ConfiguracionFacade);
  readonly liquidacionesFacade = inject(LiquidacionesFacade);

  // Secciones colapsables abiertas
  readonly openSections = signal<Record<string, boolean>>({
    estampillas: true,
    contribuyentes: true,
    contratos: false,
    pagos: false,
    reportes: false,
    administracion: false
  });

  toggleSection(sectionKey: string): void {
    const current = { ...this.openSections() };
    current[sectionKey] = !current[sectionKey];
    this.openSections.set(current);
  }

  isSectionOpen(sectionKey: string): boolean {
    return !!this.openSections()[sectionKey];
  }
}
