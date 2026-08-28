import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaginationComponent } from '../../../../../../shared/components/pagination/pagination';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { SlideOverComponent } from '../../../../shared/components/slide-over/slide-over';
import { NaturalezasActoFacade } from '../../../../../application/facades/Registro/naturalezas-acto.facade';
import { NaturalezaActo } from '../../../../../domain/models/Registro/naturaleza-acto.model';
import { ToastService } from '../../../../../../../core/services/toast.service';

@Component({
  selector: 'app-naturalezas-acto',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PageHeaderComponent, SlideOverComponent, PaginationComponent],
  templateUrl: './naturalezas-acto.html',
  styleUrl: './naturalezas-acto.css'
})
export class NaturalezasActo implements OnInit {
  private fb = inject(FormBuilder);
  public facade = inject(NaturalezasActoFacade);
  private toast = inject(ToastService);

  breadcrumbs = ['Configuración', 'Actos Registrales', 'Naturaleza de Acto'];

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

  naturalezaForm = this.fb.group({
    codigo: ['', [Validators.required, Validators.maxLength(10)]],
    nombre: ['', Validators.required],
    descripcion: [''],
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
    this.naturalezaForm.reset({ codigo: '', nombre: '', descripcion: '', activo: true });
    this.isSlideOverOpen = true;
  }

  edit(item: NaturalezaActo) {
    this.selectedId = item.id;
    this.naturalezaForm.patchValue({
      codigo: item.codigo,
      nombre: item.nombre,
      descripcion: item.descripcion || '',
      activo: item.activo
    });
    this.isSlideOverOpen = true;
  }

  toggleActivo(item: NaturalezaActo) {
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
        this.toast.success(`Naturaleza de acto ${actionName} exitosamente`);
        this.cargarItems();
      },
      error: (err: any) => {
        this.toast.error(`Error al actualizar la naturaleza de acto`);
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
          activo: val.activo ?? true
        }).subscribe({
          next: () => {
            this.toast.success(`Naturaleza de acto ${actionName} exitosamente`);
            this.closeSlideOver();
            this.cargarItems();
          },
          error: (err: any) => {
            this.toast.error(`Error al actualizar la naturaleza de acto`);
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
            this.toast.success(`Naturaleza de acto ${actionName} exitosamente`);
            this.closeSlideOver();
            this.cargarItems();
          },
          error: (err: any) => {
            this.toast.error(`Error al crear la naturaleza de acto`);
            console.error(err);
          }
        });
      }
    } else {
      this.naturalezaForm.markAllAsTouched();
    }
  }
}
