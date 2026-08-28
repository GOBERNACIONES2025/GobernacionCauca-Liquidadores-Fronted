import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaginationComponent } from '../../../../../../shared/components/pagination/pagination';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { SlideOverComponent } from '../../../../shared/components/slide-over/slide-over';
import { VigenciasFacade } from '../../../../../application/facades/Normatividad/vigencias.facade';
import { Vigencia } from '../../../../../domain/models/Normatividad/vigencia.model';
import { ToastService } from '../../../../../../../core/services/toast.service';

@Component({
  selector: 'app-vigencias',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PageHeaderComponent, SlideOverComponent, PaginationComponent],
  templateUrl: './vigencias.html',
  styleUrl: './vigencias.css'
})
export class Vigencias implements OnInit {
  private fb = inject(FormBuilder);
  public facade = inject(VigenciasFacade);
  private toast = inject(ToastService);

  breadcrumbs = ['Configuración', 'Normatividad', 'Vigencia'];

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

  vigenciaForm = this.fb.group({
    anio: [new Date().getFullYear(), [Validators.required, Validators.min(1900), Validators.max(2100)]],
    fechaInicio: [`${new Date().getFullYear()}-01-01`, Validators.required],
    fechaFin: [`${new Date().getFullYear()}-12-31`, Validators.required],
    activo: [true]
  });

  // Filtered list
  vigenciasFiltradas = computed(() => this.facade.vigencias());

  // Dynamic counts
  counts = computed(() => {
    return {
      total: this.facade.totalVigencias()
    };
  });

  ngOnInit() {
    this.cargarItems();
  }

  cargarItems() {
    let activo: boolean | undefined = undefined;
    if (this.selectedFilter && this.selectedFilter() === 'activos') activo = true;
    if (this.selectedFilter && this.selectedFilter() === 'inactivos') activo = false;
    this.facade.cargarVigencias(this.pageNumber(), this.pageSize(), this.searchText(), activo);
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
    const year = new Date().getFullYear();
    this.vigenciaForm.reset({
      anio: year,
      fechaInicio: `${year}-01-01`,
      fechaFin: `${year}-12-31`,
      activo: true
    });
    this.isSlideOverOpen = true;
  }

  edit(item: Vigencia) {
    this.selectedId = item.id;
    const fInicio = item.fechaInicio ? item.fechaInicio.split('T')[0] : '';
    const fFin = item.fechaFin ? item.fechaFin.split('T')[0] : '';

    this.vigenciaForm.patchValue({
      anio: item.anio,
      fechaInicio: fInicio,
      fechaFin: fFin,
      activo: item.activo
    });
    this.isSlideOverOpen = true;
  }

  toggleActivo(item: Vigencia) {
    const nuevoEstado = !item.activo;
    const actionName = nuevoEstado ? 'activada' : 'desactivada';

    this.facade.actualizar(item.id, {
      id: item.id,
      anio: item.anio,
      fechaInicio: item.fechaInicio,
      fechaFin: item.fechaFin,
      activo: nuevoEstado
    }).subscribe({
      next: () => {
        this.toast.success(`Vigencia ${actionName} exitosamente`);
        this.cargarItems();
      },
      error: (err: any) => {
        this.toast.error(`Error al actualizar la vigencia`);
        console.error(err);
      }
    });
  }

  closeSlideOver() {
    this.isSlideOverOpen = false;
    this.selectedId = null;
  }

  saveVigencia() {
    if (this.vigenciaForm.valid) {
      const val = this.vigenciaForm.value;
      const actionName = this.isEditMode ? 'actualizada' : 'creada';

      if (this.isEditMode) {
        this.facade.actualizar(this.selectedId!, {
          id: this.selectedId!,
          anio: Number(val.anio),
          fechaInicio: val.fechaInicio!,
          fechaFin: val.fechaFin!,
          activo: val.activo ?? true
        }).subscribe({
          next: () => {
            this.toast.success(`Vigencia ${actionName} exitosamente`);
            this.closeSlideOver();
            this.cargarItems();
          },
          error: (err: any) => {
            this.toast.error(`Error al actualizar la vigencia`);
            console.error(err);
          }
        });
      } else {
        this.facade.crear({
          anio: Number(val.anio),
          fechaInicio: val.fechaInicio!,
          fechaFin: val.fechaFin!
        }).subscribe({
          next: () => {
            this.toast.success(`Vigencia ${actionName} exitosamente`);
            this.closeSlideOver();
            this.cargarItems();
          },
          error: (err: any) => {
            this.toast.error(`Error al crear la vigencia`);
            console.error(err);
          }
        });
      }
    } else {
      this.vigenciaForm.markAllAsTouched();
    }
  }
}
