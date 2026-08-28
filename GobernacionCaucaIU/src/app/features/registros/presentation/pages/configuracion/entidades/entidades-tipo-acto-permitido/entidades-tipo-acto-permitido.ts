import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaginationComponent } from '../../../../../../shared/components/pagination/pagination';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
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
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PageHeaderComponent, SlideOverComponent, PaginationComponent],
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

  searchText = signal<string>('');
  pageNumber = signal<number>(1);
  pageSize = signal<number>(10);

  constructor() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(query => {
      this.pageNumber.set(1);
      this.cargarItems();
    });
  }
  searchSubject = new Subject<string>();
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
  relacionesFiltradas = computed(() => this.facade.entidadesTipoActoPermitido());

  counts = computed(() => {
    return {
      total: this.facade.totalEntidadesTipoActoPermitido()
    };
  });

  ngOnInit() {
    this.cargarItems();
  }

  cargarItems() {
    let activo: boolean | undefined = undefined;
    if (this.selectedFilter && this.selectedFilter() === 'activos') activo = true;
    if (this.selectedFilter && this.selectedFilter() === 'inactivos') activo = false;
    this.facade.cargarEntidadesTipoActoPermitido(this.pageNumber(), this.pageSize());
  }

  onPageChange(page: number) {
    this.pageNumber.set(page);
    this.cargarItems();
  }

  onPageSizeChange(size: number) {
    this.pageSize.set(size);
    this.pageNumber.set(1);
    this.cargarItems();
  }

  onSearchChange(event: any) {
    const value = event.target.value;
    this.searchText.set(value);
    this.searchSubject.next(value);
  }

  setFilter(filter: 'todos' | 'activos' | 'inactivos') {
    this.selectedFilter.set(filter);
    this.pageNumber.set(1);
    this.cargarItems();
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
        this.cargarItems();
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
            this.cargarItems();
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
            this.cargarItems();
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
