import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaginationComponent } from '../../../../../../shared/components/pagination/pagination';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { SlideOverComponent } from '../../../../shared/components/slide-over/slide-over';
import { TiposBeneficiarioExencionFacade } from '../../../../../application/facades/Exenciones/tipos-beneficiario-exencion.facade';
import { TipoBeneficiarioExencion } from '../../../../../domain/models/Exenciones/tipo-beneficiario-exencion.model';
import { ToastService } from '../../../../../../../core/services/toast.service';

@Component({
  selector: 'app-tipos-beneficiario-exencion',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PageHeaderComponent, SlideOverComponent, PaginationComponent],
  templateUrl: './tipos-beneficiario-exencion.html',
  styleUrl: './tipos-beneficiario-exencion.css'
})
export class TiposBeneficiarioExencionComponent implements OnInit {
  private fb = inject(FormBuilder);
  public facade = inject(TiposBeneficiarioExencionFacade);
  private toast = inject(ToastService);

  breadcrumbs = ['Configuración', 'Exenciones', 'Tipo de Beneficiario de Exención'];

  searchText = signal<string>('');
  pageNumber = signal<number>(1);
  pageSize = signal<number>(10);

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
    this.tipoBeneficiarioForm.reset({ codigo: '', nombre: '', activo: true });
    this.isSlideOverOpen = true;
  }

  edit(item: TipoBeneficiarioExencion) {
    this.selectedId = item.id;
    this.tipoBeneficiarioForm.patchValue({
      codigo: item.codigo,
      nombre: item.nombre,
      activo: item.activo
    });
    this.isSlideOverOpen = true;
  }

  toggleActivo(item: TipoBeneficiarioExencion) {
    const nuevoEstado = !item.activo;
    const actionName = nuevoEstado ? 'activado' : 'desactivado';

    this.facade.actualizar(item.id, {
      id: item.id,
      codigo: item.codigo,
      nombre: item.nombre,
      activo: nuevoEstado
    }).subscribe({
      next: () => {
        this.toast.success(`Tipo de beneficiario ${actionName} exitosamente`);
        this.cargarItems();
      },
      error: (err: any) => {
        this.toast.error(`Error al actualizar el tipo de beneficiario`);
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
            this.toast.error(`Error al actualizar el tipo de beneficiario`);
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
            this.toast.error(`Error al crear el tipo de beneficiario`);
            console.error(err);
          }
        });
      }
    } else {
      this.tipoBeneficiarioForm.markAllAsTouched();
    }
  }
}
