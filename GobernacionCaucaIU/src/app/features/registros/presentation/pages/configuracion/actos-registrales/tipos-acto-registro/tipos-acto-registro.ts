import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { SlideOverComponent } from '../../../../shared/components/slide-over/slide-over';
import { TiposActoRegistroFacade } from '../../../../../application/facades/Registro/tipos-acto-registro.facade';
import { CategoriasActoFacade } from '../../../../../application/facades/Registro/categorias-acto.facade';
import { NaturalezasActoFacade } from '../../../../../application/facades/Registro/naturalezas-acto.facade';
import { TipoActoRegistro } from '../../../../../domain/models/Registro/tipo-acto-registro.model';
import { ToastService } from '../../../../../../../core/services/toast.service';

@Component({
  selector: 'app-tipos-acto-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PageHeaderComponent, SlideOverComponent],
  templateUrl: './tipos-acto-registro.html',
  styleUrl: './tipos-acto-registro.css'
})
export class TiposActoRegistro implements OnInit {
  private fb = inject(FormBuilder);
  public facade = inject(TiposActoRegistroFacade);
  public categoriasFacade = inject(CategoriasActoFacade);
  public naturalezasFacade = inject(NaturalezasActoFacade);
  private toast = inject(ToastService);

  breadcrumbs = ['Configuración', 'Actos Registrales', 'Tipo de Acto de Registro'];

  searchQuery = signal<string>('');
  selectedFilter = signal<'todos' | 'activos' | 'inactivos'>('todos');

  isSlideOverOpen = false;
  selectedId: number | null = null;

  get isEditMode(): boolean {
    return this.selectedId !== null;
  }

  tipoActoForm = this.fb.group({
    categoriaActoId: [null as number | null, Validators.required],
    naturalezaActoId: [null as number | null, Validators.required],
    codigo: ['', [Validators.required, Validators.maxLength(20)]],
    nombre: ['', Validators.required],
    activo: [true]
  });

  // Filtered list for table
  tiposActoFiltrados = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const filter = this.selectedFilter();
    let items = this.facade.tiposActoRegistro();

    if (filter === 'activos') {
      items = items.filter(t => t.activo);
    } else if (filter === 'inactivos') {
      items = items.filter(t => !t.activo);
    }

    if (query) {
      items = items.filter(t => 
        t.codigo.toLowerCase().includes(query) ||
        t.nombre.toLowerCase().includes(query) ||
        (t.categoriaActo?.nombre && t.categoriaActo.nombre.toLowerCase().includes(query)) ||
        (t.naturalezaActo?.nombre && t.naturalezaActo.nombre.toLowerCase().includes(query))
      );
    }

    return items;
  });

  // Dynamic counts
  counts = computed(() => {
    const all = this.facade.tiposActoRegistro();
    return {
      total: all.length,
      active: all.filter(t => t.activo).length,
      inactive: all.filter(t => !t.activo).length
    };
  });

  ngOnInit() {
    this.facade.cargarTiposActoRegistro(1, 100);
    this.categoriasFacade.cargarCategoriasActo(1, 100);
    this.naturalezasFacade.cargarNaturalezasActo(1, 100);
  }

  setFilter(filter: 'todos' | 'activos' | 'inactivos') {
    this.selectedFilter.set(filter);
  }

  openNew() {
    this.selectedId = null;
    const primerCat = this.categoriasFacade.categoriasActo()[0]?.id || null;
    const primerNat = this.naturalezasFacade.naturalezasActo()[0]?.id || null;

    this.tipoActoForm.reset({
      categoriaActoId: primerCat,
      naturalezaActoId: primerNat,
      codigo: '',
      nombre: '',
      activo: true
    });
    this.isSlideOverOpen = true;
  }

  edit(item: TipoActoRegistro) {
    this.selectedId = item.id;
    this.tipoActoForm.patchValue({
      categoriaActoId: item.categoriaActo?.id || null,
      naturalezaActoId: item.naturalezaActo?.id || null,
      codigo: item.codigo,
      nombre: item.nombre,
      activo: item.activo
    });
    this.isSlideOverOpen = true;
  }

  toggleActivo(item: TipoActoRegistro) {
    const nuevoEstado = !item.activo;
    const actionName = nuevoEstado ? 'activado' : 'desactivado';

    this.facade.actualizar(item.id, {
      id: item.id,
      categoriaActoId: item.categoriaActo?.id || 1,
      naturalezaActoId: item.naturalezaActo?.id || 1,
      codigo: item.codigo,
      nombre: item.nombre,
      activo: nuevoEstado
    }).subscribe({
      next: () => {
        this.toast.success(`Tipo de acto ${actionName} exitosamente`);
        this.facade.cargarTiposActoRegistro(1, 100);
      },
      error: (err: any) => {
        this.toast.error(`Error al actualizar el tipo de acto`);
        console.error(err);
      }
    });
  }

  closeSlideOver() {
    this.isSlideOverOpen = false;
    this.selectedId = null;
  }

  saveTipoActo() {
    if (this.tipoActoForm.valid) {
      const val = this.tipoActoForm.value;
      const actionName = this.isEditMode ? 'actualizado' : 'creado';

      if (this.isEditMode) {
        this.facade.actualizar(this.selectedId!, {
          id: this.selectedId!,
          categoriaActoId: Number(val.categoriaActoId),
          naturalezaActoId: Number(val.naturalezaActoId),
          codigo: val.codigo!,
          nombre: val.nombre!,
          activo: val.activo ?? true
        }).subscribe({
          next: () => {
            this.toast.success(`Tipo de acto ${actionName} exitosamente`);
            this.closeSlideOver();
            this.facade.cargarTiposActoRegistro(1, 100);
          },
          error: (err: any) => {
            this.toast.error(`Error al actualizar el tipo de acto`);
            console.error(err);
          }
        });
      } else {
        this.facade.crear({
          categoriaActoId: Number(val.categoriaActoId),
          naturalezaActoId: Number(val.naturalezaActoId),
          codigo: val.codigo!,
          nombre: val.nombre!
        }).subscribe({
          next: () => {
            this.toast.success(`Tipo de acto ${actionName} exitosamente`);
            this.closeSlideOver();
            this.facade.cargarTiposActoRegistro(1, 100);
          },
          error: (err: any) => {
            this.toast.error(`Error al crear el tipo de acto`);
            console.error(err);
          }
        });
      }
    } else {
      this.tipoActoForm.markAllAsTouched();
    }
  }
}
