import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { SlideOverComponent } from '../../../../shared/components/slide-over/slide-over';
import { TiposBeneficiarioExencionFacade } from '../../../../../application/facades/Exenciones/tipos-beneficiario-exencion.facade';
import { TipoBeneficiarioExencion } from '../../../../../domain/models/Exenciones/tipo-beneficiario-exencion.model';
import { ToastService } from '../../../../../../../core/services/toast.service';

@Component({
  selector: 'app-tipos-beneficiario-exencion',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PageHeaderComponent, SlideOverComponent],
  templateUrl: './tipos-beneficiario-exencion.html',
  styleUrl: './tipos-beneficiario-exencion.css'
})
export class TiposBeneficiarioExencionComponent implements OnInit {
  private fb = inject(FormBuilder);
  public facade = inject(TiposBeneficiarioExencionFacade);
  private toast = inject(ToastService);

  breadcrumbs = ['Configuración', 'Exenciones', 'Tipo de Beneficiario de Exención'];

  searchQuery = signal<string>('');
  selectedFilter = signal<'todos' | 'activos' | 'inactivos'>('todos');

  isSlideOverOpen = false;
  selectedId: number | null = null;

  get isEditMode(): boolean {
    return this.selectedId !== null;
  }

  tipoBeneficiarioForm = this.fb.group({
    codigo: ['', [Validators.required, Validators.maxLength(10)]],
    nombre: ['', Validators.required],
    activo: [true]
  });

  // Filtered list
  tiposBeneficiarioFiltrados = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const filter = this.selectedFilter();
    let items = this.facade.tiposBeneficiario();

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
    const all = this.facade.tiposBeneficiario();
    return {
      total: all.length,
      active: all.filter(t => t.activo).length,
      inactive: all.filter(t => !t.activo).length
    };
  });

  ngOnInit() {
    this.facade.cargarTiposBeneficiario(1, 100);
  }

  setFilter(filter: 'todos' | 'activos' | 'inactivos') {
    this.selectedFilter.set(filter);
  }

  openNew() {
    this.selectedId = null;
    this.tipoBeneficiarioForm.reset({ codigo: '', nombre: '', activo: true });
    this.isSlideOverOpen = true;
  }

  edit(item: TipoBeneficiarioExencion) {
    this.selectedId = item.id;
    this.tipoBeneficiarioForm.patchValue({
      codigo: item.codigo,
      nombre: item.nombre,
      activo: item.activo
    });
    this.isSlideOverOpen = true;
  }

  toggleActivo(item: TipoBeneficiarioExencion) {
    const nuevoEstado = !item.activo;
    const actionName = nuevoEstado ? 'activado' : 'desactivado';

    this.facade.actualizar(item.id, {
      id: item.id,
      codigo: item.codigo,
      nombre: item.nombre,
      activo: nuevoEstado
    }).subscribe({
      next: () => {
        this.toast.success(`Tipo de beneficiario ${actionName} exitosamente`);
        this.facade.cargarTiposBeneficiario(1, 100);
      },
      error: (err: any) => {
        this.toast.error(`Error al actualizar el tipo de beneficiario`);
        console.error(err);
      }
    });
  }

  closeSlideOver() {
    this.isSlideOverOpen = false;
    this.selectedId = null;
  }

  saveTipoBeneficiario() {
    if (this.tipoBeneficiarioForm.valid) {
      const val = this.tipoBeneficiarioForm.value;
      const actionName = this.isEditMode ? 'actualizado' : 'creado';

      if (this.isEditMode) {
        this.facade.actualizar(this.selectedId!, {
          id: this.selectedId!,
          codigo: val.codigo!,
          nombre: val.nombre!,
          activo: val.activo ?? true
        }).subscribe({
          next: () => {
            this.toast.success(`Tipo de beneficiario ${actionName} exitosamente`);
            this.closeSlideOver();
            this.facade.cargarTiposBeneficiario(1, 100);
          },
          error: (err: any) => {
            this.toast.error(`Error al actualizar el tipo de beneficiario`);
            console.error(err);
          }
        });
      } else {
        this.facade.crear({
          codigo: val.codigo!,
          nombre: val.nombre!
        }).subscribe({
          next: () => {
            this.toast.success(`Tipo de beneficiario ${actionName} exitosamente`);
            this.closeSlideOver();
            this.facade.cargarTiposBeneficiario(1, 100);
          },
          error: (err: any) => {
            this.toast.error(`Error al crear el tipo de beneficiario`);
            console.error(err);
          }
        });
      }
    } else {
      this.tipoBeneficiarioForm.markAllAsTouched();
    }
  }
}
