import { Component, inject, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { SlideOverComponent } from '../../../../shared/components/slide-over/slide-over';
import { PaginationComponent } from '../../../../../../shared/components/pagination/pagination';
import { MunicipiosFacade } from '../../../../../application/facades/Territorios/municipios.facade';
import { DepartamentosFacade } from '../../../../../application/facades/Territorios/departamentos.facade';
import { Municipio } from '../../../../../domain/models/Territorios/municipio.model';
import { ToastService } from '../../../../../../../core/services/toast.service';

@Component({
  selector: 'app-municipios',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PageHeaderComponent, SlideOverComponent, PaginationComponent],
  templateUrl: './municipios.html',
  styleUrl: './municipios.css'
})
export class Municipios implements OnInit {
  private fb = inject(FormBuilder);
  public facade = inject(MunicipiosFacade);
  public departamentosFacade = inject(DepartamentosFacade);
  private toast = inject(ToastService);

  breadcrumbs = ['Configuración', 'Territorio', 'Municipio'];

  searchQuery = signal<string>('');
  private searchSubject = new Subject<string>();

  pageNumber = signal<number>(1);
  pageSize = signal<number>(10);
  
  selectedFilter = signal<'todos' | 'activos' | 'inactivos'>('todos');
  isSlideOverOpen = false;
  selectedId: number | null = null;

  get isEditMode(): boolean {
    return this.selectedId !== null;
  }

  municipioForm = this.fb.group({
    codigoDane: ['', [Validators.required, Validators.maxLength(5)]],
    nombre: ['', Validators.required],
    departamentoId: [null as number | null, Validators.required],
    activo: [true]
  });

  // Client side active/inactive filter only (if backend doesn't support state filter).
  // Otherwise, we just return all from facade.
  municipiosFiltrados = computed(() => {
    const filter = this.selectedFilter();
    let items = this.facade.municipios();

    if (filter === 'activos') {
      return items.filter(m => m.activo);
    } else if (filter === 'inactivos') {
      return items.filter(m => !m.activo);
    }
    return items;
  });

  constructor() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(query => {
      this.pageNumber.set(1);
      this.cargarDatos();
    });
  }

  onSearchChange(value: string) {
    this.searchQuery.set(value);
    this.searchSubject.next(value);
  }

  cargarDatos() {
    this.facade.cargarMunicipios(this.pageNumber(), this.pageSize(), this.searchQuery());
  }

  onPageChange(page: number) {
    this.pageNumber.set(page);
    this.cargarDatos();
  }

  onPageSizeChange(size: number) {
    this.pageSize.set(size);
    this.pageNumber.set(1);
    this.cargarDatos();
  }

  ngOnInit() {
    this.cargarDatos();
    this.departamentosFacade.cargarDepartamentos(1, 100);
  }

  setFilter(filter: 'todos' | 'activos' | 'inactivos') {
    this.selectedFilter.set(filter);
  }

  // Dynamic counts
  counts = computed(() => {
    const all = this.facade.municipios();
    return {
      total: all.length,
      active: all.filter(m => m.activo).length,
      inactive: all.filter(m => !m.activo).length
    };
  });


  resolveDepartamentoId(item: Municipio): number {
    if (item.departamentoId) {
      return item.departamentoId;
    }
    if (item.departamento && typeof item.departamento === 'object' && (item.departamento as any).id) {
      return (item.departamento as any).id;
    }
    if ((item as any).idDepartamento) {
      return (item as any).idDepartamento;
    }
    if (typeof item.departamento === 'string') {
      const match = this.departamentosFacade.departamentos().find(
        d => d.nombre.toLowerCase() === (item.departamento as string).toLowerCase()
      );
      if (match) return match.id;
    }
    const primerDep = this.departamentosFacade.departamentos()[0]?.id;
    return primerDep || 1;
  }

  getDepartamentoNombre(item: Municipio): string {
    if (item.departamentoId) {
      const dep = this.departamentosFacade.departamentos().find(d => d.id === item.departamentoId);
      if (dep) return dep.nombre;
    }
    if (typeof item.departamento === 'string') {
      return item.departamento;
    }
    if (item.departamento && typeof item.departamento === 'object') {
      return (item.departamento as any).nombre || '';
    }
    return '';
  }



  openNew() {
    this.selectedId = null;
    const primerDep = this.departamentosFacade.departamentos()[0]?.id || null;
    this.municipioForm.reset({ 
      codigoDane: '',
      nombre: '',
      departamentoId: primerDep,
      activo: true 
    });
    this.isSlideOverOpen = true;
  }

  edit(item: Municipio) {
    this.selectedId = item.id;
    const depId = this.resolveDepartamentoId(item);

    this.municipioForm.patchValue({
      codigoDane: item.codigoDane,
      nombre: item.nombre,
      departamentoId: depId,
      activo: item.activo
    });
    this.isSlideOverOpen = true;
  }

  toggleActivo(item: Municipio) {
    const nuevoEstado = !item.activo;
    const actionName = nuevoEstado ? 'activado' : 'desactivado';
    const depId = this.resolveDepartamentoId(item);

    this.facade.actualizarMunicipio(item.id, {
      codigoDane: item.codigoDane,
      nombre: item.nombre,
      activo: nuevoEstado,
      departamentoId: depId
    }).subscribe({
      next: () => {
        this.toast.success(`Municipio ${actionName} exitosamente`);
        this.cargarDatos();
      },
      error: (err: any) => {
        this.toast.error(`Error al actualizar estado del municipio`);
        console.error(err);
      }
    });
  }


  closeSlideOver() {
    this.isSlideOverOpen = false;
    this.selectedId = null;
  }

  saveMunicipio() {
    if (this.municipioForm.valid) {
      const val = this.municipioForm.value;
      const actionName = this.isEditMode ? 'actualizado' : 'creado';
      const depId = Number(val.departamentoId);

      const payload: Partial<Municipio> = {
        codigoDane: val.codigoDane!,
        nombre: val.nombre!,
        activo: val.activo ?? true,
        departamentoId: depId
      };

      const observer = {
        next: () => {
          this.toast.success(`Municipio ${actionName} exitosamente`);
          this.closeSlideOver();
          this.cargarDatos();
        },
        error: (err: any) => {
          this.toast.error(`Error al intentar guardar el municipio`);
          console.error(err);
        }
      };

      if (this.isEditMode) {
        this.facade.actualizarMunicipio(this.selectedId!, payload).subscribe(observer);
      } else {
        this.facade.crearMunicipio(payload).subscribe(observer);
      }
    } else {
      this.municipioForm.markAllAsTouched();
    }
  }
}

