import { Component, input, output, signal, computed, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { BreadcrumbComponent } from '../../../../../../../shared/components/breadcrumb/breadcrumb.component';

export interface TableColumn {
  key: string;
  label: string;
  type?: 'text' | 'badge' | 'number' | 'code';
}

@Component({
  selector: 'app-catalogo-table-view',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, BreadcrumbComponent],
  templateUrl: './catalogo-table-view.html',
  styleUrl: './catalogo-table-view.css'
})
export class CatalogoTableViewComponent {
  private router = inject(Router);
  private location = inject(Location);
  title = input.required<string>();
  subtitle = input<string>('Catálogo maestro del sistema tributario vehicular');
  category = input<string>('Configuración');
  icon = input<string>('fa-solid fa-list-check');
  items = input.required<any[]>();
  columns = input<TableColumn[]>([
    { key: 'id', label: 'ID', type: 'code' },
    { key: 'codigo', label: 'Código', type: 'code' },
    { key: 'nombre', label: 'Nombre / Descripción', type: 'text' }
  ]);
  loading = input<boolean>(false);

  reload = output<void>();

  searchQuery = signal<string>('');
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);

  filteredItems = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const list = this.items() || [];
    if (!query) return list;

    return list.filter(item => {
      return Object.values(item).some(val => 
        val !== null && val !== undefined && String(val).toLowerCase().includes(query)
      );
    });
  });

  totalPages = computed(() => {
    const total = this.filteredItems().length;
    const size = this.pageSize();
    return Math.ceil(total / size) || 1;
  });

  paginatedItems = computed(() => {
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    return this.filteredItems().slice(start, start + size);
  });

  onSearchChange(term: string) {
    this.searchQuery.set(term);
    this.currentPage.set(1);
  }

  goToPage(p: number) {
    if (p >= 1 && p <= this.totalPages()) {
      this.currentPage.set(p);
    }
  }

  onReload() {
    this.reload.emit();
  }

  onCategoryClick(): void {
    const cat = this.category().toLowerCase().trim();
    if (cat === 'territorio') {
      this.router.navigateByUrl('/automotores/configuracion/territorio/departamentos');
    } else if (cat === 'vehicular') {
      this.router.navigateByUrl('/automotores/configuracion/vehicular/clases');
    } else if (cat === 'tránsito' || cat === 'transito') {
      this.router.navigateByUrl('/automotores/configuracion/transito/estados-matricula');
    } else if (cat === 'contribuyentes') {
      this.router.navigateByUrl('/automotores/configuracion/contribuyentes/tipos-documento');
    } else if (cat === 'control') {
      this.router.navigateByUrl('/automotores/configuracion/control/pendientes-aprobacion');
    } else if (cat === 'valores estatales') {
      this.router.navigateByUrl('/automotores/configuracion/valores-estatales');
    } else {
      this.router.navigateByUrl('/automotores/configuracion');
    }
  }
}
