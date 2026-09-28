import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PaginationComponent } from '../../../../../../shared/components/pagination/pagination';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { SlideOverComponent } from '../../../../shared/components/slide-over/slide-over';
import { ConfirmModalComponent } from '../../../../shared/components/confirm-modal/confirm-modal.component';
import { TableSearchComponent } from '../../../../shared/components/table-search/table-search';
import { FormFieldErrorComponent } from '../../../../../../shared/components/form-error/form-error.component';
import { PermisosFacade } from '../../../../../application/facades/Seguridad/permisos.facade';
import { Permiso } from '../../../../../domain/models/Seguridad/permiso.model';
import { ToastService } from '../../../../../../../core/services/toast.service';
import { formatUserErrorMessage } from '../../../../shared/utils/error-formatter.util';

@Component({
  selector: 'app-permisos',
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
  templateUrl: './permisos.html',
  styleUrl: './permisos.css'
})
export class PermisosComponent implements OnInit {
  private fb = inject(FormBuilder);
  public facade = inject(PermisosFacade);
  private toast = inject(ToastService);

  breadcrumbs = ['Configuración', 'Seguridad', 'Permisos'];
  tags = [{ text: 'Seguridad', type: 'info' as const }, { text: 'Control de Privilegios', type: 'neutral' as const }];

  searchText = signal<string>('');
  pageNumber = signal<number>(1);
  pageSize = signal<number>(10);
  selectedFilter = signal<'todos' | 'activos' | 'inactivos'>('todos');
  selectedModulo = signal<string>('todos');

  isSlideOverOpen = false;
  selectedId: number | null = null;
  isConfirmModalOpen = signal<boolean>(false);
  itemToToggle = signal<Permiso | null>(null);
  isTogglingStatus = signal<boolean>(false);

  get isEditMode(): boolean {
    return this.selectedId !== null;
  }

  permisoForm = this.fb.group({
    modulo: ['', [Validators.required, Validators.maxLength(50)]],
    codigo: ['', [Validators.required, Validators.maxLength(100), Validators.pattern('^[A-Za-z0-9_.]+$')]],
    nombre: ['', [Validators.required, Validators.maxLength(150)]],
    descripcion: [''],
    activo: [true]
  });

  permisosFiltrados = computed(() => this.facade.permisos());

  counts = computed(() => {
    return {
      total: this.facade.totalPermisos()
    };
  });

  ngOnInit(): void {
    this.cargarDatos();
    this.facade.cargarModulos();
  }

  cargarDatos(): void {
    let activo: boolean | undefined = undefined;
    if (this.selectedFilter() === 'activos') activo = true;
    if (this.selectedFilter() === 'inactivos') activo = false;

    const modulo = this.selectedModulo() !== 'todos' ? this.selectedModulo() : undefined;
    const search = this.searchText().trim() !== '' ? this.searchText().trim() : undefined;

    this.facade.cargarPermisos(
      this.pageNumber(),
      this.pageSize(),
      search,
      activo,
      modulo
    );
  }

  onSearch(term: string): void {
    this.searchText.set(term);
    this.pageNumber.set(1);
    this.cargarDatos();
  }

  onClearSearch(): void {
    this.searchText.set('');
    this.pageNumber.set(1);
    this.cargarDatos();
  }

  setFilter(filter: 'todos' | 'activos' | 'inactivos'): void {
    this.selectedFilter.set(filter);
    this.pageNumber.set(1);
    this.cargarDatos();
  }

  setModulo(modulo: string): void {
    this.selectedModulo.set(modulo);
    this.pageNumber.set(1);
    this.cargarDatos();
  }

  onPageChange(page: number): void {
    this.pageNumber.set(page);
    this.cargarDatos();
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.pageNumber.set(1);
    this.cargarDatos();
  }

  openNew(): void {
    this.selectedId = null;
    this.permisoForm.reset({
      modulo: '',
      codigo: '',
      nombre: '',
      descripcion: '',
      activo: true
    });
    this.permisoForm.get('codigo')?.enable();
    this.isSlideOverOpen = true;
  }

  openEdit(permiso: Permiso): void {
    this.selectedId = permiso.id;
    this.permisoForm.patchValue({
      modulo: permiso.modulo,
      codigo: permiso.codigo,
      nombre: permiso.nombre,
      descripcion: permiso.descripcion || '',
      activo: permiso.activo
    });
    this.permisoForm.get('codigo')?.disable();
    this.isSlideOverOpen = true;
  }

  closeSlideOver(): void {
    this.isSlideOverOpen = false;
    this.selectedId = null;
    this.permisoForm.reset();
  }

  savePermiso(): void {
    if (this.permisoForm.invalid) {
      this.permisoForm.markAllAsTouched();
      return;
    }

    const formVal = this.permisoForm.getRawValue();
    const modulo = formVal.modulo!.trim().toUpperCase();
    const codigo = formVal.codigo!.trim().toUpperCase();
    const nombre = formVal.nombre!.trim();
    const descripcion = formVal.descripcion ? formVal.descripcion.trim() : null;

    if (this.isEditMode) {
      this.facade.actualizar(this.selectedId!, {
        id: this.selectedId!,
        modulo,
        codigo,
        nombre,
        descripcion,
        activo: formVal.activo ?? true
      }).subscribe({
        next: () => {
          this.toast.success('Permiso actualizado correctamente');
          this.closeSlideOver();
          this.cargarDatos();
          this.facade.cargarModulos();
        },
        error: (err) => {
          const msg = formatUserErrorMessage(err, 'Error al actualizar permiso');
          this.toast.error(msg);
        }
      });
    } else {
      this.facade.crear({
        modulo,
        codigo,
        nombre,
        descripcion
      }).subscribe({
        next: () => {
          this.toast.success('Permiso registrado exitosamente');
          this.closeSlideOver();
          this.cargarDatos();
          this.facade.cargarModulos();
        },
        error: (err) => {
          const msg = formatUserErrorMessage(err, 'Error al crear permiso');
          this.toast.error(msg);
        }
      });
    }
  }

  confirmarDesactivacion(permiso: Permiso): void {
    this.itemToToggle.set(permiso);
    this.isConfirmModalOpen.set(true);
  }

  cancelarDesactivacion(): void {
    this.isConfirmModalOpen.set(false);
    this.itemToToggle.set(null);
  }

  ejecutarDesactivacion(): void {
    const item = this.itemToToggle();
    if (!item) return;

    this.isTogglingStatus.set(true);
    this.facade.eliminar(item.id).subscribe({
      next: () => {
        this.toast.success('El permiso ' + item.codigo + ' fue desactivado (Borrado Lógico)');
        this.isConfirmModalOpen.set(false);
        this.itemToToggle.set(null);
        this.isTogglingStatus.set(false);
        this.cargarDatos();
      },
      error: (err) => {
        const msg = formatUserErrorMessage(err, 'Error al desactivar permiso');
        this.toast.error(msg);
        this.isTogglingStatus.set(false);
      }
    });
  }

  getModuloBadgeClass(modulo: string): string {
    const m = modulo.toUpperCase();
    if (m === 'SEGURIDAD') return 'bg-amber-50 text-amber-700 border-amber-200';
    if (m === 'LIQUIDACION') return 'bg-blue-50 text-blue-700 border-blue-200';
    if (m === 'CONFIGURACION') return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    if (m === 'TARIFAS') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (m === 'RADICACION') return 'bg-purple-50 text-purple-700 border-purple-200';
    if (m === 'TERRITORIOS') return 'bg-teal-50 text-teal-700 border-teal-200';
    return 'bg-slate-50 text-slate-700 border-slate-200';
  }
}
