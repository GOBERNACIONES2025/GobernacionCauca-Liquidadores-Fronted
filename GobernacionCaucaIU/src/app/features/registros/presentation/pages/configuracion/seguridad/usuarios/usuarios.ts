import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaginationComponent } from '../../../../../../shared/components/pagination/pagination';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { SlideOverComponent } from '../../../../shared/components/slide-over/slide-over';
import { ConfirmModalComponent } from '../../../../shared/components/confirm-modal/confirm-modal.component';
import { TableSearchComponent } from '../../../../shared/components/table-search/table-search';
import { UsuariosFacade } from '../../../../../application/facades/Seguridad/usuarios.facade';
import { RolesFacade } from '../../../../../application/facades/Seguridad/roles.facade';
import { Usuario } from '../../../../../domain/models/Seguridad/usuario.model';
import { UsuariosApiService } from '../../../../../infrastructure/api/Seguridad/usuarios-api.service';
import { ToastService } from '../../../../../../../core/services/toast.service';
import { formatUserErrorMessage } from '../../../../shared/utils/error-formatter.util';

import { FormFieldErrorComponent } from '../../../../../../shared/components/form-error/form-error.component';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PageHeaderComponent, SlideOverComponent, ConfirmModalComponent, PaginationComponent, TableSearchComponent, FormFieldErrorComponent],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css'
})
export class UsuariosComponent implements OnInit {
  private fb = inject(FormBuilder);
  public facade = inject(UsuariosFacade);
  public apiService = inject(UsuariosApiService);
  public rolesFacade = inject(RolesFacade);
  private toast = inject(ToastService);

  breadcrumbs = ['Configuración', 'Seguridad', 'Usuarios'];

  searchText = signal<string>('');
  pageNumber = signal<number>(1);
  pageSize = signal<number>(10);
  loadingEditId = signal<number | null>(null);
  selectedFilter = signal<'todos' | 'activos' | 'inactivos'>('todos');

  isSlideOverOpen = false;
  selectedId: number | null = null;
  isConfirmModalOpen = signal<boolean>(false);
  itemToToggle = signal<Usuario | null>(null);
  isTogglingStatus = signal<boolean>(false);

  get isEditMode(): boolean {
    return this.selectedId !== null;
  }

  usuarioForm = this.fb.group({
    nombre: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: [''],
    rolesIds: this.fb.control<number[]>([], [(c: AbstractControl) => (c.value && c.value.length > 0 ? null : { required: true })]),
    activo: [true]
  });

  // Filtered list
  usuariosFiltrados = computed(() => this.facade.usuarios());

  // Dynamic counts
  counts = computed(() => {
    return {
      total: this.facade.totalUsuarios()
    };
  });

  ngOnInit() {
    this.cargarItems();
  }

  cargarItems() {
    let activo: boolean | undefined = undefined;
    if (this.selectedFilter && this.selectedFilter() === 'activos') activo = true;
    if (this.selectedFilter && this.selectedFilter() === 'inactivos') activo = false;
    this.facade.cargarUsuarios({ pageNumber: this.pageNumber(), pageSize: this.pageSize(), search: this.searchText(), activo });
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
    this.usuarioForm.reset({
      nombre: '',
      email: '',
      password: '',
      rolesIds: [],
      activo: true
    });
    this.usuarioForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.usuarioForm.get('password')?.updateValueAndValidity();
    this.isSlideOverOpen = true;
  }

  edit(item: Usuario) {
    this.loadingEditId.set(item.id);
    this.apiService.obtenerPorId(item.id).subscribe({
      next: (res) => {
        this.loadingEditId.set(null);
        const data = res?.data || item;
        this.selectedId = data.id;
        const roleIds = data.roles ? data.roles.map(r => r.id) : [];
        this.usuarioForm.patchValue({
          nombre: data.nombre,
          email: data.email,
          password: '',
          rolesIds: roleIds,
          activo: data.activo ?? true
        });
        this.usuarioForm.get('password')?.clearValidators();
        this.usuarioForm.get('password')?.updateValueAndValidity();
        this.isSlideOverOpen = true;
      },
      error: (err) => {
        this.loadingEditId.set(null);
        this.toast.error(formatUserErrorMessage(err, 'Error al obtener la información del usuario'));
        console.error(err);
      }
    });
  }

  isRoleSelected(roleId: number): boolean {
    const current = this.usuarioForm.get('rolesIds')?.value || [];
    return current.includes(roleId);
  }

  toggleRole(roleId: number) {
    const current = this.usuarioForm.get('rolesIds')?.value || [];
    if (current.includes(roleId)) {
      this.usuarioForm.patchValue({
        rolesIds: current.filter(id => id !== roleId)
      });
    } else {
      this.usuarioForm.patchValue({
        rolesIds: [...current, roleId]
      });
    }
    this.usuarioForm.get('rolesIds')?.markAsTouched();
  }

  promptToggleActivo(item: Usuario) {
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
    const nuevoEstado = !(item.activo ?? true);
    const actionName = nuevoEstado ? 'activado' : 'desactivado';
    const roleIds = item.roles ? item.roles.map(r => r.id) : [];

    this.facade.actualizar(item.id, {
      id: item.id,
      nombre: item.nombre,
      email: item.email,
      activo: nuevoEstado,
      rolesIds: roleIds
    }).subscribe({
      next: () => {
        this.isTogglingStatus.set(false);
        this.isConfirmModalOpen.set(false);
        this.itemToToggle.set(null);
        this.toast.success(`Usuario ${actionName} exitosamente`);
        this.cargarItems();
      },
      error: (err: any) => {
        this.isTogglingStatus.set(false);
        this.toast.error(formatUserErrorMessage(err, `Error al actualizar el usuario`));
        console.error(err);
      }
    });
  }

  closeSlideOver() {
    this.isSlideOverOpen = false;
    this.selectedId = null;
  }

  saveUsuario() {
    if (this.usuarioForm.valid) {
      const val = this.usuarioForm.value;
      const actionName = this.isEditMode ? 'actualizado' : 'creado';

      if (this.isEditMode) {
        this.facade.actualizar(this.selectedId!, {
          id: this.selectedId!,
          nombre: val.nombre!,
          email: val.email!,
          activo: val.activo ?? true,
          rolesIds: (val.rolesIds ?? []) as number[],
          password: val.password || null
        }).subscribe({
          next: () => {
            this.toast.success(`Usuario ${actionName} exitosamente`);
            this.closeSlideOver();
            this.cargarItems();
          },
          error: (err: any) => {
            this.toast.error(formatUserErrorMessage(err, `Error al actualizar el usuario`));
            console.error(err);
          }
        });
      } else {
        this.facade.crear({
          nombre: val.nombre!,
          email: val.email!,
          password: val.password!,
          rolesIds: (val.rolesIds ?? []) as number[]
        }).subscribe({
          next: () => {
            this.toast.success(`Usuario ${actionName} exitosamente`);
            this.closeSlideOver();
            this.cargarItems();
          },
          error: (err: any) => {
            this.toast.error(formatUserErrorMessage(err, `Error al crear el usuario`));
            console.error(err);
          }
        });
      }
    } else {
      this.toast.warning('Por favor complete los campos obligatorios del formulario.');
      this.usuarioForm.markAllAsTouched();
    }
  }
}
