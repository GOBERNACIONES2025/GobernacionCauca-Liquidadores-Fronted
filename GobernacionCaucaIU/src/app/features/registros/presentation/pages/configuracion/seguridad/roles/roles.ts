import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { SlideOverComponent } from '../../../../shared/components/slide-over/slide-over';
import { RolesFacade } from '../../../../../application/facades/Seguridad/roles.facade';
import { Rol } from '../../../../../domain/models/Seguridad/rol.model';
import { ToastService } from '../../../../../../../core/services/toast.service';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PageHeaderComponent, SlideOverComponent],
  templateUrl: './roles.html',
  styleUrl: './roles.css'
})
export class RolesComponent implements OnInit {
  private fb = inject(FormBuilder);
  public facade = inject(RolesFacade);
  private toast = inject(ToastService);

  breadcrumbs = ['Configuración', 'Seguridad', 'Roles'];

  searchQuery = signal<string>('');
  selectedFilter = signal<'todos' | 'activos' | 'inactivos'>('todos');

  isSlideOverOpen = false;
  selectedId: number | null = null;

  get isEditMode(): boolean {
    return this.selectedId !== null;
  }

  rolForm = this.fb.group({
    codigo: ['', [Validators.required, Validators.maxLength(10)]],
    nombre: ['', Validators.required],
    activo: [true]
  });

  // Filtered list
  rolesFiltrados = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const filter = this.selectedFilter();
    let items = this.facade.roles();

    if (filter === 'activos') {
      items = items.filter(r => r.activo);
    } else if (filter === 'inactivos') {
      items = items.filter(r => !r.activo);
    }

    if (query) {
      items = items.filter(r => 
        r.codigo.toLowerCase().includes(query) || 
        r.nombre.toLowerCase().includes(query)
      );
    }

    return items;
  });

  // Dynamic counts
  counts = computed(() => {
    const all = this.facade.roles();
    return {
      total: all.length,
      active: all.filter(r => r.activo).length,
      inactive: all.filter(r => !r.activo).length
    };
  });

  ngOnInit() {
    this.facade.cargarRoles(1, 100);
  }

  setFilter(filter: 'todos' | 'activos' | 'inactivos') {
    this.selectedFilter.set(filter);
  }

  openNew() {
    this.selectedId = null;
    this.rolForm.reset({ codigo: '', nombre: '', activo: true });
    this.isSlideOverOpen = true;
  }

  edit(item: Rol) {
    this.selectedId = item.id;
    this.rolForm.patchValue({
      codigo: item.codigo,
      nombre: item.nombre,
      activo: item.activo
    });
    this.isSlideOverOpen = true;
  }

  toggleActivo(item: Rol) {
    const nuevoEstado = !item.activo;
    const actionName = nuevoEstado ? 'activado' : 'desactivado';

    this.facade.actualizar(item.id, {
      id: item.id,
      codigo: item.codigo,
      nombre: item.nombre,
      activo: nuevoEstado
    }).subscribe({
      next: () => {
        this.toast.success(`Rol ${actionName} exitosamente`);
        this.facade.cargarRoles(1, 100);
      },
      error: (err: any) => {
        this.toast.error(`Error al actualizar el rol`);
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
      const actionName = this.isEditMode ? 'actualizado' : 'creado';

      if (this.isEditMode) {
        this.facade.actualizar(this.selectedId!, {
          id: this.selectedId!,
          codigo: val.codigo!,
          nombre: val.nombre!,
          activo: val.activo ?? true
        }).subscribe({
          next: () => {
            this.toast.success(`Rol ${actionName} exitosamente`);
            this.closeSlideOver();
            this.facade.cargarRoles(1, 100);
          },
          error: (err: any) => {
            this.toast.error(`Error al actualizar el rol`);
            console.error(err);
          }
        });
      } else {
        this.facade.crear({
          codigo: val.codigo!,
          nombre: val.nombre!
        }).subscribe({
          next: () => {
            this.toast.success(`Rol ${actionName} exitosamente`);
            this.closeSlideOver();
            this.facade.cargarRoles(1, 100);
          },
          error: (err: any) => {
            this.toast.error(`Error al crear el rol`);
            console.error(err);
          }
        });
      }
    } else {
      this.rolForm.markAllAsTouched();
    }
  }
}
