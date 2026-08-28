import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { SlideOverComponent } from '../../../../shared/components/slide-over/slide-over';
import { NaturalezasActoFacade } from '../../../../../application/facades/Registro/naturalezas-acto.facade';
import { NaturalezaActo } from '../../../../../domain/models/Registro/naturaleza-acto.model';
import { ToastService } from '../../../../../../../core/services/toast.service';

@Component({
  selector: 'app-naturalezas-acto',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PageHeaderComponent, SlideOverComponent],
  templateUrl: './naturalezas-acto.html',
  styleUrl: './naturalezas-acto.css'
})
export class NaturalezasActo implements OnInit {
  private fb = inject(FormBuilder);
  public facade = inject(NaturalezasActoFacade);
  private toast = inject(ToastService);

  breadcrumbs = ['Configuración', 'Actos Registrales', 'Naturaleza de Acto'];

  searchQuery = signal<string>('');
  selectedFilter = signal<'todos' | 'activos' | 'inactivos'>('todos');

  isSlideOverOpen = false;
  selectedId: number | null = null;

  get isEditMode(): boolean {
    return this.selectedId !== null;
  }

  naturalezaForm = this.fb.group({
    codigo: ['', [Validators.required, Validators.maxLength(10)]],
    nombre: ['', Validators.required],
    descripcion: [''],
    activo: [true]
  });

  // Filtered list
  naturalezasFiltradas = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const filter = this.selectedFilter();
    let items = this.facade.naturalezasActo();

    if (filter === 'activos') {
      items = items.filter(n => n.activo);
    } else if (filter === 'inactivos') {
      items = items.filter(n => !n.activo);
    }

    if (query) {
      items = items.filter(n => 
        n.codigo.toLowerCase().includes(query) || 
        n.nombre.toLowerCase().includes(query) ||
        (n.descripcion && n.descripcion.toLowerCase().includes(query))
      );
    }

    return items;
  });

  // Dynamic counts
  counts = computed(() => {
    const all = this.facade.naturalezasActo();
    return {
      total: all.length,
      active: all.filter(n => n.activo).length,
      inactive: all.filter(n => !n.activo).length
    };
  });

  ngOnInit() {
    this.facade.cargarNaturalezasActo(1, 100);
  }

  setFilter(filter: 'todos' | 'activos' | 'inactivos') {
    this.selectedFilter.set(filter);
  }

  openNew() {
    this.selectedId = null;
    this.naturalezaForm.reset({ codigo: '', nombre: '', descripcion: '', activo: true });
    this.isSlideOverOpen = true;
  }

  edit(item: NaturalezaActo) {
    this.selectedId = item.id;
    this.naturalezaForm.patchValue({
      codigo: item.codigo,
      nombre: item.nombre,
      descripcion: item.descripcion || '',
      activo: item.activo
    });
    this.isSlideOverOpen = true;
  }

  toggleActivo(item: NaturalezaActo) {
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
        this.toast.success(`Naturaleza de acto ${actionName} exitosamente`);
        this.facade.cargarNaturalezasActo(1, 100);
      },
      error: (err: any) => {
        this.toast.error(`Error al actualizar la naturaleza de acto`);
        console.error(err);
      }
    });
  }

  closeSlideOver() {
    this.isSlideOverOpen = false;
    this.selectedId = null;
  }

  saveNaturaleza() {
    if (this.naturalezaForm.valid) {
      const val = this.naturalezaForm.value;
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
            this.toast.success(`Naturaleza de acto ${actionName} exitosamente`);
            this.closeSlideOver();
            this.facade.cargarNaturalezasActo(1, 100);
          },
          error: (err: any) => {
            this.toast.error(`Error al actualizar la naturaleza de acto`);
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
            this.toast.success(`Naturaleza de acto ${actionName} exitosamente`);
            this.closeSlideOver();
            this.facade.cargarNaturalezasActo(1, 100);
          },
          error: (err: any) => {
            this.toast.error(`Error al crear la naturaleza de acto`);
            console.error(err);
          }
        });
      }
    } else {
      this.naturalezaForm.markAllAsTouched();
    }
  }
}
