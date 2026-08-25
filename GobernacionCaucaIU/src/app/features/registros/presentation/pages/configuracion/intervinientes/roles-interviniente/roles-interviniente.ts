import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { SlideOverComponent } from '../../../../shared/components/slide-over/slide-over';
import { RolesIntervinienteFacade } from '../../../../../application/facades/Intervinientes/roles-interviniente.facade';
import { RolInterviniente } from '../../../../../domain/models/Intervinientes/rol-interviniente.model';
import { ToastService } from '../../../../../../../core/services/toast.service';

@Component({
  selector: 'app-roles-interviniente',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PageHeaderComponent, SlideOverComponent],
  templateUrl: './roles-interviniente.html',
  styleUrl: './roles-interviniente.css'
})
export class RolesInterviniente implements OnInit {
  private fb = inject(FormBuilder);
  public facade = inject(RolesIntervinienteFacade);
  private toast = inject(ToastService);

  breadcrumbs = ['Configuración', 'Intervinientes', 'Rol de Interviniente'];

  searchQuery = signal<string>('');
  selectedFilter = signal<'todos' | 'activos' | 'inactivos'>('todos');

  isSlideOverOpen = false;
  selectedId: number | null = null;

  get isEditMode(): boolean {
    return this.selectedId !== null;
  }

  rolIntervinienteForm = this.fb.group({
    codigo: ['', [Validators.required, Validators.maxLength(10)]],
    nombre: ['', Validators.required],
    activo: [true]
  });

  // Filtered list
  rolesFiltrados = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const filter = this.selectedFilter();
    let items = this.facade.rolesInterviniente();

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
    const all = this.facade.rolesInterviniente();
    return {
      total: all.length,
      active: all.filter(r => r.activo).length,
      inactive: all.filter(r => !r.activo).length
    };
  });

  ngOnInit() {
    this.facade.cargarRolesInterviniente(1, 100);
  }

  setFilter(filter: 'todos' | 'activos' | 'inactivos') {
    this.selectedFilter.set(filter);
  }

  openNew() {
    this.selectedId = null;
    this.rolIntervinienteForm.reset({ codigo: '', nombre: '', activo: true });
    this.isSlideOverOpen = true;
  }

  edit(item: RolInterviniente) {
    this.selectedId = item.id;
    this.rolIntervinienteForm.patchValue({
      codigo: item.codigo,
      nombre: item.nombre,
      activo: item.activo
    });
    this.isSlideOverOpen = true;
  }

  toggleActivo(item: RolInterviniente) {
    const nuevoEstado = !item.activo;
    const actionName = nuevoEstado ? 'activado' : 'desactivado';

    this.facade.actualizar(item.id, {
      id: item.id,
      codigo: item.codigo,
      nombre: item.nombre,
      activo: nuevoEstado
    }).subscribe({
      next: () => {
        this.toast.success(`Rol de interviniente ${actionName} exitosamente`);
        this.facade.cargarRolesInterviniente(1, 100);
      },
      error: (err: any) => {
        this.toast.error(`Error al actualizar el rol de interviniente`);
        console.error(err);
      }
    });
  }

  closeSlideOver() {
    this.isSlideOverOpen = false;
    this.selectedId = null;
  }

  saveRolInterviniente() {
    if (this.rolIntervinienteForm.valid) {
      const val = this.rolIntervinienteForm.value;
      const actionName = this.isEditMode ? 'actualizado' : 'creado';

      if (this.isEditMode) {
        this.facade.actualizar(this.selectedId!, {
          id: this.selectedId!,
          codigo: val.codigo!,
          nombre: val.nombre!,
          activo: val.activo ?? true
        }).subscribe({
          next: () => {
            this.toast.success(`Rol de interviniente ${actionName} exitosamente`);
            this.closeSlideOver();
            this.facade.cargarRolesInterviniente(1, 100);
          },
          error: (err: any) => {
            this.toast.error(`Error al actualizar el rol de interviniente`);
            console.error(err);
          }
        });
      } else {
        this.facade.crear({
          codigo: val.codigo!,
          nombre: val.nombre!
        }).subscribe({
          next: () => {
            this.toast.success(`Rol de interviniente ${actionName} exitosamente`);
            this.closeSlideOver();
            this.facade.cargarRolesInterviniente(1, 100);
          },
          error: (err: any) => {
            this.toast.error(`Error al crear el rol de interviniente`);
            console.error(err);
          }
        });
      }
    } else {
      this.rolIntervinienteForm.markAllAsTouched();
    }
  }
}
