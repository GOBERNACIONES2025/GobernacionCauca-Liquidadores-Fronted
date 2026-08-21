import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { SlideOverComponent } from '../../../../shared/components/slide-over/slide-over';
import { UsuariosFacade } from '../../../../../application/facades/Seguridad/usuarios.facade';
import { RolesFacade } from '../../../../../application/facades/Seguridad/roles.facade';
import { Usuario } from '../../../../../domain/models/Seguridad/usuario.model';
import { ToastService } from '../../../../../../../core/services/toast.service';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PageHeaderComponent, SlideOverComponent],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css'
})
export class UsuariosComponent implements OnInit {
  private fb = inject(FormBuilder);
  public facade = inject(UsuariosFacade);
  public rolesFacade = inject(RolesFacade);
  private toast = inject(ToastService);

  breadcrumbs = ['Configuración', 'Seguridad', 'Usuarios'];

  searchQuery = signal<string>('');
  selectedFilter = signal<'todos' | 'activos' | 'inactivos'>('todos');

  isSlideOverOpen = false;
  selectedId: number | null = null;

  get isEditMode(): boolean {
    return this.selectedId !== null;
  }

  usuarioForm = this.fb.group({
    nombre: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: [''],
    rolesIds: [[] as number[], Validators.required],
    activo: [true]
  });

  // Filtered list
  usuariosFiltrados = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const filter = this.selectedFilter();
    let items = this.facade.usuarios();

    if (filter === 'activos') {
      items = items.filter(u => u.activo !== false);
    } else if (filter === 'inactivos') {
      items = items.filter(u => u.activo === false);
    }

    if (query) {
      items = items.filter(u => 
        u.nombre.toLowerCase().includes(query) || 
        u.email.toLowerCase().includes(query) ||
        u.roles.some(r => r.nombre.toLowerCase().includes(query))
      );
    }

    return items;
  });

  // Dynamic counts
  counts = computed(() => {
    const all = this.facade.usuarios();
    return {
      total: all.length,
      active: all.filter(u => u.activo !== false).length,
      inactive: all.filter(u => u.activo === false).length
    };
  });

  ngOnInit() {
    this.facade.cargarUsuarios();
    this.rolesFacade.cargarRoles(1, 100);
  }

  setFilter(filter: 'todos' | 'activos' | 'inactivos') {
    this.selectedFilter.set(filter);
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
    this.selectedId = item.id;
    const roleIds = item.roles ? item.roles.map(r => r.id) : [];
    this.usuarioForm.patchValue({
      nombre: item.nombre,
      email: item.email,
      password: '',
      rolesIds: roleIds,
      activo: item.activo ?? true
    });
    this.usuarioForm.get('password')?.clearValidators();
    this.usuarioForm.get('password')?.updateValueAndValidity();
    this.isSlideOverOpen = true;
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

  toggleActivo(item: Usuario) {
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
        this.toast.success(`Usuario ${actionName} exitosamente`);
        this.facade.cargarUsuarios();
      },
      error: (err: any) => {
        this.toast.error(`Error al actualizar el usuario`);
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
          rolesIds: val.rolesIds || [],
          password: val.password || null
        }).subscribe({
          next: () => {
            this.toast.success(`Usuario ${actionName} exitosamente`);
            this.closeSlideOver();
            this.facade.cargarUsuarios();
          },
          error: (err: any) => {
            this.toast.error(`Error al actualizar el usuario`);
            console.error(err);
          }
        });
      } else {
        this.facade.crear({
          nombre: val.nombre!,
          email: val.email!,
          password: val.password!,
          rolesIds: val.rolesIds || []
        }).subscribe({
          next: () => {
            this.toast.success(`Usuario ${actionName} exitosamente`);
            this.closeSlideOver();
            this.facade.cargarUsuarios();
          },
          error: (err: any) => {
            this.toast.error(`Error al crear el usuario`);
            console.error(err);
          }
        });
      }
    } else {
      this.usuarioForm.markAllAsTouched();
    }
  }
}
