import { Component, Input, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BreadcrumbService, BreadcrumbItem } from '../../../core/services/breadcrumb.service';

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.css'
})
export class BreadcrumbComponent {
  public breadcrumbService = inject(BreadcrumbService);

  /**
   * Opcional: Lista de migas si se desea forzar una específica,
   * de lo contrario se obtienen automáticamente del BreadcrumbService.
   */
  @Input() items?: BreadcrumbItem[];

  /**
   * Tema visual:
   * - 'dark': Ideal para barras superiores oscuras / azules (texto blanco / gris claro)
   * - 'light': Ideal para encabezados de página en fondo blanco o gris (texto gris oscuro / azul)
   */
  @Input() theme: 'light' | 'dark' = 'dark';

  /**
   * Mostrar icono de inicio en el primer elemento
   */
  @Input() showHomeIcon: boolean = false;

  /**
   * Lista reactiva de migas de pan calculadas
   */
  readonly breadcrumbs = computed(() => {
    if (this.items && this.items.length > 0) {
      return this.items;
    }
    return this.breadcrumbService.breadcrumbs();
  });

  onItemClick(crumb: BreadcrumbItem, index: number, event: MouseEvent): void {
    if (crumb.active) {
      event.preventDefault();
      return;
    }
    this.breadcrumbService.navigateTo(crumb, index);
  }
}
