import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaginationComponent } from '../../../../../../shared/components/pagination/pagination';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { TableSearchComponent } from '../../../../shared/components/table-search/table-search';
import { SlideOverComponent } from '../../../../shared/components/slide-over/slide-over';
import { TiposCalculoTarifaFacade } from '../../../../../application/facades/Tarifas/tipos-calculo-tarifa.facade';
import { TipoCalculoTarifa } from '../../../../../domain/models/Tarifas/tipo-calculo-tarifa.model';
import { TiposCalculoTarifaApiService } from '../../../../../infrastructure/api/Tarifas/tipos-calculo-tarifa-api.service';
import { ToastService } from '../../../../../../../core/services/toast.service';

import { FormFieldErrorComponent } from '../../../../../../shared/components/form-error/form-error.component';
import { ConfirmModalComponent } from '../../../../shared/components/confirm-modal/confirm-modal.component';
import { formatUserErrorMessage } from '../../../../shared/utils/error-formatter.util';

@Component({
  selector: 'app-tipos-calculo-tarifa',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PageHeaderComponent, TableSearchComponent, SlideOverComponent, PaginationComponent, FormFieldErrorComponent, ConfirmModalComponent],
  templateUrl: './tipos-calculo-tarifa.html',
  styleUrl: './tipos-calculo-tarifa.css'
})
export class TiposCalculoTarifa implements OnInit {
  private fb = inject(FormBuilder);
  public facade = inject(TiposCalculoTarifaFacade);
  public apiService = inject(TiposCalculoTarifaApiService);
  private toast = inject(ToastService);

  breadcrumbs = ['Configuración', 'Tarifas', 'Tipo de Cálculo de Tarifa'];

  searchText = signal<string>('');
  pageNumber = signal<number>(1);
  pageSize = signal<number>(10);
  loadingEditId = signal<number | null>(null);
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
  tiposCalculoFiltrados = computed(() => this.facade.tiposCalculoTarifa());

  // Dynamic counts
  counts = computed(() => {
    return {
      total: this.facade.totalTiposCalculoTarifa()
    };
  });

  ngOnInit() {
    this.cargarItems();
  }

  cargarItems() {
    let activo: boolean | undefined = undefined;
    if (this.selectedFilter && this.selectedFilter() === 'activos') activo = true;
    if (this.selectedFilter && this.selectedFilter() === 'inactivos') activo = false;
    this.facade.cargarTiposCalculoTarifa(this.pageNumber(), this.pageSize(), this.searchText(), activo);
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

  onSearch(term: string) {
    this.searchText.set(term);
    this.pageNumber.set(1);
    this.cargarItems();
  }

  onClearSearch() {
    this.searchText.set('');
    this.pageNumber.set(1);
    this.cargarItems();
  }

  setFilter(filter: 'todos' | 'activos' | 'inactivos') {
    this.selectedFilter.set(filter);
    this.pageNumber.set(1);
    this.cargarItems();
  }

  

  openNew() {
    this.selectedId = null;
    this.tipoCalculoForm.reset({ codigo: '', nombre: '', activo: true });
    this.isSlideOverOpen = true;
  }

  edit(item: TipoCalculoTarifa) {
    this.loadingEditId.set(item.id);
    this.apiService.obtenerPorId(item.id).subscribe({
      next: (res) => {
        this.loadingEditId.set(null);
        const data = res?.data || item;
        this.selectedId = data.id;
        this.tipoCalculoForm.patchValue({
          codigo: data.codigo,
          nombre: data.nombre,
          activo: data.activo
        });
        this.isSlideOverOpen = true;
      },
      error: (err) => {
        this.loadingEditId.set(null);
        this.toast.error('Error al obtener la información del tipo de cálculo');
        console.error(err);
      }
    });
  }

  // Smart Confirmation Modal State (Criteria 6, 10 & 16)
  isConfirmModalOpen = signal<boolean>(false);
  itemToToggle = signal<TipoCalculoTarifa | null>(null);
  isTogglingStatus = signal<boolean>(false);

  promptToggleActivo(item: TipoCalculoTarifa) {
    this.itemToToggle.set(item);
    this.isConfirmModalOpen.set(true);
  }

  cancelToggleActivo() {
    this.isConfirmModalOpen.set(false);
    this.itemToToggle.set(null);
  }

  executeToggleActivo() {
    const item = this.itemToToggle();
    if (!item) return;

    const nuevoEstado = !item.activo;
    const actionName = nuevoEstado ? 'activado' : 'desactivado';
    this.isTogglingStatus.set(true);

    this.facade.actualizar(item.id, {
      id: item.id,
      codigo: item.codigo,
      nombre: item.nombre,
      activo: nuevoEstado
    }).subscribe({
      next: () => {
        this.isTogglingStatus.set(false);
        this.isConfirmModalOpen.set(false);
        this.itemToToggle.set(null);
        this.toast.success(`Tipo de cálculo "${item.nombre}" ${actionName} exitosamente`);
        this.cargarItems();
      },
      error: (err: any) => {
        this.isTogglingStatus.set(false);
        this.toast.error(formatUserErrorMessage(err, `actualizar estado del tipo de cálculo "${item.nombre}"`));
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
            this.toast.success(`Tipo de cálculo "${val.nombre}" ${actionName} exitosamente`);
            this.closeSlideOver();
            this.cargarItems();
          },
          error: (err: any) => {
            this.toast.error(formatUserErrorMessage(err, 'actualizar el tipo de cálculo'));
            console.error(err);
          }
        });
      } else {
        this.facade.crear({
          codigo: val.codigo!,
          nombre: val.nombre!
        }).subscribe({
          next: () => {
            this.toast.success(`Tipo de cálculo "${val.nombre}" ${actionName} exitosamente`);
            this.closeSlideOver();
            this.cargarItems();
          },
          error: (err: any) => {
            this.toast.error(formatUserErrorMessage(err, 'crear el tipo de cálculo'));
            console.error(err);
          }
        });
      }
    } else {
      this.tipoCalculoForm.markAllAsTouched();
      this.toast.warning('Por favor complete los campos obligatorios del formulario.');
    }
  }
}
