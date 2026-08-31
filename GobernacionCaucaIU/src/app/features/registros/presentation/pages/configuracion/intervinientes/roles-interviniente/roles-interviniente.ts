import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaginationComponent } from '../../../../../../shared/components/pagination/pagination';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { SlideOverComponent } from '../../../../shared/components/slide-over/slide-over';
import { RolesIntervinienteFacade } from '../../../../../application/facades/Intervinientes/roles-interviniente.facade';
import { RolInterviniente } from '../../../../../domain/models/Intervinientes/rol-interviniente.model';
import { RolesIntervinienteApiService } from '../../../../../infrastructure/api/Intervinientes/roles-interviniente-api.service';
import { ToastService } from '../../../../../../../core/services/toast.service';

@Component({
  selector: 'app-roles-interviniente',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PageHeaderComponent, SlideOverComponent, PaginationComponent],
  templateUrl: './roles-interviniente.html',
  styleUrl: './roles-interviniente.css'
})
export class RolesInterviniente implements OnInit {
  private fb = inject(FormBuilder);
  public facade = inject(RolesIntervinienteFacade);
  public apiService = inject(RolesIntervinienteApiService);
  private toast = inject(ToastService);

  breadcrumbs = ['Configuración', 'Intervinientes', 'Rol de Interviniente'];

  searchText = signal<string>('');
  pageNumber = signal<number>(1);
  pageSize = signal<number>(10);
  loadingEditId = signal<number | null>(null);

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
  rolesFiltrados = computed(() => this.facade.rolesInterviniente());

  // Dynamic counts
  counts = computed(() => {
    return {
      total: this.facade.totalRolesInterviniente()
    };
  });

  ngOnInit() {
    this.cargarItems();
  }

  cargarItems() {
    let activo: boolean | undefined = undefined;
    if (this.selectedFilter && this.selectedFilter() === 'activos') activo = true;
    if (this.selectedFilter && this.selectedFilter() === 'inactivos') activo = false;
    this.facade.cargarRolesInterviniente(this.pageNumber(), this.pageSize(), this.searchText(), activo);
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

  

  openNew() {
    this.selectedId = null;
    this.rolIntervinienteForm.reset({ codigo: '', nombre: '', activo: true });
    this.isSlideOverOpen = true;
  }

  edit(item: RolInterviniente) {
    this.loadingEditId.set(item.id);
    this.apiService.obtenerPorId(item.id).subscribe({
      next: (res) => {
        this.loadingEditId.set(null);
        const data = res?.data || item;
        this.selectedId = data.id;
        this.rolIntervinienteForm.patchValue({
          codigo: data.codigo,
          nombre: data.nombre,
          activo: data.activo
        });
        this.isSlideOverOpen = true;
      },
      error: (err) => {
        this.loadingEditId.set(null);
        this.toast.error('Error al obtener la información del rol de interviniente');
        console.error(err);
      }
    });
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
        this.cargarItems();
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
            this.cargarItems();
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
            this.cargarItems();
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
