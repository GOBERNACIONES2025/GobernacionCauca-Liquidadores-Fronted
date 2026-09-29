import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaginationComponent } from '../../../../../../shared/components/pagination/pagination';
import { FormFieldErrorComponent } from '../../../../../../shared/components/form-error/form-error.component';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { SlideOverComponent } from '../../../../shared/components/slide-over/slide-over';
import { ConfirmModalComponent } from '../../../../shared/components/confirm-modal/confirm-modal.component';
import { formatUserErrorMessage } from '../../../../shared/utils/error-formatter.util';
import { TableSearchComponent } from '../../../../shared/components/table-search/table-search';
import { TiposBeneficiarioExencionFacade } from '../../../../../application/facades/Exenciones/tipos-beneficiario-exencion.facade';
import { TipoBeneficiarioExencion } from '../../../../../domain/models/Exenciones/tipo-beneficiario-exencion.model';
import { TiposBeneficiarioExencionApiService } from '../../../../../infrastructure/api/Exenciones/tipos-beneficiario-exencion-api.service';
import { ToastService } from '../../../../../../../core/services/toast.service';

@Component({
  selector: 'app-tipos-beneficiario-exencion',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PageHeaderComponent, SlideOverComponent, ConfirmModalComponent, PaginationComponent, TableSearchComponent, FormFieldErrorComponent],
  templateUrl: './tipos-beneficiario-exencion.html',
  styleUrl: './tipos-beneficiario-exencion.css'
})
export class TiposBeneficiarioExencionComponent implements OnInit {
  private fb = inject(FormBuilder);
  public facade = inject(TiposBeneficiarioExencionFacade);
  public apiService = inject(TiposBeneficiarioExencionApiService);
  private toast = inject(ToastService);

  breadcrumbs = ['Configuración', 'Exenciones', 'Tipo de Beneficiario de Exención'];

  searchText = signal<string>('');
  pageNumber = signal<number>(1);
  pageSize = signal<number>(10);
  loadingEditId = signal<number | null>(null);
  selectedFilter = signal<'todos' | 'activos' | 'inactivos'>('todos');

  isSlideOverOpen = false;
  selectedId: number | null = null;

  // Smart Confirmation Modal State
  isConfirmModalOpen = signal<boolean>(false);
  itemToToggle = signal<TipoBeneficiarioExencion | null>(null);
  isTogglingStatus = signal<boolean>(false);

  get isEditMode(): boolean {
    return this.selectedId !== null;
  }

  tipoBeneficiarioForm = this.fb.group({
    codigo: ['', [Validators.required, Validators.maxLength(10)]],
    nombre: ['', Validators.required],
    activo: [true]
  });

  // Filtered list
  tiposBeneficiarioFiltrados = computed(() => this.facade.tiposBeneficiario());

  // Dynamic counts
  counts = computed(() => {
    return {
      total: this.facade.totalTiposBeneficiario()
    };
  });

  ngOnInit() {
    this.cargarItems();
  }

  cargarItems() {
    let activo: boolean | undefined = undefined;
    if (this.selectedFilter && this.selectedFilter() === 'activos') activo = true;
    if (this.selectedFilter && this.selectedFilter() === 'inactivos') activo = false;
    this.facade.cargarTiposBeneficiario(this.pageNumber(), this.pageSize(), this.searchText(), activo);
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
    this.tipoBeneficiarioForm.reset({ codigo: '', nombre: '', activo: true });
    this.isSlideOverOpen = true;
  }

  edit(item: TipoBeneficiarioExencion) {
    this.loadingEditId.set(item.id);
    this.apiService.obtenerPorId(item.id).subscribe({
      next: (res) => {
        this.loadingEditId.set(null);
        const data = res?.data || item;
        this.selectedId = data.id;
        this.tipoBeneficiarioForm.patchValue({
          codigo: data.codigo,
          nombre: data.nombre,
          activo: data.activo
        });
        this.isSlideOverOpen = true;
      },
      error: (err) => {
        this.loadingEditId.set(null);
        this.toast.error(formatUserErrorMessage(err, 'obtener el tipo de beneficiario'));
        console.error(err);
      }
    });
  }

  promptToggleActivo(item: TipoBeneficiarioExencion) {
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
    const actionName = nuevoEstado ? 'activado' : 'desactivado';

    this.isTogglingStatus.set(true);
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
        this.toast.success(`Tipo de beneficiario ${actionName} exitosamente`);
        this.cargarItems();
      },
      error: (err: any) => {
        this.isTogglingStatus.set(false);
        this.toast.error(formatUserErrorMessage(err, 'actualizar estado del tipo de beneficiario'));
        console.error(err);
      }
    });
  }

  closeSlideOver() {
    this.isSlideOverOpen = false;
    this.selectedId = null;
  }

  saveTipoBeneficiario() {
    if (this.tipoBeneficiarioForm.valid) {
      const val = this.tipoBeneficiarioForm.value;
      const actionName = this.isEditMode ? 'actualizado' : 'creado';

      if (this.isEditMode) {
        this.facade.actualizar(this.selectedId!, {
          id: this.selectedId!,
          codigo: val.codigo!,
          nombre: val.nombre!,
          activo: val.activo ?? true
        }).subscribe({
          next: () => {
            this.toast.success(`Tipo de beneficiario ${actionName} exitosamente`);
            this.closeSlideOver();
            this.cargarItems();
          },
          error: (err: any) => {
            this.toast.error(formatUserErrorMessage(err, 'actualizar el tipo de beneficiario'));
            console.error(err);
          }
        });
      } else {
        this.facade.crear({
          codigo: val.codigo!,
          nombre: val.nombre!
        }).subscribe({
          next: () => {
            this.toast.success(`Tipo de beneficiario ${actionName} exitosamente`);
            this.closeSlideOver();
            this.cargarItems();
          },
          error: (err: any) => {
            this.toast.error(formatUserErrorMessage(err, 'crear el tipo de beneficiario'));
            console.error(err);
          }
        });
      }
    } else {
      this.tipoBeneficiarioForm.markAllAsTouched();
      this.toast.warning('Por favor complete los campos obligatorios del formulario.');
    }
  }
}
