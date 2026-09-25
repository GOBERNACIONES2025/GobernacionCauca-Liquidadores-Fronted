import { Component, inject, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { TableSearchComponent } from '../../../../shared/components/table-search/table-search';
import { SlideOverComponent } from '../../../../shared/components/slide-over/slide-over';
import { PaginationComponent } from '../../../../../../shared/components/pagination/pagination';
import { FormFieldErrorComponent } from '../../../../../../shared/components/form-error/form-error.component';
import { MunicipiosFacade } from '../../../../../application/facades/Territorios/municipios.facade';
import { DepartamentosFacade } from '../../../../../application/facades/Territorios/departamentos.facade';
import { Municipio } from '../../../../../domain/models/Territorios/municipio.model';
import { MunicipiosApiService } from '../../../../../infrastructure/api/Territorios/municipios-api.service';
import { ToastService } from '../../../../../../../core/services/toast.service';
import { SearchableSelectComponent } from '../../../../../../../shared/components/searchable-select/searchable-select';
import { DepartamentosApiService } from '../../../../../infrastructure/api/Territorios/departamentos-api.service';
import { map } from 'rxjs/operators';

import { ConfirmModalComponent } from '../../../../shared/components/confirm-modal/confirm-modal.component';
import { formatUserErrorMessage } from '../../../../shared/utils/error-formatter.util';

@Component({
  selector: 'app-municipios',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PageHeaderComponent, TableSearchComponent, SlideOverComponent, PaginationComponent, SearchableSelectComponent, FormFieldErrorComponent, ConfirmModalComponent],
  templateUrl: './municipios.html',
  styleUrl: './municipios.css'
})
export class Municipios implements OnInit {
  private fb = inject(FormBuilder);
  public facade = inject(MunicipiosFacade);
  public apiService = inject(MunicipiosApiService);
  public departamentosFacade = inject(DepartamentosFacade);
  private departamentosApi = inject(DepartamentosApiService);
  private toast = inject(ToastService);

  breadcrumbs = ['Configuración', 'Territorio', 'Municipio'];

  searchText = signal<string>('');

  pageNumber = signal<number>(1);
  pageSize = signal<number>(10);
  loadingEditId = signal<number | null>(null);
  
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

  searchDepartamentosFn = (term: string) => this.departamentosApi.obtenerTodos(1, 50, term).pipe(
    map(res => res.data.items)
  );

  resolveDepartamentoFn = (id: number) => this.departamentosApi.obtenerPorId(id).pipe(
    map(res => res.data)
  );

  // Client side active/inactive filter only (if backend doesn't support state filter).
  // Otherwise, we just return all from facade.
  municipiosFiltrados = computed(() => this.facade.municipios());

  onSearch(term: string) {
    this.searchText.set(term);
    this.pageNumber.set(1);
    this.cargarDatos();
  }

  onClearSearch() {
    this.searchText.set('');
    this.pageNumber.set(1);
    this.cargarDatos();
  }

  cargarDatos() {
    this.facade.cargarMunicipios(this.pageNumber(), this.pageSize(), this.searchText());
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
    return {
      total: this.facade.totalMunicipios()
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
    this.loadingEditId.set(item.id);
    this.apiService.obtenerPorId(item.id).subscribe({
      next: (res) => {
        this.loadingEditId.set(null);
        const data = res?.data || item;
        this.selectedId = data.id;
        const depId = this.resolveDepartamentoId(data);

        this.municipioForm.patchValue({
          codigoDane: data.codigoDane,
          nombre: data.nombre,
          departamentoId: depId,
          activo: data.activo
        });
        this.isSlideOverOpen = true;
      },
      error: (err) => {
        this.loadingEditId.set(null);
        this.toast.error('Error al obtener la información del municipio');
        console.error(err);
      }
    });
  }

  // Smart Confirmation Modal State (Criteria 6, 10 & 16)
  isConfirmModalOpen = signal<boolean>(false);
  itemToToggle = signal<Municipio | null>(null);
  isTogglingStatus = signal<boolean>(false);

  promptToggleActivo(item: Municipio) {
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
    const depId = this.resolveDepartamentoId(item);
    this.isTogglingStatus.set(true);

    this.facade.actualizarMunicipio(item.id, {
      codigoDane: item.codigoDane,
      nombre: item.nombre,
      activo: nuevoEstado,
      departamentoId: depId
    }).subscribe({
      next: () => {
        this.isTogglingStatus.set(false);
        this.isConfirmModalOpen.set(false);
        this.itemToToggle.set(null);
        this.toast.success(`Municipio "${item.nombre}" ${actionName} exitosamente`);
        this.cargarDatos();
      },
      error: (err: any) => {
        this.isTogglingStatus.set(false);
        this.toast.error(formatUserErrorMessage(err, `actualizar estado del municipio "${item.nombre}"`));
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
          this.toast.success(`Municipio "${payload.nombre}" ${actionName} exitosamente`);
          this.closeSlideOver();
          this.cargarDatos();
        },
        error: (err: any) => {
          this.toast.error(formatUserErrorMessage(err, 'guardar el municipio'));
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
      this.toast.warning('Por favor complete los campos obligatorios del formulario.');
    }
  }
}

