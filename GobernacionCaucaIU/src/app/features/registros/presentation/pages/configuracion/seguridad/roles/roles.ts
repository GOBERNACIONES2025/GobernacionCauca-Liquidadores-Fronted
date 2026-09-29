import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { map } from 'rxjs';
import { PaginationComponent } from '../../../../../../shared/components/pagination/pagination';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { SlideOverComponent } from '../../../../shared/components/slide-over/slide-over';
import { ConfirmModalComponent } from '../../../../shared/components/confirm-modal/confirm-modal.component';
import { TableSearchComponent } from '../../../../shared/components/table-search/table-search';
import { FormFieldErrorComponent } from '../../../../../../shared/components/form-error/form-error.component';
import { SearchableSelectComponent } from '../../../../../../../shared/components/searchable-select/searchable-select';
import { RolesFacade } from '../../../../../application/facades/Seguridad/roles.facade';
import { Rol } from '../../../../../domain/models/Seguridad/rol.model';
import { RolesApiService } from '../../../../../infrastructure/api/Seguridad/roles-api.service';
import { TiposRolApiService } from '../../../../../infrastructure/api/Seguridad/tipos-rol-api.service';
import { ToastService } from '../../../../../../../core/services/toast.service';
import { formatUserErrorMessage } from '../../../../shared/utils/error-formatter.util';

@Component({
  selector: 'app-roles',
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
    FormFieldErrorComponent,
    SearchableSelectComponent
  ],
  templateUrl: './roles.html',
  styleUrl: './roles.css'
})
export class RolesComponent implements OnInit {
  private fb = inject(FormBuilder);
  public facade = inject(RolesFacade);
  public apiService = inject(RolesApiService);
  public tiposRolApi = inject(TiposRolApiService);
  private toast = inject(ToastService);

  breadcrumbs = ['Configuración', 'Seguridad', 'Roles'];

  searchText = signal<string>('');
  pageNumber = signal<number>(1);
  pageSize = signal<number>(10);
  loadingEditId = signal<number | null>(null);
  selectedFilter = signal<'todos' | 'activos' | 'inactivos'>('todos');

  isSlideOverOpen = false;
  selectedId: number | null = null;
  isConfirmModalOpen = signal<boolean>(false);
  itemToToggle = signal<Rol | null>(null);
  isTogglingStatus = signal<boolean>(false);

  get isEditMode(): boolean {
    return this.selectedId !== null;
  }

  rolForm = this.fb.group({
    codigo: ['', [Validators.required, Validators.maxLength(30)]],
    nombre: ['', Validators.required],
    tipoRolId: [null as number | null, [Validators.required]],
    activo: [true]
  });

  // Filtered list
  rolesFiltrados = computed(() => this.facade.roles());

  // Dynamic counts
  counts = computed(() => {
    return {
      total: this.facade.totalRoles()
    };
  });

  // Search & Resolve functions for TiposRol
  searchTiposRolFn = (term: string) => {
    return this.tiposRolApi.obtenerTodos({
      pageNumber: 1,
      pageSize: 50,
      searchTerm: term,
      activo: true
    }).pipe(map(res => res?.data?.items || []));
  };

  resolveTipoRolFn = (id: number) => {
    return this.tiposRolApi.obtenerPorId(id).pipe(map(res => res?.data));
  };

  ngOnInit() {
    this.cargarItems();
  }

  cargarItems() {
    let activo: boolean | undefined = undefined;
    if (this.selectedFilter && this.selectedFilter() === 'activos') activo = true;
    if (this.selectedFilter && this.selectedFilter() === 'inactivos') activo = false;
    this.facade.cargarRoles(this.pageNumber(), this.pageSize(), this.searchText(), activo);
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
    this.rolForm.reset({
      codigo: '',
      nombre: '',
      tipoRolId: null,
      activo: true
    });
    this.isSlideOverOpen = true;
  }

  edit(item: Rol) {
    this.loadingEditId.set(item.id);
    this.apiService.obtenerPorId(item.id).subscribe({
      next: (res) => {
        this.loadingEditId.set(null);
        const data = res?.data || item;
        this.selectedId = data.id;
        this.rolForm.patchValue({
          codigo: data.codigo,
          nombre: data.nombre,
          tipoRolId: data.tipoRolId,
          activo: data.activo
        });
        this.isSlideOverOpen = true;
      },
      error: (err) => {
        this.loadingEditId.set(null);
        this.toast.error(formatUserErrorMessage(err, 'Error al obtener la información del rol'));
        console.error(err);
      }
    });
  }

  promptToggleActivo(item: Rol) {
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
      tipoRolId: item.tipoRolId,
      activo: nuevoEstado
    }).subscribe({
      next: () => {
        this.isTogglingStatus.set(false);
        this.isConfirmModalOpen.set(false);
        this.itemToToggle.set(null);
        this.toast.success(`Rol ${actionName} exitosamente`);
        this.cargarItems();
      },
      error: (err: any) => {
        this.isTogglingStatus.set(false);
        this.toast.error(formatUserErrorMessage(err, 'Error al actualizar el rol'));
        console.error(err);
      }
    });
  }

  closeSlideOver() {
    this.isSlideOverOpen = false;
    this.selectedId = null;
  }

  saveRol() {
    if (this.rolForm.valid) {
      const val = this.rolForm.value;
      const codigoFormatted = (val.codigo || '').trim().toUpperCase();
      const actionName = this.isEditMode ? 'actualizado' : 'creado';

      if (this.isEditMode) {
        this.facade.actualizar(this.selectedId!, {
          id: this.selectedId!,
          codigo: codigoFormatted,
          nombre: val.nombre!.trim(),
          tipoRolId: Number(val.tipoRolId),
          activo: val.activo ?? true
        }).subscribe({
          next: () => {
            this.toast.success(`Rol ${actionName} exitosamente`);
            this.closeSlideOver();
            this.cargarItems();
          },
          error: (err: any) => {
            this.toast.error(formatUserErrorMessage(err, `Error al actualizar el rol`));
            console.error(err);
          }
        });
      } else {
        this.facade.crear({
          codigo: codigoFormatted,
          nombre: val.nombre!.trim(),
          tipoRolId: Number(val.tipoRolId)
        }).subscribe({
          next: () => {
            this.toast.success(`Rol ${actionName} exitosamente`);
            this.closeSlideOver();
            this.cargarItems();
          },
          error: (err: any) => {
            this.toast.error(formatUserErrorMessage(err, `Error al crear el rol`));
            console.error(err);
          }
        });
      }
    } else {
      this.toast.warning('Por favor complete los campos obligatorios del formulario.');
      this.rolForm.markAllAsTouched();
    }
  }

  getTipoRolBadgeClass(codigo?: string): string {
    const code = (codigo || '').toUpperCase();
    if (code === 'GOBERNACION') return 'bg-blue-50 text-blue-700 border-blue-200/80';
    if (code === 'ENTIDAD_REGISTRO') return 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
    if (code === 'GLOBAL') return 'bg-purple-50 text-purple-700 border-purple-200/80';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  }

  getTipoRolIcon(codigo?: string): string {
    const code = (codigo || '').toUpperCase();
    if (code === 'GOBERNACION') return 'fa-solid fa-landmark';
    if (code === 'ENTIDAD_REGISTRO') return 'fa-solid fa-building-columns';
    if (code === 'GLOBAL') return 'fa-solid fa-globe';
    return 'fa-solid fa-tag';
  }
}
