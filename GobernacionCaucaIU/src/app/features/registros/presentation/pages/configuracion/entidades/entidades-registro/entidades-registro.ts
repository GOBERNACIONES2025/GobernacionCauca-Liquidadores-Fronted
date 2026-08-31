import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaginationComponent } from '../../../../../../shared/components/pagination/pagination';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { SlideOverComponent } from '../../../../shared/components/slide-over/slide-over';
import { EntidadesRegistroFacade } from '../../../../../application/facades/Registro/entidades-registro.facade';
import { TiposEntidadRegistroFacade } from '../../../../../application/facades/Registro/tipos-entidad-registro.facade';
import { DepartamentosFacade } from '../../../../../application/facades/Territorios/departamentos.facade';
import { MunicipiosFacade } from '../../../../../application/facades/Territorios/municipios.facade';
import { EntidadRegistro } from '../../../../../domain/models/Registro/entidad-registro.model';
import { EntidadesRegistroApiService } from '../../../../../infrastructure/api/Registro/entidades-registro-api.service';
import { ToastService } from '../../../../../../../core/services/toast.service';
import { TiposEntidadRegistroApiService } from '../../../../../infrastructure/api/Registro/tipos-entidad-registro-api.service';
import { DepartamentosApiService } from '../../../../../infrastructure/api/Territorios/departamentos-api.service';
import { MunicipiosApiService } from '../../../../../infrastructure/api/Territorios/municipios-api.service';
import { SearchableSelectComponent } from '../../../../../../../shared/components/searchable-select/searchable-select';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-entidades-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PageHeaderComponent, SlideOverComponent, PaginationComponent, SearchableSelectComponent],
  templateUrl: './entidades-registro.html',
  styleUrl: './entidades-registro.css'
})
export class EntidadesRegistro implements OnInit {
  private fb = inject(FormBuilder);
  public facade = inject(EntidadesRegistroFacade);
  public apiService = inject(EntidadesRegistroApiService);
  public tiposEntidadFacade = inject(TiposEntidadRegistroFacade);
  public departamentosFacade = inject(DepartamentosFacade);
  public municipiosFacade = inject(MunicipiosFacade);
  
  private tiposEntidadApi = inject(TiposEntidadRegistroApiService);
  private departamentosApi = inject(DepartamentosApiService);
  private municipiosApi = inject(MunicipiosApiService);
  private toast = inject(ToastService);

  breadcrumbs = ['Configuración', 'Entidades', 'Entidad de Registro'];

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

    this.entidadForm.get('departamentoId')?.valueChanges.subscribe(depId => {
      // Clear municipio if it's a user interaction change
      if (this.isSlideOverOpen && !this.loadingEditId()) {
        const currentMun = this.entidadForm.get('municipioId')?.value;
        if (currentMun !== null) {
          this.entidadForm.get('municipioId')?.setValue(null, { emitEvent: false });
        }
      }
      
      if (depId) {
        this.municipiosFacade.cargarMunicipios(1, 1000, undefined, true, depId);
      }
    });
  }
  searchSubject = new Subject<string>();
  selectedFilter = signal<'todos' | 'activos' | 'inactivos'>('todos');

  isSlideOverOpen = false;
  selectedId: number | null = null;

  get isEditMode(): boolean {
    return this.selectedId !== null;
  }

  entidadForm = this.fb.group({
    tipoEntidadRegistroId: [null as number | null, Validators.required],
    departamentoId: [null as number | null, Validators.required],
    municipioId: [null as number | null, Validators.required],
    nit: ['', [Validators.required, Validators.maxLength(20)]],
    codigo: ['', [Validators.required, Validators.maxLength(20)]],
    nombre: ['', Validators.required],
    emailContacto: ['', [Validators.email]],
    activo: [true]
  });

  searchTiposEntidadFn = (term: string) => this.tiposEntidadApi.obtenerTodos(1, 50, term).pipe(map(res => res.data.items));
  resolveTipoEntidadFn = (id: number) => this.tiposEntidadApi.obtenerPorId(id).pipe(map(res => res.data));

  searchDepartamentosFn = (term: string) => this.departamentosApi.obtenerTodos(1, 50, term).pipe(map(res => res.data.items));
  resolveDepartamentoFn = (id: number) => this.departamentosApi.obtenerPorId(id).pipe(map(res => res.data));

  searchMunicipiosFn = (term: string) => {
    const depId = this.entidadForm.get('departamentoId')?.value;
    return this.municipiosApi.obtenerTodos(1, 50, term, depId ? Number(depId) : undefined).pipe(map(res => res.data.items));
  };
  resolveMunicipioFn = (id: number) => this.municipiosApi.obtenerPorId(id).pipe(map(res => res.data));

  // Filtered municipios based on selected departamento in form
  municipiosFiltradosForm = computed(() => this.municipiosFacade.municipios());

  // Dynamic counts
  entidadesFiltradas = computed(() => this.facade.entidadesRegistro());
  counts = computed(() => {
    return {
      total: this.facade.totalEntidadesRegistro()
    };
  });

  ngOnInit() {
    this.cargarItems();
  }

  cargarItems() {
    let activo: boolean | undefined = undefined;
    if (this.selectedFilter && this.selectedFilter() === 'activos') activo = true;
    if (this.selectedFilter && this.selectedFilter() === 'inactivos') activo = false;
    this.facade.cargarEntidadesRegistro(this.pageNumber(), this.pageSize());
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
    const primerTipo = this.tiposEntidadFacade.tiposEntidadRegistro()[0]?.id || null;
    const primerDep = this.departamentosFacade.departamentos()[0]?.id || null;
    const primerMun = this.municipiosFacade.municipios()[0]?.id || null;

    this.entidadForm.reset({
      tipoEntidadRegistroId: primerTipo,
      departamentoId: primerDep,
      municipioId: primerMun,
      nit: '',
      codigo: '',
      nombre: '',
      emailContacto: '',
      activo: true
    });
    this.isSlideOverOpen = true;
  }

  edit(item: EntidadRegistro) {
    this.loadingEditId.set(item.id);
    this.apiService.obtenerPorId(item.id).subscribe({
      next: (res) => {
        this.loadingEditId.set(null);
        const data = res?.data || item;
        this.selectedId = data.id;
        
        const depId = data.departamento?.id ?? (data as any).departamentoId ?? null;
        if (depId) {
          this.municipiosFacade.cargarMunicipios(1, 1000, undefined, true, depId);
        }

        this.entidadForm.patchValue({
          tipoEntidadRegistroId: data.tipoEntidadRegistro?.id ?? (data as any).tipoEntidadRegistroId ?? null,
          departamentoId: depId,
          municipioId: data.municipio?.id ?? (data as any).municipioId ?? null,
          nit: data.nit,
          codigo: data.codigo,
          nombre: data.nombre,
          emailContacto: data.emailContacto || '',
          activo: data.activo
        });
        this.isSlideOverOpen = true;
      },
      error: (err) => {
        this.loadingEditId.set(null);
        this.toast.error('Error al obtener la información de la entidad');
        console.error(err);
      }
    });
  }

  toggleActivo(item: EntidadRegistro) {
    const nuevoEstado = !item.activo;
    const actionName = nuevoEstado ? 'activada' : 'desactivada';

    this.facade.actualizar(item.id, {
      id: item.id,
      tipoEntidadRegistroId: item.tipoEntidadRegistro?.id || 1,
      departamentoId: item.departamento?.id || 1,
      municipioId: item.municipio?.id || 1,
      nit: item.nit,
      codigo: item.codigo,
      nombre: item.nombre,
      emailContacto: item.emailContacto || '',
      activo: nuevoEstado
    }).subscribe({
      next: () => {
        this.toast.success(`Entidad de registro ${actionName} exitosamente`);
        this.cargarItems();
      },
      error: (err: any) => {
        this.toast.error(`Error al actualizar la entidad de registro`);
        console.error(err);
      }
    });
  }

  closeSlideOver() {
    this.isSlideOverOpen = false;
    this.selectedId = null;
  }

  saveEntidad() {
    if (this.entidadForm.valid) {
      const val = this.entidadForm.value;
      const actionName = this.isEditMode ? 'actualizada' : 'creada';

      if (this.isEditMode) {
        this.facade.actualizar(this.selectedId!, {
          id: this.selectedId!,
          tipoEntidadRegistroId: Number(val.tipoEntidadRegistroId),
          departamentoId: Number(val.departamentoId),
          municipioId: Number(val.municipioId),
          nit: val.nit!,
          codigo: val.codigo!,
          nombre: val.nombre!,
          emailContacto: val.emailContacto || '',
          activo: val.activo ?? true
        }).subscribe({
          next: () => {
            this.toast.success(`Entidad de registro ${actionName} exitosamente`);
            this.closeSlideOver();
            this.cargarItems();
          },
          error: (err: any) => {
            this.toast.error(`Error al actualizar la entidad de registro`);
            console.error(err);
          }
        });
      } else {
        this.facade.crear({
          tipoEntidadRegistroId: Number(val.tipoEntidadRegistroId),
          departamentoId: Number(val.departamentoId),
          municipioId: Number(val.municipioId),
          nit: val.nit!,
          codigo: val.codigo!,
          nombre: val.nombre!,
          emailContacto: val.emailContacto || ''
        }).subscribe({
          next: () => {
            this.toast.success(`Entidad de registro ${actionName} exitosamente`);
            this.closeSlideOver();
            this.cargarItems();
          },
          error: (err: any) => {
            this.toast.error(`Error al crear la entidad de registro`);
            console.error(err);
          }
        });
      }
    } else {
      this.entidadForm.markAllAsTouched();
    }
  }
}
