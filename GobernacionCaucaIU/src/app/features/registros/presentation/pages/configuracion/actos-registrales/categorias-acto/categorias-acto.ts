import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { SlideOverComponent } from '../../../../shared/components/slide-over/slide-over';
import { CategoriasActoFacade } from '../../../../../application/facades/Registro/categorias-acto.facade';
import { CategoriaActo } from '../../../../../domain/models/Registro/categoria-acto.model';
import { ToastService } from '../../../../../../../core/services/toast.service';

@Component({
  selector: 'app-categorias-acto',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PageHeaderComponent, SlideOverComponent],
  templateUrl: './categorias-acto.html',
  styleUrl: './categorias-acto.css'
})
export class CategoriasActo implements OnInit {
  private fb = inject(FormBuilder);
  public facade = inject(CategoriasActoFacade);
  private toast = inject(ToastService);

  breadcrumbs = ['Configuración', 'Actos Registrales', 'Categoría de Acto'];

  searchQuery = signal<string>('');
  selectedFilter = signal<'todos' | 'activos' | 'inactivos'>('todos');

  isSlideOverOpen = false;
  selectedId: number | null = null;

  get isEditMode(): boolean {
    return this.selectedId !== null;
  }

  categoriaForm = this.fb.group({
    codigo: ['', [Validators.required, Validators.maxLength(10)]],
    nombre: ['', Validators.required],
    descripcion: [''],
    activo: [true]
  });

  // Filtered list
  categoriasFiltradas = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const filter = this.selectedFilter();
    let items = this.facade.categoriasActo();

    if (filter === 'activos') {
      items = items.filter(c => c.activo);
    } else if (filter === 'inactivos') {
      items = items.filter(c => !c.activo);
    }

    if (query) {
      items = items.filter(c => 
        c.codigo.toLowerCase().includes(query) || 
        c.nombre.toLowerCase().includes(query) ||
        (c.descripcion && c.descripcion.toLowerCase().includes(query))
      );
    }

    return items;
  });

  // Dynamic counts
  counts = computed(() => {
    const all = this.facade.categoriasActo();
    return {
      total: all.length,
      active: all.filter(c => c.activo).length,
      inactive: all.filter(c => !c.activo).length
    };
  });

  ngOnInit() {
    this.facade.cargarCategoriasActo(1, 100);
  }

  setFilter(filter: 'todos' | 'activos' | 'inactivos') {
    this.selectedFilter.set(filter);
  }

  openNew() {
    this.selectedId = null;
    this.categoriaForm.reset({ codigo: '', nombre: '', descripcion: '', activo: true });
    this.isSlideOverOpen = true;
  }

  edit(item: CategoriaActo) {
    this.selectedId = item.id;
    this.categoriaForm.patchValue({
      codigo: item.codigo,
      nombre: item.nombre,
      descripcion: item.descripcion || '',
      activo: item.activo
    });
    this.isSlideOverOpen = true;
  }

  toggleActivo(item: CategoriaActo) {
    const nuevoEstado = !item.activo;
    const actionName = nuevoEstado ? 'activada' : 'desactivada';

    this.facade.actualizar(item.id, {
      id: item.id,
      codigo: item.codigo,
      nombre: item.nombre,
      descripcion: item.descripcion || '',
      activo: nuevoEstado
    }).subscribe({
      next: () => {
        this.toast.success(`Categoría de acto ${actionName} exitosamente`);
        this.facade.cargarCategoriasActo(1, 100);
      },
      error: (err: any) => {
        this.toast.error(`Error al actualizar la categoría de acto`);
        console.error(err);
      }
    });
  }

  closeSlideOver() {
    this.isSlideOverOpen = false;
    this.selectedId = null;
  }

  saveCategoria() {
    if (this.categoriaForm.valid) {
      const val = this.categoriaForm.value;
      const actionName = this.isEditMode ? 'actualizada' : 'creada';

      if (this.isEditMode) {
        this.facade.actualizar(this.selectedId!, {
          id: this.selectedId!,
          codigo: val.codigo!,
          nombre: val.nombre!,
          descripcion: val.descripcion || '',
          activo: val.activo ?? true
        }).subscribe({
          next: () => {
            this.toast.success(`Categoría de acto ${actionName} exitosamente`);
            this.closeSlideOver();
            this.facade.cargarCategoriasActo(1, 100);
          },
          error: (err: any) => {
            this.toast.error(`Error al actualizar la categoría de acto`);
            console.error(err);
          }
        });
      } else {
        this.facade.crear({
          codigo: val.codigo!,
          nombre: val.nombre!,
          descripcion: val.descripcion || ''
        }).subscribe({
          next: () => {
            this.toast.success(`Categoría de acto ${actionName} exitosamente`);
            this.closeSlideOver();
            this.facade.cargarCategoriasActo(1, 100);
          },
          error: (err: any) => {
            this.toast.error(`Error al crear la categoría de acto`);
            console.error(err);
          }
        });
      }
    } else {
      this.categoriaForm.markAllAsTouched();
    }
  }
}
