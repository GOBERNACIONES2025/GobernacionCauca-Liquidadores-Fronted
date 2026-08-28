import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { SlideOverComponent } from '../../../../shared/components/slide-over/slide-over';
import { TiposCalculoTarifaFacade } from '../../../../../application/facades/Tarifas/tipos-calculo-tarifa.facade';
import { TipoCalculoTarifa } from '../../../../../domain/models/Tarifas/tipo-calculo-tarifa.model';
import { ToastService } from '../../../../../../../core/services/toast.service';

@Component({
  selector: 'app-tipos-calculo-tarifa',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PageHeaderComponent, SlideOverComponent],
  templateUrl: './tipos-calculo-tarifa.html',
  styleUrl: './tipos-calculo-tarifa.css'
})
export class TiposCalculoTarifa implements OnInit {
  private fb = inject(FormBuilder);
  public facade = inject(TiposCalculoTarifaFacade);
  private toast = inject(ToastService);

  breadcrumbs = ['Configuración', 'Tarifas', 'Tipo de Cálculo de Tarifa'];

  searchQuery = signal<string>('');
  selectedFilter = signal<'todos' | 'activos' | 'inactivos'>('todos');

  isSlideOverOpen = false;
  selectedId: number | null = null;

  get isEditMode(): boolean {
    return this.selectedId !== null;
  }

  tipoCalculoForm = this.fb.group({
    codigo: ['', [Validators.required, Validators.maxLength(10)]],
    nombre: ['', Validators.required],
    activo: [true]
  });

  // Filtered list
  tiposCalculoFiltrados = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const filter = this.selectedFilter();
    let items = this.facade.tiposCalculoTarifa();

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
    const all = this.facade.tiposCalculoTarifa();
    return {
      total: all.length,
      active: all.filter(t => t.activo).length,
      inactive: all.filter(t => !t.activo).length
    };
  });

  ngOnInit() {
    this.facade.cargarTiposCalculoTarifa(1, 100);
  }

  setFilter(filter: 'todos' | 'activos' | 'inactivos') {
    this.selectedFilter.set(filter);
  }

  openNew() {
    this.selectedId = null;
    this.tipoCalculoForm.reset({ codigo: '', nombre: '', activo: true });
    this.isSlideOverOpen = true;
  }

  edit(item: TipoCalculoTarifa) {
    this.selectedId = item.id;
    this.tipoCalculoForm.patchValue({
      codigo: item.codigo,
      nombre: item.nombre,
      activo: item.activo
    });
    this.isSlideOverOpen = true;
  }

  toggleActivo(item: TipoCalculoTarifa) {
    const nuevoEstado = !item.activo;
    const actionName = nuevoEstado ? 'activado' : 'desactivado';

    this.facade.actualizar(item.id, {
      id: item.id,
      codigo: item.codigo,
      nombre: item.nombre,
      activo: nuevoEstado
    }).subscribe({
      next: () => {
        this.toast.success(`Tipo de cálculo ${actionName} exitosamente`);
        this.facade.cargarTiposCalculoTarifa(1, 100);
      },
      error: (err: any) => {
        this.toast.error(`Error al actualizar el tipo de cálculo`);
        console.error(err);
      }
    });
  }

  closeSlideOver() {
    this.isSlideOverOpen = false;
    this.selectedId = null;
  }

  saveTipoCalculo() {
    if (this.tipoCalculoForm.valid) {
      const val = this.tipoCalculoForm.value;
      const actionName = this.isEditMode ? 'actualizado' : 'creado';

      if (this.isEditMode) {
        this.facade.actualizar(this.selectedId!, {
          id: this.selectedId!,
          codigo: val.codigo!,
          nombre: val.nombre!,
          activo: val.activo ?? true
        }).subscribe({
          next: () => {
            this.toast.success(`Tipo de cálculo ${actionName} exitosamente`);
            this.closeSlideOver();
            this.facade.cargarTiposCalculoTarifa(1, 100);
          },
          error: (err: any) => {
            this.toast.error(`Error al actualizar el tipo de cálculo`);
            console.error(err);
          }
        });
      } else {
        this.facade.crear({
          codigo: val.codigo!,
          nombre: val.nombre!
        }).subscribe({
          next: () => {
            this.toast.success(`Tipo de cálculo ${actionName} exitosamente`);
            this.closeSlideOver();
            this.facade.cargarTiposCalculoTarifa(1, 100);
          },
          error: (err: any) => {
            this.toast.error(`Error al crear el tipo de cálculo`);
            console.error(err);
          }
        });
      }
    } else {
      this.tipoCalculoForm.markAllAsTouched();
    }
  }
}
