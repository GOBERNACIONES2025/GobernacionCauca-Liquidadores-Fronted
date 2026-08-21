import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { SlideOverComponent } from '../../../../shared/components/slide-over/slide-over';
import { TiposEntidadRegistroFacade } from '../../../../../application/facades/Registro/tipos-entidad-registro.facade';
import { TipoEntidadRegistro } from '../../../../../domain/models/Registro/tipo-entidad-registro.model';
import { ToastService } from '../../../../../../../core/services/toast.service';

@Component({
  selector: 'app-tipos-entidad-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PageHeaderComponent, SlideOverComponent],
  templateUrl: './tipos-entidad-registro.html',
  styleUrl: './tipos-entidad-registro.css'
})
export class TiposEntidadRegistro implements OnInit {
  private fb = inject(FormBuilder);
  public facade = inject(TiposEntidadRegistroFacade);
  private toast = inject(ToastService);

  breadcrumbs = ['Configuración', 'Entidades', 'Tipo de Entidad de Registro'];

  searchQuery = signal<string>('');
  selectedFilter = signal<'todos' | 'activos' | 'inactivos'>('todos');

  isSlideOverOpen = false;
  selectedId: number | null = null;

  get isEditMode(): boolean {
    return this.selectedId !== null;
  }

  tipoEntidadForm = this.fb.group({
    codigo: ['', [Validators.required, Validators.maxLength(10)]],
    nombre: ['', Validators.required],
    activo: [true]
  });

  // Filtered list
  tiposEntidadFiltrados = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const filter = this.selectedFilter();
    let items = this.facade.tiposEntidadRegistro();

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
    const all = this.facade.tiposEntidadRegistro();
    return {
      total: all.length,
      active: all.filter(t => t.activo).length,
      inactive: all.filter(t => !t.activo).length
    };
  });

  ngOnInit() {
    this.facade.cargarTiposEntidadRegistro(1, 100);
  }

  setFilter(filter: 'todos' | 'activos' | 'inactivos') {
    this.selectedFilter.set(filter);
  }

  openNew() {
    this.selectedId = null;
    this.tipoEntidadForm.reset({ codigo: '', nombre: '', activo: true });
    this.isSlideOverOpen = true;
  }

  edit(item: TipoEntidadRegistro) {
    this.selectedId = item.id;
    this.tipoEntidadForm.patchValue({
      codigo: item.codigo,
      nombre: item.nombre,
      activo: item.activo
    });
    this.isSlideOverOpen = true;
  }

  toggleActivo(item: TipoEntidadRegistro) {
    const nuevoEstado = !item.activo;
    const actionName = nuevoEstado ? 'activado' : 'desactivado';

    this.facade.actualizar(item.id, {
      id: item.id,
      codigo: item.codigo,
      nombre: item.nombre,
      activo: nuevoEstado
    }).subscribe({
      next: () => {
        this.toast.success(`Tipo de entidad ${actionName} exitosamente`);
        this.facade.cargarTiposEntidadRegistro(1, 100);
      },
      error: (err: any) => {
        this.toast.error(`Error al actualizar el tipo de entidad`);
        console.error(err);
      }
    });
  }

  closeSlideOver() {
    this.isSlideOverOpen = false;
    this.selectedId = null;
  }

  saveTipoEntidad() {
    if (this.tipoEntidadForm.valid) {
      const val = this.tipoEntidadForm.value;
      const actionName = this.isEditMode ? 'actualizado' : 'creado';

      if (this.isEditMode) {
        this.facade.actualizar(this.selectedId!, {
          id: this.selectedId!,
          codigo: val.codigo!,
          nombre: val.nombre!,
          activo: val.activo ?? true
        }).subscribe({
          next: () => {
            this.toast.success(`Tipo de entidad ${actionName} exitosamente`);
            this.closeSlideOver();
            this.facade.cargarTiposEntidadRegistro(1, 100);
          },
          error: (err: any) => {
            this.toast.error(`Error al actualizar el tipo de entidad`);
            console.error(err);
          }
        });
      } else {
        this.facade.crear({
          codigo: val.codigo!,
          nombre: val.nombre!
        }).subscribe({
          next: () => {
            this.toast.success(`Tipo de entidad ${actionName} exitosamente`);
            this.closeSlideOver();
            this.facade.cargarTiposEntidadRegistro(1, 100);
          },
          error: (err: any) => {
            this.toast.error(`Error al crear el tipo de entidad`);
            console.error(err);
          }
        });
      }
    } else {
      this.tipoEntidadForm.markAllAsTouched();
    }
  }
}
