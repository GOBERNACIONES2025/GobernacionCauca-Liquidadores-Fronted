import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { SlideOverComponent } from '../../../../shared/components/slide-over/slide-over';
import { TiposNormaFacade } from '../../../../../application/facades/Normatividad/tipos-norma.facade';
import { TipoNorma } from '../../../../../domain/models/Normatividad/tipo-norma.model';
import { ToastService } from '../../../../../../../core/services/toast.service';

@Component({
  selector: 'app-tipos-norma',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PageHeaderComponent, SlideOverComponent],
  templateUrl: './tipos-norma.html',
  styleUrl: './tipos-norma.css'
})
export class TiposNorma implements OnInit {
  private fb = inject(FormBuilder);
  public facade = inject(TiposNormaFacade);
  private toast = inject(ToastService);

  breadcrumbs = ['Configuración', 'Normatividad', 'Tipo de Norma'];

  searchQuery = signal<string>('');
  selectedFilter = signal<'todos' | 'activos' | 'inactivos'>('todos');

  isSlideOverOpen = false;
  selectedId: number | null = null;

  get isEditMode(): boolean {
    return this.selectedId !== null;
  }

  tipoNormaForm = this.fb.group({
    codigo: ['', [Validators.required, Validators.maxLength(10)]],
    nombre: ['', Validators.required],
    activo: [true]
  });

  // Filtered list
  tiposNormaFiltrados = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const filter = this.selectedFilter();
    let items = this.facade.tiposNorma();

    if (filter === 'activos') {
      items = items.filter(t => t.activo);
    } else if (filter === 'inactivos') {
      items = items.filter(t => !t.activo);
    }

    if (query) {
      items = items.filter(t => 
        t.codigo.toLowerCase().includes(query) || 
        t.nombre.toLowerCase().includes(query)
      );
    }

    return items;
  });

  // Dynamic counts
  counts = computed(() => {
    const all = this.facade.tiposNorma();
    return {
      total: all.length,
      active: all.filter(t => t.activo).length,
      inactive: all.filter(t => !t.activo).length
    };
  });

  ngOnInit() {
    this.facade.cargarTiposNorma(1, 100);
  }

  setFilter(filter: 'todos' | 'activos' | 'inactivos') {
    this.selectedFilter.set(filter);
  }

  openNew() {
    this.selectedId = null;
    this.tipoNormaForm.reset({ codigo: '', nombre: '', activo: true });
    this.isSlideOverOpen = true;
  }

  edit(item: TipoNorma) {
    this.selectedId = item.id;
    this.tipoNormaForm.patchValue({
      codigo: item.codigo,
      nombre: item.nombre,
      activo: item.activo
    });
    this.isSlideOverOpen = true;
  }

  toggleActivo(item: TipoNorma) {
    const nuevoEstado = !item.activo;
    const actionName = nuevoEstado ? 'activado' : 'desactivado';

    this.facade.actualizar(item.id, {
      id: item.id,
      codigo: item.codigo,
      nombre: item.nombre,
      activo: nuevoEstado
    }).subscribe({
      next: () => {
        this.toast.success(`Tipo de norma ${actionName} exitosamente`);
        this.facade.cargarTiposNorma(1, 100);
      },
      error: (err: any) => {
        this.toast.error(`Error al actualizar el tipo de norma`);
        console.error(err);
      }
    });
  }

  closeSlideOver() {
    this.isSlideOverOpen = false;
    this.selectedId = null;
  }

  saveTipoNorma() {
    if (this.tipoNormaForm.valid) {
      const val = this.tipoNormaForm.value;
      const actionName = this.isEditMode ? 'actualizado' : 'creado';

      if (this.isEditMode) {
        this.facade.actualizar(this.selectedId!, {
          id: this.selectedId!,
          codigo: val.codigo!,
          nombre: val.nombre!,
          activo: val.activo ?? true
        }).subscribe({
          next: () => {
            this.toast.success(`Tipo de norma ${actionName} exitosamente`);
            this.closeSlideOver();
            this.facade.cargarTiposNorma(1, 100);
          },
          error: (err: any) => {
            this.toast.error(`Error al actualizar el tipo de norma`);
            console.error(err);
          }
        });
      } else {
        this.facade.crear({
          codigo: val.codigo!,
          nombre: val.nombre!
        }).subscribe({
          next: () => {
            this.toast.success(`Tipo de norma ${actionName} exitosamente`);
            this.closeSlideOver();
            this.facade.cargarTiposNorma(1, 100);
          },
          error: (err: any) => {
            this.toast.error(`Error al crear el tipo de norma`);
            console.error(err);
          }
        });
      }
    } else {
      this.tipoNormaForm.markAllAsTouched();
    }
  }
}
