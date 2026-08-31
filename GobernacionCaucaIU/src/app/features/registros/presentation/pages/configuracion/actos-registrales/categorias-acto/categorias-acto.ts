import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaginationComponent } from '../../../../../../shared/components/pagination/pagination';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { SlideOverComponent } from '../../../../shared/components/slide-over/slide-over';
import { CategoriasActoFacade } from '../../../../../application/facades/Registro/categorias-acto.facade';
import { CategoriaActo } from '../../../../../domain/models/Registro/categoria-acto.model';
import { CategoriasActoApiService } from '../../../../../infrastructure/api/Registro/categorias-acto-api.service';
import { ToastService } from '../../../../../../../core/services/toast.service';

@Component({
  selector: 'app-categorias-acto',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PageHeaderComponent, SlideOverComponent, PaginationComponent],
  templateUrl: './categorias-acto.html',
  styleUrl: './categorias-acto.css'
})
export class CategoriasActo implements OnInit {
  private fb = inject(FormBuilder);
  public facade = inject(CategoriasActoFacade);
  public apiService = inject(CategoriasActoApiService);
  private toast = inject(ToastService);

  breadcrumbs = ['Configuración', 'Actos Registrales', 'Categoría de Acto'];

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

  categoriaForm = this.fb.group({
    codigo: ['', [Validators.required, Validators.maxLength(10)]],
    nombre: ['', Validators.required],
    descripcion: [''],
    activo: [true]
  });

  // Filtered list
  categoriasFiltradas = computed(() => this.facade.categoriasActo());

  // Dynamic counts
  counts = computed(() => {
    return {
      total: this.facade.totalCategoriasActo()
    };
  });

  ngOnInit() {
    this.cargarItems();
  }

  cargarItems() {
    let activo: boolean | undefined = undefined;
    if (this.selectedFilter && this.selectedFilter() === 'activos') activo = true;
    if (this.selectedFilter && this.selectedFilter() === 'inactivos') activo = false;
    this.facade.cargarCategoriasActo(this.pageNumber(), this.pageSize(), this.searchText(), activo);
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
    this.categoriaForm.reset({ codigo: '', nombre: '', descripcion: '', activo: true });
    this.isSlideOverOpen = true;
  }

  edit(item: CategoriaActo) {
    this.loadingEditId.set(item.id);
    this.apiService.obtenerPorId(item.id).subscribe({
      next: (res) => {
        this.loadingEditId.set(null);
        const data = res?.data || item;
        this.selectedId = data.id;
        this.categoriaForm.patchValue({
          codigo: data.codigo,
          nombre: data.nombre,
          descripcion: data.descripcion || '',
          activo: data.activo
        });
        this.isSlideOverOpen = true;
      },
      error: (err) => {
        this.loadingEditId.set(null);
        this.toast.error('Error al obtener la información de la categoría');
        console.error(err);
      }
    });
  }

  toggleActivo(item: CategoriaActo) {
    const nuevoEstado = !item.activo;
    const actionName = nuevoEstado ? 'activada' : 'desactivada';

    this.facade.actualizar(item.id, {
      id: item.id,
      codigo: item.codigo,
      nombre: item.nombre,
      descripcion: item.descripcion || '',
      activo: nuevoEstado
    }).subscribe({
      next: () => {
        this.toast.success(`Categoría de acto ${actionName} exitosamente`);
        this.cargarItems();
      },
      error: (err: any) => {
        this.toast.error(`Error al actualizar la categoría de acto`);
        console.error(err);
      }
    });
  }

  closeSlideOver() {
    this.isSlideOverOpen = false;
    this.selectedId = null;
  }

  saveCategoria() {
    if (this.categoriaForm.valid) {
      const val = this.categoriaForm.value;
      const actionName = this.isEditMode ? 'actualizada' : 'creada';

      if (this.isEditMode) {
        this.facade.actualizar(this.selectedId!, {
          id: this.selectedId!,
          codigo: val.codigo!,
          nombre: val.nombre!,
          descripcion: val.descripcion || '',
          activo: val.activo ?? true
        }).subscribe({
          next: () => {
            this.toast.success(`Categoría de acto ${actionName} exitosamente`);
            this.closeSlideOver();
            this.cargarItems();
          },
          error: (err: any) => {
            this.toast.error(`Error al actualizar la categoría de acto`);
            console.error(err);
          }
        });
      } else {
        this.facade.crear({
          codigo: val.codigo!,
          nombre: val.nombre!,
          descripcion: val.descripcion || ''
        }).subscribe({
          next: () => {
            this.toast.success(`Categoría de acto ${actionName} exitosamente`);
            this.closeSlideOver();
            this.cargarItems();
          },
          error: (err: any) => {
            this.toast.error(`Error al crear la categoría de acto`);
            console.error(err);
          }
        });
      }
    } else {
      this.categoriaForm.markAllAsTouched();
    }
  }
}
