import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { SlideOverComponent } from '../../../../shared/components/slide-over/slide-over';
import { EstadosSolicitudFacade } from '../../../../../application/facades/Radicacion/estados-solicitud.facade';
import { EstadoSolicitud } from '../../../../../domain/models/Radicacion/estado-solicitud.model';
import { ToastService } from '../../../../../../../core/services/toast.service';

@Component({
  selector: 'app-estados-solicitud',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PageHeaderComponent, SlideOverComponent],
  templateUrl: './estados-solicitud.html',
  styleUrl: './estados-solicitud.css'
})
export class EstadosSolicitud implements OnInit {
  private fb = inject(FormBuilder);
  public facade = inject(EstadosSolicitudFacade);
  private toast = inject(ToastService);

  breadcrumbs = ['Configuración', 'Radicación', 'Estados de Solicitud'];

  searchQuery = signal<string>('');
  selectedFilter = signal<'todos' | 'activos' | 'inactivos'>('todos');

  isSlideOverOpen = false;
  selectedId: number | null = null;

  get isEditMode(): boolean {
    return this.selectedId !== null;
  }

  estadoSolicitudForm = this.fb.group({
    codigo: ['', [Validators.required, Validators.maxLength(10)]],
    nombre: ['', Validators.required],
    activo: [true]
  });

  // Filtered list
  estadosFiltrados = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const filter = this.selectedFilter();
    let items = this.facade.estadosSolicitud();

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
    const all = this.facade.estadosSolicitud();
    return {
      total: all.length,
      active: all.filter(e => e.activo).length,
      inactive: all.filter(e => !e.activo).length
    };
  });

  ngOnInit() {
    this.facade.cargarEstadosSolicitud(1, 100);
  }

  setFilter(filter: 'todos' | 'activos' | 'inactivos') {
    this.selectedFilter.set(filter);
  }

  openNew() {
    this.selectedId = null;
    this.estadoSolicitudForm.reset({ codigo: '', nombre: '', activo: true });
    this.isSlideOverOpen = true;
  }

  edit(item: EstadoSolicitud) {
    this.selectedId = item.id;
    this.estadoSolicitudForm.patchValue({
      codigo: item.codigo,
      nombre: item.nombre,
      activo: item.activo
    });
    this.isSlideOverOpen = true;
  }

  toggleActivo(item: EstadoSolicitud) {
    const nuevoEstado = !item.activo;
    const actionName = nuevoEstado ? 'activado' : 'desactivado';

    this.facade.actualizar(item.id, {
      id: item.id,
      codigo: item.codigo,
      nombre: item.nombre,
      activo: nuevoEstado
    }).subscribe({
      next: () => {
        this.toast.success(`Estado de solicitud ${actionName} exitosamente`);
        this.facade.cargarEstadosSolicitud(1, 100);
      },
      error: (err: any) => {
        this.toast.error(`Error al actualizar el estado de solicitud`);
        console.error(err);
      }
    });
  }

  closeSlideOver() {
    this.isSlideOverOpen = false;
    this.selectedId = null;
  }

  saveEstadoSolicitud() {
    if (this.estadoSolicitudForm.valid) {
      const val = this.estadoSolicitudForm.value;
      const actionName = this.isEditMode ? 'actualizado' : 'creado';

      if (this.isEditMode) {
        this.facade.actualizar(this.selectedId!, {
          id: this.selectedId!,
          codigo: val.codigo!,
          nombre: val.nombre!,
          activo: val.activo ?? true
        }).subscribe({
          next: () => {
            this.toast.success(`Estado de solicitud ${actionName} exitosamente`);
            this.closeSlideOver();
            this.facade.cargarEstadosSolicitud(1, 100);
          },
          error: (err: any) => {
            this.toast.error(`Error al actualizar el estado de solicitud`);
            console.error(err);
          }
        });
      } else {
        this.facade.crear({
          codigo: val.codigo!,
          nombre: val.nombre!
        }).subscribe({
          next: () => {
            this.toast.success(`Estado de solicitud ${actionName} exitosamente`);
            this.closeSlideOver();
            this.facade.cargarEstadosSolicitud(1, 100);
          },
          error: (err: any) => {
            this.toast.error(`Error al crear el estado de solicitud`);
            console.error(err);
          }
        });
      }
    } else {
      this.estadoSolicitudForm.markAllAsTouched();
    }
  }
}
