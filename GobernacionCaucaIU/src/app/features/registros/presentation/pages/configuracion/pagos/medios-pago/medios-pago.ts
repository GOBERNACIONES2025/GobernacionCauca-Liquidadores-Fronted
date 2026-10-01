import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaginationComponent } from '../../../../../../shared/components/pagination/pagination';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { SlideOverComponent } from '../../../../shared/components/slide-over/slide-over';
import { ConfirmModalComponent } from '../../../../shared/components/confirm-modal/confirm-modal.component';
import { TableSearchComponent } from '../../../../shared/components/table-search/table-search';
import { MediosPagoFacade } from '../../../../../application/facades/Pagos/medios-pago.facade';
import { MedioPago } from '../../../../../domain/models/Pagos/medio-pago.model';
import { MediosPagoApiService } from '../../../../../infrastructure/api/Pagos/medios-pago-api.service';
import { ToastService } from '../../../../../../../core/services/toast.service';
import { formatUserErrorMessage } from '../../../../shared/utils/error-formatter.util';
import { FormFieldErrorComponent } from '../../../../../../shared/components/form-error/form-error.component';

@Component({
  selector: 'app-medios-pago',
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
  templateUrl: './medios-pago.html',
  styleUrl: './medios-pago.css'
})
export class MediosPago implements OnInit {
  private fb = inject(FormBuilder);
  public facade = inject(MediosPagoFacade);
  public apiService = inject(MediosPagoApiService);
  private toast = inject(ToastService);

  breadcrumbs = ['Configuración', 'Pagos', 'Medios de Pago'];

  searchText = signal<string>('');
  pageNumber = signal<number>(1);
  pageSize = signal<number>(10);
  loadingEditId = signal<number | null>(null);
  selectedFilter = signal<'todos' | 'activos' | 'inactivos'>('todos');

  isSlideOverOpen = false;
  selectedId: number | null = null;
  isConfirmModalOpen = signal<boolean>(false);
  itemToToggle = signal<MedioPago | null>(null);
  isTogglingStatus = signal<boolean>(false);

  get isEditMode(): boolean {
    return this.selectedId !== null;
  }

  medioPagoForm = this.fb.group({
    codigo: ['', [Validators.required, Validators.maxLength(50)]],
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    descripcion: ['', [Validators.maxLength(255)]],
    requiereComprobante: [true],
    activo: [true]
  });

  mediosFiltrados = computed(() => this.facade.mediosPago());

  counts = computed(() => {
    return {
      total: this.facade.totalMediosPago()
    };
  });

  ngOnInit() {
    this.cargarItems();
  }

  cargarItems() {
    let activo: boolean | undefined = undefined;
    if (this.selectedFilter() === 'activos') activo = true;
    if (this.selectedFilter() === 'inactivos') activo = false;
    this.facade.cargarMediosPago(this.pageNumber(), this.pageSize(), this.searchText(), activo);
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
    this.medioPagoForm.reset({
      codigo: '',
      nombre: '',
      descripcion: '',
      requiereComprobante: true,
      activo: true
    });
    this.isSlideOverOpen = true;
  }

  editItem(item: MedioPago) {
    this.loadingEditId.set(item.id);
    this.apiService.obtenerPorId(item.id).subscribe({
      next: (res) => {
        this.loadingEditId.set(null);
        if (res.data) {
          this.selectedId = res.data.id;
          this.medioPagoForm.patchValue({
            codigo: res.data.codigo,
            nombre: res.data.nombre,
            descripcion: res.data.descripcion || '',
            requiereComprobante: res.data.requiereComprobante,
            activo: res.data.activo
          });
          this.isSlideOverOpen = true;
        }
      },
      error: (err) => {
        this.loadingEditId.set(null);
        this.toast.error(formatUserErrorMessage(err, 'No se pudo cargar el medio de pago.'));
      }
    });
  }

  closeSlideOver() {
    this.isSlideOverOpen = false;
    this.selectedId = null;
  }

  onSubmit() {
    if (this.medioPagoForm.invalid) {
      this.medioPagoForm.markAllAsTouched();
      return;
    }

    const formVal = this.medioPagoForm.value;

    if (this.isEditMode && this.selectedId) {
      const updateDto = {
        codigo: formVal.codigo?.trim().toUpperCase() || '',
        nombre: formVal.nombre?.trim() || '',
        descripcion: formVal.descripcion?.trim() || null,
        requiereComprobante: formVal.requiereComprobante ?? true,
        activo: formVal.activo ?? true
      };

      this.facade.actualizar(this.selectedId, updateDto).subscribe({
        next: () => {
          this.toast.success('Medio de pago actualizado correctamente.');
          this.closeSlideOver();
          this.cargarItems();
        },
        error: (err) => {
          this.toast.error(formatUserErrorMessage(err, 'Error al actualizar el medio de pago.'));
        }
      });
    } else {
      const createDto = {
        codigo: formVal.codigo?.trim().toUpperCase() || '',
        nombre: formVal.nombre?.trim() || '',
        descripcion: formVal.descripcion?.trim() || null,
        requiereComprobante: formVal.requiereComprobante ?? true
      };

      this.facade.crear(createDto).subscribe({
        next: () => {
          this.toast.success('Medio de pago registrado correctamente.');
          this.closeSlideOver();
          this.cargarItems();
        },
        error: (err) => {
          this.toast.error(formatUserErrorMessage(err, 'Error al crear el medio de pago.'));
        }
      });
    }
  }

  openToggleModal(item: MedioPago) {
    this.itemToToggle.set(item);
    this.isConfirmModalOpen.set(true);
  }

  confirmToggle() {
    const item = this.itemToToggle();
    if (!item) return;

    this.isTogglingStatus.set(true);
    const updateDto = {
      codigo: item.codigo,
      nombre: item.nombre,
      descripcion: item.descripcion,
      requiereComprobante: item.requiereComprobante,
      activo: !item.activo
    };

    this.facade.actualizar(item.id, updateDto).subscribe({
      next: () => {
        this.isTogglingStatus.set(false);
        this.isConfirmModalOpen.set(false);
        this.itemToToggle.set(null);
        this.toast.success(`Medio de pago ${updateDto.activo ? 'activado' : 'inactivado'} exitosamente.`);
        this.cargarItems();
      },
      error: (err) => {
        this.isTogglingStatus.set(false);
        this.toast.error(formatUserErrorMessage(err, 'No se pudo cambiar el estado del medio de pago.'));
      }
    });
  }
}
