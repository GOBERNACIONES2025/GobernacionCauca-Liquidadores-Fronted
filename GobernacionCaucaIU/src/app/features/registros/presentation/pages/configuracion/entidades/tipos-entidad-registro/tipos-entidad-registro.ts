import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaginationComponent } from '../../../../../../shared/components/pagination/pagination';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { SlideOverComponent } from '../../../../shared/components/slide-over/slide-over';
import { TiposEntidadRegistroFacade } from '../../../../../application/facades/Registro/tipos-entidad-registro.facade';
import { TipoEntidadRegistro } from '../../../../../domain/models/Registro/tipo-entidad-registro.model';
import { TiposEntidadRegistroApiService } from '../../../../../infrastructure/api/Registro/tipos-entidad-registro-api.service';
import { ToastService } from '../../../../../../../core/services/toast.service';

@Component({
  selector: 'app-tipos-entidad-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PageHeaderComponent, SlideOverComponent, PaginationComponent],
  templateUrl: './tipos-entidad-registro.html',
  styleUrl: './tipos-entidad-registro.css'
})
export class TiposEntidadRegistro implements OnInit {
  private fb = inject(FormBuilder);
  public facade = inject(TiposEntidadRegistroFacade);
  public apiService = inject(TiposEntidadRegistroApiService);
  private toast = inject(ToastService);

  breadcrumbs = ['Configuración', 'Entidades', 'Tipo de Entidad de Registro'];

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

  tipoEntidadForm = this.fb.group({
    codigo: ['', [Validators.required, Validators.maxLength(10)]],
    nombre: ['', Validators.required],
    activo: [true]
  });

  // Filtered list
  tiposEntidadFiltrados = computed(() => this.facade.tiposEntidadRegistro());

  // Dynamic counts
  counts = computed(() => {
    return {
      total: this.facade.totalTiposEntidadRegistro()
    };
  });

  ngOnInit() {
    this.cargarItems();
  }

  cargarItems() {
    let activo: boolean | undefined = undefined;
    if (this.selectedFilter && this.selectedFilter() === 'activos') activo = true;
    if (this.selectedFilter && this.selectedFilter() === 'inactivos') activo = false;
    this.facade.cargarTiposEntidadRegistro(this.pageNumber(), this.pageSize(), this.searchText(), activo);
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
    this.tipoEntidadForm.reset({ codigo: '', nombre: '', activo: true });
    this.isSlideOverOpen = true;
  }

  edit(item: TipoEntidadRegistro) {
    this.loadingEditId.set(item.id);
    this.apiService.obtenerPorId(item.id).subscribe({
      next: (res) => {
        this.loadingEditId.set(null);
        const data = res?.data || item;
        this.selectedId = data.id;
        this.tipoEntidadForm.patchValue({
          codigo: data.codigo,
          nombre: data.nombre,
          activo: data.activo
        });
        this.isSlideOverOpen = true;
      },
      error: (err) => {
        this.loadingEditId.set(null);
        this.toast.error('Error al obtener la información del tipo de entidad');
        console.error(err);
      }
    });
  }

  toggleActivo(item: TipoEntidadRegistro) {
    const nuevoEstado = !item.activo;
    const actionName = nuevoEstado ? 'activado' : 'desactivado';

    this.facade.actualizar(item.id, {
      id: item.id,
      codigo: item.codigo,
      nombre: item.nombre,
      activo: nuevoEstado
    }).subscribe({
      next: () => {
        this.toast.success(`Tipo de entidad ${actionName} exitosamente`);
        this.cargarItems();
      },
      error: (err: any) => {
        this.toast.error(`Error al actualizar el tipo de entidad`);
        console.error(err);
      }
    });
  }

  closeSlideOver() {
    this.isSlideOverOpen = false;
    this.selectedId = null;
  }

  saveTipoEntidad() {
    if (this.tipoEntidadForm.valid) {
      const val = this.tipoEntidadForm.value;
      const actionName = this.isEditMode ? 'actualizado' : 'creado';

      if (this.isEditMode) {
        this.facade.actualizar(this.selectedId!, {
          id: this.selectedId!,
          codigo: val.codigo!,
          nombre: val.nombre!,
          activo: val.activo ?? true
        }).subscribe({
          next: () => {
            this.toast.success(`Tipo de entidad ${actionName} exitosamente`);
            this.closeSlideOver();
            this.cargarItems();
          },
          error: (err: any) => {
            this.toast.error(`Error al actualizar el tipo de entidad`);
            console.error(err);
          }
        });
      } else {
        this.facade.crear({
          codigo: val.codigo!,
          nombre: val.nombre!
        }).subscribe({
          next: () => {
            this.toast.success(`Tipo de entidad ${actionName} exitosamente`);
            this.closeSlideOver();
            this.cargarItems();
          },
          error: (err: any) => {
            this.toast.error(`Error al crear el tipo de entidad`);
            console.error(err);
          }
        });
      }
    } else {
      this.tipoEntidadForm.markAllAsTouched();
    }
  }
}
