import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { SlideOverComponent } from '../../../../shared/components/slide-over/slide-over';
import { EstadosNormaFacade } from '../../../../../application/facades/Normatividad/estados-norma.facade';
import { EstadoNorma } from '../../../../../domain/models/Normatividad/estado-norma.model';
import { ToastService } from '../../../../../../../core/services/toast.service';

@Component({
  selector: 'app-estados-norma',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PageHeaderComponent, SlideOverComponent],
  templateUrl: './estados-norma.html',
  styleUrl: './estados-norma.css'
})
export class EstadosNorma implements OnInit {
  private fb = inject(FormBuilder);
  public facade = inject(EstadosNormaFacade);
  private toast = inject(ToastService);

  breadcrumbs = ['Configuración', 'Normatividad', 'Estado de Norma'];

  searchQuery = signal<string>('');
  selectedFilter = signal<'todos' | 'activos' | 'inactivos'>('todos');

  isSlideOverOpen = false;
  selectedId: number | null = null;

  get isEditMode(): boolean {
    return this.selectedId !== null;
  }

  estadoNormaForm = this.fb.group({
    codigo: ['', [Validators.required, Validators.maxLength(10)]],
    nombre: ['', Validators.required],
    activo: [true]
  });

  // Filtered list
  estadosNormaFiltrados = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const filter = this.selectedFilter();
    let items = this.facade.estadosNorma();

    if (filter === 'activos') {
      items = items.filter(e => e.activo);
    } else if (filter === 'inactivos') {
      items = items.filter(e => !e.activo);
    }

    if (query) {
      items = items.filter(e => 
        e.codigo.toLowerCase().includes(query) || 
        e.nombre.toLowerCase().includes(query)
      );
    }

    return items;
  });

  // Dynamic counts
  counts = computed(() => {
    const all = this.facade.estadosNorma();
    return {
      total: all.length,
      active: all.filter(e => e.activo).length,
      inactive: all.filter(e => !e.activo).length
    };
  });

  ngOnInit() {
    this.facade.cargarEstadosNorma(1, 100);
  }

  setFilter(filter: 'todos' | 'activos' | 'inactivos') {
    this.selectedFilter.set(filter);
  }

  openNew() {
    this.selectedId = null;
    this.estadoNormaForm.reset({ codigo: '', nombre: '', activo: true });
    this.isSlideOverOpen = true;
  }

  edit(item: EstadoNorma) {
    this.selectedId = item.id;
    this.estadoNormaForm.patchValue({
      codigo: item.codigo,
      nombre: item.nombre,
      activo: item.activo
    });
    this.isSlideOverOpen = true;
  }

  toggleActivo(item: EstadoNorma) {
    const nuevoEstado = !item.activo;
    const actionName = nuevoEstado ? 'activado' : 'desactivado';

    this.facade.actualizar(item.id, {
      id: item.id,
      codigo: item.codigo,
      nombre: item.nombre,
      activo: nuevoEstado
    }).subscribe({
      next: () => {
        this.toast.success(`Estado de norma ${actionName} exitosamente`);
        this.facade.cargarEstadosNorma(1, 100);
      },
      error: (err: any) => {
        this.toast.error(`Error al actualizar el estado de norma`);
        console.error(err);
      }
    });
  }

  closeSlideOver() {
    this.isSlideOverOpen = false;
    this.selectedId = null;
  }

  saveEstadoNorma() {
    if (this.estadoNormaForm.valid) {
      const val = this.estadoNormaForm.value;
      const actionName = this.isEditMode ? 'actualizado' : 'creado';

      if (this.isEditMode) {
        this.facade.actualizar(this.selectedId!, {
          id: this.selectedId!,
          codigo: val.codigo!,
          nombre: val.nombre!,
          activo: val.activo ?? true
        }).subscribe({
          next: () => {
            this.toast.success(`Estado de norma ${actionName} exitosamente`);
            this.closeSlideOver();
            this.facade.cargarEstadosNorma(1, 100);
          },
          error: (err: any) => {
            this.toast.error(`Error al actualizar el estado de norma`);
            console.error(err);
          }
        });
      } else {
        this.facade.crear({
          codigo: val.codigo!,
          nombre: val.nombre!
        }).subscribe({
          next: () => {
            this.toast.success(`Estado de norma ${actionName} exitosamente`);
            this.closeSlideOver();
            this.facade.cargarEstadosNorma(1, 100);
          },
          error: (err: any) => {
            this.toast.error(`Error al crear el estado de norma`);
            console.error(err);
          }
        });
      }
    } else {
      this.estadoNormaForm.markAllAsTouched();
    }
  }
}
