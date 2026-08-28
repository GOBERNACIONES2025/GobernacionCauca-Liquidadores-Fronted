import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaginationComponent } from '../../../../../../shared/components/pagination/pagination';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { SlideOverComponent } from '../../../../shared/components/slide-over/slide-over';
import { DepartamentosFacade } from '../../../../../application/facades/Territorios/departamentos.facade';
import { Departamento } from '../../../../../domain/models/Territorios/departamento.model';
import { ToastService } from '../../../../../../../core/services/toast.service';

@Component({
  selector: 'app-departamentos',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PageHeaderComponent, SlideOverComponent, PaginationComponent],
  templateUrl: './departamentos.html',
  styleUrl: './departamentos.css'
})
export class Departamentos implements OnInit {
  private fb = inject(FormBuilder);
  public facade = inject(DepartamentosFacade);
  private toast = inject(ToastService);

  breadcrumbs = ['Configuración', 'Territorio', 'Departamento'];

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

  departamentoForm = this.fb.group({
    codigoDane: ['', [Validators.required, Validators.maxLength(2)]],
    nombre: ['', Validators.required],
    activo: [true]
  });

  // Filtered department list for table
  departamentosFiltrados = computed(() => this.facade.departamentos());

  // Real-time calculated counters
  counts = computed(() => {
    return {
      total: this.facade.totalDepartamentos()
    };
  });

  ngOnInit() {
    this.cargarItems();
  }

  cargarItems() {
    let activo: boolean | undefined = undefined;
    if (this.selectedFilter && this.selectedFilter() === 'activos') activo = true;
    if (this.selectedFilter && this.selectedFilter() === 'inactivos') activo = false;
    this.facade.cargarDepartamentos(this.pageNumber(), this.pageSize(), this.searchText(), activo);
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
    this.departamentoForm.reset({ activo: true });
    this.isSlideOverOpen = true;
  }

  edit(item: Departamento) {
    this.selectedId = item.id;
    this.departamentoForm.patchValue({
      codigoDane: item.codigoDane,
      nombre: item.nombre,
      activo: item.activo
    });
    this.isSlideOverOpen = true;
  }

  toggleActivo(item: Departamento) {
    const nuevoEstado = !item.activo;
    const actionName = nuevoEstado ? 'activado' : 'desactivado';

    this.facade.actualizarDepartamento(item.id, {
      codigoDane: item.codigoDane,
      nombre: item.nombre,
      activo: nuevoEstado
    }).subscribe({
      next: () => {
        this.toast.success(`Departamento ${actionName} exitosamente`);
        this.cargarItems();
      },
      error: (err: any) => {
        this.toast.error(`Error al actualizar estado del departamento`);
        console.error(err);
      }
    });
  }

  closeSlideOver() {
    this.isSlideOverOpen = false;
    this.selectedId = null;
  }

  saveDepartamento() {
    if (this.departamentoForm.valid) {
      const data = this.departamentoForm.value as Partial<Departamento>;
      const actionName = this.isEditMode ? 'actualizado' : 'creado';
      
      const observer = {
        next: () => {
          this.toast.success(`Departamento ${actionName} exitosamente`);
          this.closeSlideOver();
          this.cargarItems();
        },
        error: (err: any) => {
          this.toast.error(`Error al intentar guardar el departamento`);
          console.error(err);
        }
      };

      if (this.isEditMode) {
        this.facade.actualizarDepartamento(this.selectedId!, data).subscribe(observer);
      } else {
        this.facade.crearDepartamento(data).subscribe(observer);
      }
    } else {
      this.departamentoForm.markAllAsTouched();
    }
  }
}


