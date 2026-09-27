import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PaginationComponent } from '../../../../../../shared/components/pagination/pagination';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { SlideOverComponent } from '../../../../shared/components/slide-over/slide-over';
import { ConfirmModalComponent } from '../../../../shared/components/confirm-modal/confirm-modal.component';
import { TableSearchComponent } from '../../../../shared/components/table-search/table-search';
import { FormFieldErrorComponent } from '../../../../../../shared/components/form-error/form-error.component';
import { TiposRolFacade } from '../../../../../application/facades/Seguridad/tipos-rol.facade';
import { TipoRol } from '../../../../../domain/models/Seguridad/tipo-rol.model';
import { TiposRolApiService } from '../../../../../infrastructure/api/Seguridad/tipos-rol-api.service';
import { ToastService } from '../../../../../../../core/services/toast.service';
import { formatUserErrorMessage } from '../../../../shared/utils/error-formatter.util';

@Component({
  selector: 'app-tipos-rol',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule, 
    PageHeaderComponent, 
    SlideOverComponent, 
    ConfirmModalComponent, 
    PaginationComponent, 
    TableSearchComponent, 
    FormFieldErrorComponent
  ],
  templateUrl: './tipos-rol.html',
  styleUrl: './tipos-rol.css'
})
export class TiposRolComponent implements OnInit {
  private fb = inject(FormBuilder);
  public facade = inject(TiposRolFacade);
  public apiService = inject(TiposRolApiService);
  private toast = inject(ToastService);

  breadcrumbs = ['Configuración', 'Seguridad', 'Tipos de Rol'];

  searchText = signal<string>('');
  pageNumber = signal<number>(1);
  pageSize = signal<number>(10);
  loadingEditId = signal<number | null>(null);
  selectedFilter = signal<'todos' | 'activos' | 'inactivos'>('todos');

  isSlideOverOpen = false;
  selectedId: number | null = null;
  isConfirmModalOpen = signal<boolean>(false);
  itemToToggle = signal<TipoRol | null>(null);
  isTogglingStatus = signal<boolean>(false);

  get isEditMode(): boolean {
    return this.selectedId !== null;
  }

  tipoRolForm = this.fb.group({
    codigo: ['', [Validators.required, Validators.maxLength(30), Validators.pattern(/^[A-Za-z0-9_-]+$/)]],
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    descripcion: ['', [Validators.maxLength(250)]],
    activo: [true]
  });

  // Filtered list
  tiposRolFiltrados = computed(() => this.facade.tiposRol());

  // Dynamic counts
  counts = computed(() => {
    return {
      total: this.facade.totalTiposRol()
    };
  });

  ngOnInit() {
    this.cargarItems();
  }

  cargarItems() {
    let activo: boolean | undefined = undefined;
    if (this.selectedFilter() === 'activos') activo = true;
    if (this.selectedFilter() === 'inactivos') activo = false;
    this.facade.cargarTiposRol(this.pageNumber(), this.pageSize(), this.searchText(), activo);
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
    this.tipoRolForm.reset({
      codigo: '',
      nombre: '',
      descripcion: '',
      activo: true
    });
    this.isSlideOverOpen = true;
  }

  edit(item: TipoRol) {
    this.loadingEditId.set(item.id);
    this.apiService.obtenerPorId(item.id).subscribe({
      next: (res) => {
        this.loadingEditId.set(null);
        const data = res?.data || item;
        this.selectedId = data.id;
        this.tipoRolForm.patchValue({
          codigo: data.codigo,
          nombre: data.nombre,
          descripcion: data.descripcion || '',
          activo: data.activo
        });
        this.isSlideOverOpen = true;
      },
      error: (err) => {
        this.loadingEditId.set(null);
        this.toast.error(formatUserErrorMessage(err, 'Error al obtener la información del tipo de rol'));
        console.error(err);
      }
    });
  }

  promptToggleActivo(item: TipoRol) {
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
      descripcion: item.descripcion,
      activo: nuevoEstado
    }).subscribe({
      next: () => {
        this.isTogglingStatus.set(false);
        this.isConfirmModalOpen.set(false);
        this.itemToToggle.set(null);
        this.toast.success(`Tipo de rol ${actionName} exitosamente`);
        this.cargarItems();
      },
      error: (err: any) => {
        this.isTogglingStatus.set(false);
        this.toast.error(formatUserErrorMessage(err, 'Error al actualizar el estado del tipo de rol'));
        console.error(err);
      }
    });
  }

  closeSlideOver() {
    this.isSlideOverOpen = false;
    this.selectedId = null;
  }

  saveTipoRol() {
    if (this.tipoRolForm.valid) {
      const val = this.tipoRolForm.value;
      const codigoFormatted = (val.codigo || '').trim().toUpperCase();
      const actionName = this.isEditMode ? 'actualizado' : 'creado';

      if (this.isEditMode) {
        this.facade.actualizar(this.selectedId!, {
          id: this.selectedId!,
          codigo: codigoFormatted,
          nombre: val.nombre!.trim(),
          descripcion: val.descripcion ? val.descripcion.trim() : null,
          activo: val.activo ?? true
        }).subscribe({
          next: () => {
            this.toast.success(`Tipo de rol ${actionName} exitosamente`);
            this.closeSlideOver();
            this.cargarItems();
          },
          error: (err: any) => {
            this.toast.error(formatUserErrorMessage(err, 'Error al actualizar el tipo de rol'));
            console.error(err);
          }
        });
      } else {
        this.facade.crear({
          codigo: codigoFormatted,
          nombre: val.nombre!.trim(),
          descripcion: val.descripcion ? val.descripcion.trim() : null
        }).subscribe({
          next: () => {
            this.toast.success(`Tipo de rol ${actionName} exitosamente`);
            this.closeSlideOver();
            this.cargarItems();
          },
          error: (err: any) => {
            this.toast.error(formatUserErrorMessage(err, 'Error al registrar el tipo de rol'));
            console.error(err);
          }
        });
      }
    } else {
      this.toast.warning('Por favor verifique los campos obligatorios del formulario.');
      this.tipoRolForm.markAllAsTouched();
    }
  }

  getBadgeClass(codigo: string): string {
    const code = (codigo || '').toUpperCase();
    if (code === 'GOBERNACION') return 'bg-blue-50 text-blue-700 border-blue-200/80';
    if (code === 'ENTIDAD_REGISTRO') return 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
    if (code === 'GLOBAL') return 'bg-purple-50 text-purple-700 border-purple-200/80';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  }

  getIconClass(codigo: string): string {
    const code = (codigo || '').toUpperCase();
    if (code === 'GOBERNACION') return 'fa-solid fa-landmark';
    if (code === 'ENTIDAD_REGISTRO') return 'fa-solid fa-building-columns';
    if (code === 'GLOBAL') return 'fa-solid fa-globe';
    return 'fa-solid fa-tag';
  }
}
