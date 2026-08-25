import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { SlideOverComponent } from '../../../../shared/components/slide-over/slide-over';
import { EstadosLiquidacionFacade } from '../../../../../application/facades/Liquidacion/estados-liquidacion.facade';
import { EstadoLiquidacion } from '../../../../../domain/models/Liquidacion/estado-liquidacion.model';
import { ToastService } from '../../../../../../../core/services/toast.service';

@Component({
  selector: 'app-estados-liquidacion',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PageHeaderComponent, SlideOverComponent],
  templateUrl: './estados-liquidacion.html',
  styleUrl: './estados-liquidacion.css'
})
export class EstadosLiquidacion implements OnInit {
  private fb = inject(FormBuilder);
  public facade = inject(EstadosLiquidacionFacade);
  private toast = inject(ToastService);

  breadcrumbs = ['Configuración', 'Liquidación', 'Estados de Liquidación'];

  searchQuery = signal<string>('');
  selectedFilter = signal<'todos' | 'activos' | 'inactivos'>('todos');

  isSlideOverOpen = false;
  selectedId: number | null = null;

  get isEditMode(): boolean {
    return this.selectedId !== null;
  }

  estadoLiquidacionForm = this.fb.group({
    codigo: ['', [Validators.required, Validators.maxLength(10)]],
    nombre: ['', Validators.required],
    activo: [true]
  });

  // Filtered list
  estadosFiltrados = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const filter = this.selectedFilter();
    let items = this.facade.estadosLiquidacion();

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
    const all = this.facade.estadosLiquidacion();
    return {
      total: all.length,
      active: all.filter(e => e.activo).length,
      inactive: all.filter(e => !e.activo).length
    };
  });

  ngOnInit() {
    this.facade.cargarEstadosLiquidacion(1, 100);
  }

  setFilter(filter: 'todos' | 'activos' | 'inactivos') {
    this.selectedFilter.set(filter);
  }

  openNew() {
    this.selectedId = null;
    this.estadoLiquidacionForm.reset({ codigo: '', nombre: '', activo: true });
    this.isSlideOverOpen = true;
  }

  edit(item: EstadoLiquidacion) {
    this.selectedId = item.id;
    this.estadoLiquidacionForm.patchValue({
      codigo: item.codigo,
      nombre: item.nombre,
      activo: item.activo
    });
    this.isSlideOverOpen = true;
  }

  toggleActivo(item: EstadoLiquidacion) {
    const nuevoEstado = !item.activo;
    const actionName = nuevoEstado ? 'activado' : 'desactivado';

    this.facade.actualizar(item.id, {
      id: item.id,
      codigo: item.codigo,
      nombre: item.nombre,
      activo: nuevoEstado
    }).subscribe({
      next: () => {
        this.toast.success(`Estado de liquidación ${actionName} exitosamente`);
        this.facade.cargarEstadosLiquidacion(1, 100);
      },
      error: (err: any) => {
        this.toast.error(`Error al actualizar el estado de liquidación`);
        console.error(err);
      }
    });
  }

  closeSlideOver() {
    this.isSlideOverOpen = false;
    this.selectedId = null;
  }

  saveEstadoLiquidacion() {
    if (this.estadoLiquidacionForm.valid) {
      const val = this.estadoLiquidacionForm.value;
      const actionName = this.isEditMode ? 'actualizado' : 'creado';

      if (this.isEditMode) {
        this.facade.actualizar(this.selectedId!, {
          id: this.selectedId!,
          codigo: val.codigo!,
          nombre: val.nombre!,
          activo: val.activo ?? true
        }).subscribe({
          next: () => {
            this.toast.success(`Estado de liquidación ${actionName} exitosamente`);
            this.closeSlideOver();
            this.facade.cargarEstadosLiquidacion(1, 100);
          },
          error: (err: any) => {
            this.toast.error(`Error al actualizar el estado de liquidación`);
            console.error(err);
          }
        });
      } else {
        this.facade.crear({
          codigo: val.codigo!,
          nombre: val.nombre!
        }).subscribe({
          next: () => {
            this.toast.success(`Estado de liquidación ${actionName} exitosamente`);
            this.closeSlideOver();
            this.facade.cargarEstadosLiquidacion(1, 100);
          },
          error: (err: any) => {
            this.toast.error(`Error al crear el estado de liquidación`);
            console.error(err);
          }
        });
      }
    } else {
      this.estadoLiquidacionForm.markAllAsTouched();
    }
  }
}
