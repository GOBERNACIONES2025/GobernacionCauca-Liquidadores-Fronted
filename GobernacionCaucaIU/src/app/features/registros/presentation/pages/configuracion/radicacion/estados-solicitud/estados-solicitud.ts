import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaginationComponent } from '../../../../../../shared/components/pagination/pagination';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { SlideOverComponent } from '../../../../shared/components/slide-over/slide-over';
import { ConfirmModalComponent } from '../../../../shared/components/confirm-modal/confirm-modal.component';
import { TableSearchComponent } from '../../../../shared/components/table-search/table-search';
import { EstadosSolicitudFacade } from '../../../../../application/facades/Radicacion/estados-solicitud.facade';
import { EstadoSolicitud } from '../../../../../domain/models/Radicacion/estado-solicitud.model';
import { EstadosSolicitudApiService } from '../../../../../infrastructure/api/Radicacion/estados-solicitud-api.service';
import { ToastService } from '../../../../../../../core/services/toast.service';
import { formatUserErrorMessage } from '../../../../shared/utils/error-formatter.util';

import { FormFieldErrorComponent } from '../../../../../../shared/components/form-error/form-error.component';

@Component({
  selector: 'app-estados-solicitud',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PageHeaderComponent, SlideOverComponent, ConfirmModalComponent, PaginationComponent, TableSearchComponent, FormFieldErrorComponent],
  templateUrl: './estados-solicitud.html',
  styleUrl: './estados-solicitud.css'
})
export class EstadosSolicitud implements OnInit {
  private fb = inject(FormBuilder);
  public facade = inject(EstadosSolicitudFacade);
  public apiService = inject(EstadosSolicitudApiService);
  private toast = inject(ToastService);

  breadcrumbs = ['Configuración', 'Radicación', 'Estados de Solicitud'];

  searchText = signal<string>('');
  pageNumber = signal<number>(1);
  pageSize = signal<number>(10);
  loadingEditId = signal<number | null>(null);
  selectedFilter = signal<'todos' | 'activos' | 'inactivos'>('todos');

  isSlideOverOpen = false;
  selectedId: number | null = null;
  isConfirmModalOpen = signal<boolean>(false);
  itemToToggle = signal<EstadoSolicitud | null>(null);
  isTogglingStatus = signal<boolean>(false);

  get isEditMode(): boolean {
    return this.selectedId !== null;
  }

  estadoSolicitudForm = this.fb.group({
    codigo: ['', [Validators.required, Validators.maxLength(10)]],
    nombre: ['', Validators.required],
    activo: [true]
  });

  // Filtered list
  estadosFiltrados = computed(() => this.facade.estadosSolicitud());

  // Dynamic counts
  counts = computed(() => {
    return {
      total: this.facade.totalEstadosSolicitud()
    };
  });

  ngOnInit() {
    this.cargarItems();
  }

  cargarItems() {
    let activo: boolean | undefined = undefined;
    if (this.selectedFilter && this.selectedFilter() === 'activos') activo = true;
    if (this.selectedFilter && this.selectedFilter() === 'inactivos') activo = false;
    this.facade.cargarEstadosSolicitud(this.pageNumber(), this.pageSize(), this.searchText(), activo);
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
    this.estadoSolicitudForm.reset({ codigo: '', nombre: '', activo: true });
    this.isSlideOverOpen = true;
  }

  edit(item: EstadoSolicitud) {
    this.loadingEditId.set(item.id);
    this.apiService.obtenerPorId(item.id).subscribe({
      next: (res) => {
        this.loadingEditId.set(null);
        const data = res?.data || item;
        this.selectedId = data.id;
        this.estadoSolicitudForm.patchValue({
          codigo: data.codigo,
          nombre: data.nombre,
          activo: data.activo
        });
        this.isSlideOverOpen = true;
      },
      error: (err) => {
        this.loadingEditId.set(null);
        this.toast.error(formatUserErrorMessage(err, 'Error al obtener la información del estado de solicitud'));
        console.error(err);
      }
    });
  }

  promptToggleActivo(item: EstadoSolicitud) {
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

    this.isTogglingStatus.set(true);
    const nuevoEstado = !item.activo;
    const actionName = nuevoEstado ? 'activado' : 'desactivado';

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
        this.toast.success(`Estado de solicitud ${actionName} exitosamente`);
        this.cargarItems();
      },
      error: (err: any) => {
        this.isTogglingStatus.set(false);
        this.toast.error(formatUserErrorMessage(err, 'Error al actualizar el estado de solicitud'));
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
            this.cargarItems();
          },
          error: (err: any) => {
            this.toast.error(formatUserErrorMessage(err, `Error al actualizar el estado de solicitud`));
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
            this.cargarItems();
          },
          error: (err: any) => {
            this.toast.error(formatUserErrorMessage(err, `Error al crear el estado de solicitud`));
            console.error(err);
          }
        });
      }
    } else {
      this.toast.warning('Por favor complete los campos obligatorios del formulario.');
      this.estadoSolicitudForm.markAllAsTouched();
    }
  }
}
