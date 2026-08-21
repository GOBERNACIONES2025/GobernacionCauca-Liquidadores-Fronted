import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { SlideOverComponent } from '../../../../shared/components/slide-over/slide-over';
import { VigenciasFacade } from '../../../../../application/facades/Normatividad/vigencias.facade';
import { Vigencia } from '../../../../../domain/models/Normatividad/vigencia.model';
import { ToastService } from '../../../../../../../core/services/toast.service';

@Component({
  selector: 'app-vigencias',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PageHeaderComponent, SlideOverComponent],
  templateUrl: './vigencias.html',
  styleUrl: './vigencias.css'
})
export class Vigencias implements OnInit {
  private fb = inject(FormBuilder);
  public facade = inject(VigenciasFacade);
  private toast = inject(ToastService);

  breadcrumbs = ['Configuración', 'Normatividad', 'Vigencia'];

  searchQuery = signal<string>('');
  selectedFilter = signal<'todos' | 'activos' | 'inactivos'>('todos');

  isSlideOverOpen = false;
  selectedId: number | null = null;

  get isEditMode(): boolean {
    return this.selectedId !== null;
  }

  vigenciaForm = this.fb.group({
    anio: [new Date().getFullYear(), [Validators.required, Validators.min(1900), Validators.max(2100)]],
    fechaInicio: [`${new Date().getFullYear()}-01-01`, Validators.required],
    fechaFin: [`${new Date().getFullYear()}-12-31`, Validators.required],
    activo: [true]
  });

  // Filtered list
  vigenciasFiltradas = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const filter = this.selectedFilter();
    let items = this.facade.vigencias();

    if (filter === 'activos') {
      items = items.filter(v => v.activo);
    } else if (filter === 'inactivos') {
      items = items.filter(v => !v.activo);
    }

    if (query) {
      items = items.filter(v => 
        v.anio.toString().includes(query) ||
        (v.fechaInicio && v.fechaInicio.toLowerCase().includes(query)) ||
        (v.fechaFin && v.fechaFin.toLowerCase().includes(query))
      );
    }

    return items;
  });

  // Dynamic counts
  counts = computed(() => {
    const all = this.facade.vigencias();
    return {
      total: all.length,
      active: all.filter(v => v.activo).length,
      inactive: all.filter(v => !v.activo).length
    };
  });

  ngOnInit() {
    this.facade.cargarVigencias(1, 100);
  }

  setFilter(filter: 'todos' | 'activos' | 'inactivos') {
    this.selectedFilter.set(filter);
  }

  openNew() {
    this.selectedId = null;
    const year = new Date().getFullYear();
    this.vigenciaForm.reset({
      anio: year,
      fechaInicio: `${year}-01-01`,
      fechaFin: `${year}-12-31`,
      activo: true
    });
    this.isSlideOverOpen = true;
  }

  edit(item: Vigencia) {
    this.selectedId = item.id;
    const fInicio = item.fechaInicio ? item.fechaInicio.split('T')[0] : '';
    const fFin = item.fechaFin ? item.fechaFin.split('T')[0] : '';

    this.vigenciaForm.patchValue({
      anio: item.anio,
      fechaInicio: fInicio,
      fechaFin: fFin,
      activo: item.activo
    });
    this.isSlideOverOpen = true;
  }

  toggleActivo(item: Vigencia) {
    const nuevoEstado = !item.activo;
    const actionName = nuevoEstado ? 'activada' : 'desactivada';

    this.facade.actualizar(item.id, {
      id: item.id,
      anio: item.anio,
      fechaInicio: item.fechaInicio,
      fechaFin: item.fechaFin,
      activo: nuevoEstado
    }).subscribe({
      next: () => {
        this.toast.success(`Vigencia ${actionName} exitosamente`);
        this.facade.cargarVigencias(1, 100);
      },
      error: (err: any) => {
        this.toast.error(`Error al actualizar la vigencia`);
        console.error(err);
      }
    });
  }

  closeSlideOver() {
    this.isSlideOverOpen = false;
    this.selectedId = null;
  }

  saveVigencia() {
    if (this.vigenciaForm.valid) {
      const val = this.vigenciaForm.value;
      const actionName = this.isEditMode ? 'actualizada' : 'creada';

      if (this.isEditMode) {
        this.facade.actualizar(this.selectedId!, {
          id: this.selectedId!,
          anio: Number(val.anio),
          fechaInicio: val.fechaInicio!,
          fechaFin: val.fechaFin!,
          activo: val.activo ?? true
        }).subscribe({
          next: () => {
            this.toast.success(`Vigencia ${actionName} exitosamente`);
            this.closeSlideOver();
            this.facade.cargarVigencias(1, 100);
          },
          error: (err: any) => {
            this.toast.error(`Error al actualizar la vigencia`);
            console.error(err);
          }
        });
      } else {
        this.facade.crear({
          anio: Number(val.anio),
          fechaInicio: val.fechaInicio!,
          fechaFin: val.fechaFin!
        }).subscribe({
          next: () => {
            this.toast.success(`Vigencia ${actionName} exitosamente`);
            this.closeSlideOver();
            this.facade.cargarVigencias(1, 100);
          },
          error: (err: any) => {
            this.toast.error(`Error al crear la vigencia`);
            console.error(err);
          }
        });
      }
    } else {
      this.vigenciaForm.markAllAsTouched();
    }
  }
}
