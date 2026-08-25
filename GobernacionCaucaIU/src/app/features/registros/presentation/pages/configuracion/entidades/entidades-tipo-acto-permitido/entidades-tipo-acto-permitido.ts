import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { SlideOverComponent } from '../../../../shared/components/slide-over/slide-over';
import { EntidadesTipoActoPermitidoFacade } from '../../../../../application/facades/Registro/entidades-tipo-acto-permitido.facade';
import { EntidadesRegistroFacade } from '../../../../../application/facades/Registro/entidades-registro.facade';
import { TiposActoRegistroFacade } from '../../../../../application/facades/Registro/tipos-acto-registro.facade';
import { EntidadTipoActoPermitido } from '../../../../../domain/models/Registro/entidad-tipo-acto-permitido.model';
import { ToastService } from '../../../../../../../core/services/toast.service';

@Component({
  selector: 'app-entidades-tipo-acto-permitido',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PageHeaderComponent, SlideOverComponent],
  templateUrl: './entidades-tipo-acto-permitido.html',
  styleUrl: './entidades-tipo-acto-permitido.css'
})
export class EntidadesTipoActoPermitidoComponent implements OnInit {
  private fb = inject(FormBuilder);
  public facade = inject(EntidadesTipoActoPermitidoFacade);
  public entidadesFacade = inject(EntidadesRegistroFacade);
  public tiposActoFacade = inject(TiposActoRegistroFacade);
  private toast = inject(ToastService);

  breadcrumbs = ['Configuración', 'Entidades', 'Actos Permitidos por Entidad'];

  searchQuery = signal<string>('');
  selectedFilter = signal<'todos' | 'activos' | 'inactivos'>('todos');
  selectedEntidadFilter = signal<number | 'todas'>('todas');

  isSlideOverOpen = false;
  selectedId: number | null = null;

  get isEditMode(): boolean {
    return this.selectedId !== null;
  }

  relacionForm = this.fb.group({
    entidadRegistroId: [null as number | null, Validators.required],
    tipoActoRegistroId: [null as number | null, Validators.required],
    activo: [true]
  });

  // Filtered list
  relacionesFiltradas = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const filter = this.selectedFilter();
    const entidadFilter = this.selectedEntidadFilter();
    let items = this.facade.entidadesTipoActoPermitido();

    if (filter === 'activos') {
      items = items.filter(r => r.activo);
    } else if (filter === 'inactivos') {
      items = items.filter(r => !r.activo);
    }

    if (entidadFilter !== 'todas') {
      items = items.filter(r => r.entidadRegistro?.id === entidadFilter);
    }

    if (query) {
      items = items.filter(r => 
        r.entidadRegistro?.nombre?.toLowerCase().includes(query) || 
        r.tipoActoRegistro?.nombre?.toLowerCase().includes(query) ||
        r.tipoActoRegistro?.codigo?.toLowerCase().includes(query)
      );
    }

    return items;
  });

  counts = computed(() => {
    const all = this.facade.entidadesTipoActoPermitido();
    return {
      total: all.length,
      active: all.filter(r => r.activo).length,
      inactive: all.filter(r => !r.activo).length
    };
  });

  ngOnInit() {
    this.facade.cargarEntidadesTipoActoPermitido(1, 100);
    this.entidadesFacade.cargarEntidadesRegistro(1, 100);
    this.tiposActoFacade.cargarTiposActoRegistro(1, 100);
  }

  setFilter(filter: 'todos' | 'activos' | 'inactivos') {
    this.selectedFilter.set(filter);
  }

  setEntidadFilter(filter: number | 'todas') {
    this.selectedEntidadFilter.set(filter);
  }

  openNew() {
    this.selectedId = null;
    const defaultEntidad = this.entidadesFacade.entidadesRegistro()[0]?.id || null;
    const defaultActo = this.tiposActoFacade.tiposActoRegistro()[0]?.id || null;

    this.relacionForm.reset({
      entidadRegistroId: defaultEntidad,
      tipoActoRegistroId: defaultActo,
      activo: true
    });
    this.isSlideOverOpen = true;
  }

  edit(item: EntidadTipoActoPermitido) {
    this.selectedId = item.id;
    this.relacionForm.patchValue({
      entidadRegistroId: item.entidadRegistro?.id ?? null,
      tipoActoRegistroId: item.tipoActoRegistro?.id ?? null,
      activo: item.activo
    });
    this.isSlideOverOpen = true;
  }

  toggleActivo(item: EntidadTipoActoPermitido) {
    const nuevoEstado = !item.activo;
    const actionName = nuevoEstado ? 'activada' : 'desactivada';

    this.facade.actualizar(item.id, {
      id: item.id,
      entidadRegistroId: item.entidadRegistro?.id ?? 0,
      tipoActoRegistroId: item.tipoActoRegistro?.id ?? 0,
      activo: nuevoEstado
    }).subscribe({
      next: () => {
        this.toast.success(`Relación ${actionName} exitosamente`);
        this.facade.cargarEntidadesTipoActoPermitido(1, 100);
      },
      error: (err: any) => {
        this.toast.error(`Error al actualizar la relación`);
        console.error(err);
      }
    });
  }

  closeSlideOver() {
    this.isSlideOverOpen = false;
    this.selectedId = null;
  }

  saveRelacion() {
    if (this.relacionForm.valid) {
      const val = this.relacionForm.value;
      const actionName = this.isEditMode ? 'actualizada' : 'creada';

      if (this.isEditMode) {
        this.facade.actualizar(this.selectedId!, {
          id: this.selectedId!,
          entidadRegistroId: Number(val.entidadRegistroId),
          tipoActoRegistroId: Number(val.tipoActoRegistroId),
          activo: val.activo ?? true
        }).subscribe({
          next: () => {
            this.toast.success(`Relación ${actionName} exitosamente`);
            this.closeSlideOver();
            this.facade.cargarEntidadesTipoActoPermitido(1, 100);
          },
          error: (err: any) => {
            this.toast.error(`Error al actualizar la relación`);
            console.error(err);
          }
        });
      } else {
        this.facade.crear({
          entidadRegistroId: Number(val.entidadRegistroId),
          tipoActoRegistroId: Number(val.tipoActoRegistroId)
        }).subscribe({
          next: () => {
            this.toast.success(`Relación ${actionName} exitosamente`);
            this.closeSlideOver();
            this.facade.cargarEntidadesTipoActoPermitido(1, 100);
          },
          error: (err: any) => {
            this.toast.error(`Error al crear la relación`);
            console.error(err);
          }
        });
      }
    } else {
      this.relacionForm.markAllAsTouched();
    }
  }
}
