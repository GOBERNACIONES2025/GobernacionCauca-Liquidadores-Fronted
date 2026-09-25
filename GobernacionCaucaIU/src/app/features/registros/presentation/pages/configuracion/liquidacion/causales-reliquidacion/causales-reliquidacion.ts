import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaginationComponent } from '../../../../../../shared/components/pagination/pagination';
import { FormFieldErrorComponent } from '../../../../../../shared/components/form-error/form-error.component';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { SlideOverComponent } from '../../../../shared/components/slide-over/slide-over';
import { ConfirmModalComponent } from '../../../../shared/components/confirm-modal/confirm-modal.component';
import { TableSearchComponent } from '../../../../shared/components/table-search/table-search';
import { CausalesReliquidacionFacade } from '../../../../../application/facades/Liquidacion/causales-reliquidacion.facade';
import { CausalReliquidacion } from '../../../../../domain/models/Liquidacion/causal-reliquidacion.model';
import { CausalesReliquidacionApiService } from '../../../../../infrastructure/api/Liquidacion/causales-reliquidacion-api.service';
import { ToastService } from '../../../../../../../core/services/toast.service';
import { formatUserErrorMessage } from '../../../../shared/utils/error-formatter.util';

@Component({
  selector: 'app-causales-reliquidacion',
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
  templateUrl: './causales-reliquidacion.html',
  styleUrl: './causales-reliquidacion.css'
})
export class CausalesReliquidacionComponent implements OnInit {
  private fb = inject(FormBuilder);
  public facade = inject(CausalesReliquidacionFacade);
  public apiService = inject(CausalesReliquidacionApiService);
  private toast = inject(ToastService);

  breadcrumbs = ['Configuración', 'Liquidación', 'Causales de Reliquidación'];

  searchText = signal<string>('');
  pageNumber = signal<number>(1);
  pageSize = signal<number>(10);
  loadingEditId = signal<number | null>(null);
  selectedFilter = signal<'todos' | 'activos' | 'inactivos'>('todos');

  isSlideOverOpen = false;
  selectedId: number | null = null;
  isConfirmModalOpen = signal<boolean>(false);
  itemToToggle = signal<CausalReliquidacion | null>(null);
  isTogglingStatus = signal<boolean>(false);

  get isEditMode(): boolean {
    return this.selectedId !== null;
  }

  causalForm = this.fb.group({
    codigo: ['', [Validators.required, Validators.maxLength(50)]],
    nombre: ['', [Validators.required, Validators.maxLength(200)]],
    descripcion: [''],
    requiereWizard: [false],
    requiereSoporte: [false],
    activo: [true]
  });

  causalesFiltradas = computed(() => this.facade.causalesReliquidacion());

  counts = computed(() => {
    return {
      total: this.facade.totalCausalesReliquidacion()
    };
  });

  ngOnInit() {
    this.cargarItems();
  }

  cargarItems() {
    let activo: boolean | undefined = undefined;
    if (this.selectedFilter && this.selectedFilter() === 'activos') activo = true;
    if (this.selectedFilter && this.selectedFilter() === 'inactivos') activo = false;
    this.facade.cargarCausalesReliquidacion(this.pageNumber(), this.pageSize(), this.searchText(), activo);
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
    this.causalForm.reset({
      codigo: '',
      nombre: '',
      descripcion: '',
      requiereWizard: false,
      requiereSoporte: false,
      activo: true
    });
    this.isSlideOverOpen = true;
  }

  edit(item: CausalReliquidacion) {
    this.loadingEditId.set(item.id);
    this.apiService.obtenerPorId(item.id).subscribe({
      next: (res) => {
        this.loadingEditId.set(null);
        const data = res?.data || item;
        this.selectedId = data.id;
        this.causalForm.patchValue({
          codigo: data.codigo,
          nombre: data.nombre,
          descripcion: data.descripcion || '',
          requiereWizard: data.requiereWizard,
          requiereSoporte: data.requiereSoporte,
          activo: data.activo
        });
        this.isSlideOverOpen = true;
      },
      error: (err) => {
        this.loadingEditId.set(null);
        this.toast.error(formatUserErrorMessage(err, 'Error al obtener la información de la causal'));
        console.error(err);
      }
    });
  }

  promptToggleActivo(item: CausalReliquidacion) {
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
    const actionName = nuevoEstado ? 'activada' : 'desactivada';

    this.facade.actualizar(item.id, {
      id: item.id,
      codigo: item.codigo,
      nombre: item.nombre,
      descripcion: item.descripcion,
      requiereWizard: item.requiereWizard,
      requiereSoporte: item.requiereSoporte,
      activo: nuevoEstado
    }).subscribe({
      next: () => {
        this.isTogglingStatus.set(false);
        this.isConfirmModalOpen.set(false);
        this.itemToToggle.set(null);
        this.toast.success(`Causal de reliquidación ${actionName} exitosamente`);
        this.cargarItems();
      },
      error: (err: any) => {
        this.isTogglingStatus.set(false);
        this.toast.error(formatUserErrorMessage(err, `Error al actualizar la causal de reliquidación`));
        console.error(err);
      }
    });
  }

  closeSlideOver() {
    this.isSlideOverOpen = false;
    this.selectedId = null;
  }

  saveCausal() {
    if (this.causalForm.valid) {
      const val = this.causalForm.value;
      const actionName = this.isEditMode ? 'actualizada' : 'creada';

      if (this.isEditMode) {
        this.facade.actualizar(this.selectedId!, {
          id: this.selectedId!,
          codigo: val.codigo!.trim().toUpperCase(),
          nombre: val.nombre!.trim(),
          descripcion: val.descripcion?.trim() || null,
          requiereWizard: val.requiereWizard ?? false,
          requiereSoporte: val.requiereSoporte ?? false,
          activo: val.activo ?? true
        }).subscribe({
          next: () => {
            this.toast.success(`Causal de reliquidación ${actionName} exitosamente`);
            this.closeSlideOver();
            this.cargarItems();
          },
          error: (err: any) => {
            this.toast.error(formatUserErrorMessage(err, `Error al actualizar la causal de reliquidación`));
            console.error(err);
          }
        });
      } else {
        this.facade.crear({
          codigo: val.codigo!.trim().toUpperCase(),
          nombre: val.nombre!.trim(),
          descripcion: val.descripcion?.trim() || null,
          requiereWizard: val.requiereWizard ?? false,
          requiereSoporte: val.requiereSoporte ?? false
        }).subscribe({
          next: () => {
            this.toast.success(`Causal de reliquidación ${actionName} exitosamente`);
            this.closeSlideOver();
            this.cargarItems();
          },
          error: (err: any) => {
            this.toast.error(formatUserErrorMessage(err, `Error al crear la causal de reliquidación`));
            console.error(err);
          }
        });
      }
    } else {
      this.toast.warning('Por favor complete los campos obligatorios del formulario.');
      this.causalForm.markAllAsTouched();
    }
  }
}
