import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaginationComponent } from '../../../../../../shared/components/pagination/pagination';
import { FormFieldErrorComponent } from '../../../../../../shared/components/form-error/form-error.component';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { TableSearchComponent } from '../../../../shared/components/table-search/table-search';
import { SlideOverComponent } from '../../../../shared/components/slide-over/slide-over';
import { ConfirmModalComponent } from '../../../../shared/components/confirm-modal/confirm-modal.component';
import { formatUserErrorMessage } from '../../../../shared/utils/error-formatter.util';
import { NaturalezasActoFacade } from '../../../../../application/facades/Registro/naturalezas-acto.facade';
import { NaturalezaActo } from '../../../../../domain/models/Registro/naturaleza-acto.model';
import { NaturalezasActoApiService } from '../../../../../infrastructure/api/Registro/naturalezas-acto-api.service';
import { ToastService } from '../../../../../../../core/services/toast.service';

@Component({
  selector: 'app-naturalezas-acto',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PageHeaderComponent, TableSearchComponent, SlideOverComponent, ConfirmModalComponent, PaginationComponent, FormFieldErrorComponent],
  templateUrl: './naturalezas-acto.html',
  styleUrl: './naturalezas-acto.css'
})
export class NaturalezasActo implements OnInit {
  private fb = inject(FormBuilder);
  public facade = inject(NaturalezasActoFacade);
  public apiService = inject(NaturalezasActoApiService);
  private toast = inject(ToastService);

  breadcrumbs = ['Configuración', 'Actos Registrales', 'Naturaleza de Acto'];

  searchText = signal<string>('');
  pageNumber = signal<number>(1);
  pageSize = signal<number>(10);
  loadingEditId = signal<number | null>(null);
  selectedFilter = signal<'todos' | 'activos' | 'inactivos'>('todos');

  isSlideOverOpen = false;
  selectedId: number | null = null;

  // Smart Confirmation Modal State
  isConfirmModalOpen = signal<boolean>(false);
  itemToToggle = signal<NaturalezaActo | null>(null);
  isTogglingStatus = signal<boolean>(false);

  get isEditMode(): boolean {
    return this.selectedId !== null;
  }

  naturalezaForm = this.fb.group({
    codigo: ['', [Validators.required, Validators.maxLength(10)]],
    nombre: ['', Validators.required],
    descripcion: [''],
    esSinCuantia: [false],
    activo: [true]
  });

  // Filtered list
  naturalezasFiltradas = computed(() => this.facade.naturalezasActo());

  // Dynamic counts
  counts = computed(() => {
    return {
      total: this.facade.totalNaturalezasActo()
    };
  });

  ngOnInit() {
    this.cargarItems();
  }

  cargarItems() {
    let activo: boolean | undefined = undefined;
    if (this.selectedFilter && this.selectedFilter() === 'activos') activo = true;
    if (this.selectedFilter && this.selectedFilter() === 'inactivos') activo = false;
    this.facade.cargarNaturalezasActo(this.pageNumber(), this.pageSize(), this.searchText(), activo);
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
    this.naturalezaForm.reset({ codigo: '', nombre: '', descripcion: '', esSinCuantia: false, activo: true });
    this.isSlideOverOpen = true;
  }

  edit(item: NaturalezaActo) {
    this.loadingEditId.set(item.id);
    this.apiService.obtenerPorId(item.id).subscribe({
      next: (res) => {
        this.loadingEditId.set(null);
        const data = res?.data || item;
        this.selectedId = data.id;
        this.naturalezaForm.patchValue({
          codigo: data.codigo,
          nombre: data.nombre,
          descripcion: data.descripcion || '',
          esSinCuantia: data.esSinCuantia ?? false,
          activo: data.activo
        });
        this.isSlideOverOpen = true;
      },
      error: (err) => {
        this.loadingEditId.set(null);
        this.toast.error(formatUserErrorMessage(err, 'obtener la naturaleza de acto'));
        console.error(err);
      }
    });
  }

  promptToggleActivo(item: NaturalezaActo) {
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
    const actionName = nuevoEstado ? 'activada' : 'desactivada';

    this.isTogglingStatus.set(true);
    this.facade.actualizar(item.id, {
      id: item.id,
      codigo: item.codigo,
      nombre: item.nombre,
      descripcion: item.descripcion || '',
      esSinCuantia: item.esSinCuantia ?? false,
      activo: nuevoEstado
    }).subscribe({
      next: () => {
        this.isTogglingStatus.set(false);
        this.isConfirmModalOpen.set(false);
        this.itemToToggle.set(null);
        this.toast.success(`Naturaleza de acto ${actionName} exitosamente`);
        this.cargarItems();
      },
      error: (err: any) => {
        this.isTogglingStatus.set(false);
        this.toast.error(formatUserErrorMessage(err, 'actualizar estado de la naturaleza de acto'));
        console.error(err);
      }
    });
  }

  closeSlideOver() {
    this.isSlideOverOpen = false;
    this.selectedId = null;
  }

  saveNaturaleza() {
    if (this.naturalezaForm.valid) {
      const val = this.naturalezaForm.value;
      const actionName = this.isEditMode ? 'actualizada' : 'creada';

      if (this.isEditMode) {
        this.facade.actualizar(this.selectedId!, {
          id: this.selectedId!,
          codigo: val.codigo!,
          nombre: val.nombre!,
          descripcion: val.descripcion || '',
          esSinCuantia: val.esSinCuantia ?? false,
          activo: val.activo ?? true
        }).subscribe({
          next: () => {
            this.toast.success(`Naturaleza de acto ${actionName} exitosamente`);
            this.closeSlideOver();
            this.cargarItems();
          },
          error: (err: any) => {
            this.toast.error(formatUserErrorMessage(err, 'actualizar la naturaleza de acto'));
            console.error(err);
          }
        });
      } else {
        this.facade.crear({
          codigo: val.codigo!,
          nombre: val.nombre!,
          descripcion: val.descripcion || '',
          esSinCuantia: val.esSinCuantia ?? false
        }).subscribe({
          next: () => {
            this.toast.success(`Naturaleza de acto ${actionName} exitosamente`);
            this.closeSlideOver();
            this.cargarItems();
          },
          error: (err: any) => {
            this.toast.error(formatUserErrorMessage(err, 'crear la naturaleza de acto'));
            console.error(err);
          }
        });
      }
    } else {
      this.naturalezaForm.markAllAsTouched();
      this.toast.warning('Por favor complete los campos obligatorios del formulario.');
    }
  }
}
