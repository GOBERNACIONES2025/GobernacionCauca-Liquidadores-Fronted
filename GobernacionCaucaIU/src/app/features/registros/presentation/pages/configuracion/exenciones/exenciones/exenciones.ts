import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaginationComponent } from '../../../../../../shared/components/pagination/pagination';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { SlideOverComponent } from '../../../../shared/components/slide-over/slide-over';
import { ExencionesFacade } from '../../../../../application/facades/Exenciones/exenciones.facade';
import { DepartamentosFacade } from '../../../../../application/facades/Territorios/departamentos.facade';
import { NormasFacade } from '../../../../../application/facades/Normatividad/normas.facade';
import { TiposBeneficiarioExencionFacade } from '../../../../../application/facades/Exenciones/tipos-beneficiario-exencion.facade';
import { RolesIntervinienteFacade } from '../../../../../application/facades/Intervinientes/roles-interviniente.facade';
import { Exencion } from '../../../../../domain/models/Exenciones/exencion.model';
import { ExencionesApiService } from '../../../../../infrastructure/api/Exenciones/exenciones-api.service';
import { ToastService } from '../../../../../../../core/services/toast.service';
import { DepartamentosApiService } from '../../../../../infrastructure/api/Territorios/departamentos-api.service';
import { NormasApiService } from '../../../../../infrastructure/api/Normatividad/normas-api.service';
import { TiposBeneficiarioExencionApiService } from '../../../../../infrastructure/api/Exenciones/tipos-beneficiario-exencion-api.service';
import { RolesIntervinienteApiService } from '../../../../../infrastructure/api/Intervinientes/roles-interviniente-api.service';
import { SearchableSelectComponent } from '../../../../../../../shared/components/searchable-select/searchable-select';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-exenciones',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PageHeaderComponent, SlideOverComponent, PaginationComponent, SearchableSelectComponent],
  templateUrl: './exenciones.html',
  styleUrl: './exenciones.css'
})
export class Exenciones implements OnInit {
  private fb = inject(FormBuilder);
  public facade = inject(ExencionesFacade);
  public apiService = inject(ExencionesApiService);
  public departamentosFacade = inject(DepartamentosFacade);
  public normasFacade = inject(NormasFacade);
  public tiposBeneficiarioFacade = inject(TiposBeneficiarioExencionFacade);
  public rolesFacade = inject(RolesIntervinienteFacade);
  
  private departamentosApi = inject(DepartamentosApiService);
  private normasApi = inject(NormasApiService);
  private tiposBeneficiarioApi = inject(TiposBeneficiarioExencionApiService);
  private rolesApi = inject(RolesIntervinienteApiService);
  private toast = inject(ToastService);

  breadcrumbs = ['Configuración', 'Exenciones', 'Exención'];

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

  exencionForm = this.fb.group({
    departamentoId: [null as number | null, Validators.required],
    normaId: [null as number | null, Validators.required],
    tipoBeneficiarioId: [null as number | null],
    rolIntervinienteId: [null as number | null],
    codigo: ['', [Validators.required, Validators.maxLength(20)]],
    nombre: ['', Validators.required],
    descripcion: [''],
    porcentaje: [null as number | null, [Validators.min(0), Validators.max(100)]],
    valorFijo: [null as number | null, [Validators.min(0)]],
    activo: [true]
  });

  searchDepartamentosFn = (term: string) => this.departamentosApi.obtenerTodos(1, 50, term).pipe(map(res => res.data.items));
  resolveDepartamentoFn = (id: number) => this.departamentosApi.obtenerPorId(id).pipe(map(res => res.data));

  searchNormasFn = (term: string) => this.normasApi.obtenerTodos(1, 50, term).pipe(map(res => res.data.items));
  resolveNormaFn = (id: number) => this.normasApi.obtenerPorId(id).pipe(map(res => res.data));

  searchTiposBeneficiarioFn = (term: string) => this.tiposBeneficiarioApi.obtenerTodos(1, 50, term).pipe(map(res => res.data.items));
  resolveTipoBeneficiarioFn = (id: number) => this.tiposBeneficiarioApi.obtenerPorId(id).pipe(map(res => res.data));

  searchRolesFn = (term: string) => this.rolesApi.obtenerTodos(1, 50, term).pipe(map(res => res.data.items));
  resolveRolFn = (id: number) => this.rolesApi.obtenerPorId(id).pipe(map(res => res.data));

  // Filtered list for table
  exencionesFiltradas = computed(() => this.facade.exenciones());

  // Dynamic counts
  counts = computed(() => {
    return {
      total: this.facade.totalExenciones()
    };
  });

  ngOnInit() {
    this.cargarItems();
  }

  cargarItems() {
    let activo: boolean | undefined = undefined;
    if (this.selectedFilter && this.selectedFilter() === 'activos') activo = true;
    if (this.selectedFilter && this.selectedFilter() === 'inactivos') activo = false;
    this.facade.cargarExenciones(this.pageNumber(), this.pageSize());
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
    const primerDep = this.departamentosFacade.departamentos()[0]?.id || null;
    const primeraNorma = this.normasFacade.normas()[0]?.id || null;

    this.exencionForm.reset({
      departamentoId: primerDep,
      normaId: primeraNorma,
      tipoBeneficiarioId: null,
      rolIntervinienteId: null,
      codigo: '',
      nombre: '',
      descripcion: '',
      porcentaje: null,
      valorFijo: null,
      activo: true
    });
    this.isSlideOverOpen = true;
  }

  edit(item: Exencion) {
    this.loadingEditId.set(item.id);
    this.apiService.obtenerPorId(item.id).subscribe({
      next: (res) => {
        this.loadingEditId.set(null);
        const data = res?.data || item;
        this.selectedId = data.id;
        this.exencionForm.patchValue({
          departamentoId: data.departamento?.id ?? (data as any).departamentoId ?? null,
          normaId: data.norma?.id ?? (data as any).normaId ?? null,
          tipoBeneficiarioId: data.tipoBeneficiario?.id ?? (data as any).tipoBeneficiarioId ?? null,
          rolIntervinienteId: data.rolInterviniente?.id ?? (data as any).rolIntervinienteId ?? null,
          codigo: data.codigo,
          nombre: data.nombre,
          descripcion: data.descripcion || '',
          porcentaje: data.porcentaje !== undefined ? data.porcentaje : null,
          valorFijo: data.valorFijo !== undefined ? data.valorFijo : null,
          activo: data.activo
        });
        this.isSlideOverOpen = true;
      },
      error: (err) => {
        this.loadingEditId.set(null);
        this.toast.error('Error al obtener la información de la exención');
        console.error(err);
      }
    });
  }

  toggleActivo(item: Exencion) {
    const nuevoEstado = !item.activo;
    const actionName = nuevoEstado ? 'activada' : 'desactivada';

    this.facade.actualizar(item.id, {
      id: item.id,
      departamentoId: item.departamento?.id || 1,
      normaId: item.norma?.id || 1,
      tipoBeneficiarioId: item.tipoBeneficiario?.id || null,
      rolIntervinienteId: item.rolInterviniente?.id || null,
      codigo: item.codigo,
      nombre: item.nombre,
      descripcion: item.descripcion || '',
      porcentaje: item.porcentaje,
      valorFijo: item.valorFijo,
      activo: nuevoEstado
    }).subscribe({
      next: () => {
        this.toast.success(`Exención ${actionName} exitosamente`);
        this.cargarItems();
      },
      error: (err: any) => {
        this.toast.error(`Error al actualizar la exención`);
        console.error(err);
      }
    });
  }

  closeSlideOver() {
    this.isSlideOverOpen = false;
    this.selectedId = null;
  }

  saveExencion() {
    if (this.exencionForm.valid) {
      const val = this.exencionForm.value;
      const actionName = this.isEditMode ? 'actualizada' : 'creada';

      const payload = {
        departamentoId: Number(val.departamentoId),
        normaId: Number(val.normaId),
        tipoBeneficiarioId: val.tipoBeneficiarioId ? Number(val.tipoBeneficiarioId) : null,
        rolIntervinienteId: val.rolIntervinienteId ? Number(val.rolIntervinienteId) : null,
        codigo: val.codigo!,
        nombre: val.nombre!,
        descripcion: val.descripcion || '',
        porcentaje: val.porcentaje,
        valorFijo: val.valorFijo
      };

      if (this.isEditMode) {
        this.facade.actualizar(this.selectedId!, {
          id: this.selectedId!,
          ...payload,
          activo: val.activo ?? true
        }).subscribe({
          next: () => {
            this.toast.success(`Exención ${actionName} exitosamente`);
            this.closeSlideOver();
            this.cargarItems();
          },
          error: (err: any) => {
            this.toast.error(`Error al actualizar la exención`);
            console.error(err);
          }
        });
      } else {
        this.facade.crear(payload).subscribe({
          next: () => {
            this.toast.success(`Exención ${actionName} exitosamente`);
            this.closeSlideOver();
            this.cargarItems();
          },
          error: (err: any) => {
            this.toast.error(`Error al crear la exención`);
            console.error(err);
          }
        });
      }
    } else {
      this.exencionForm.markAllAsTouched();
    }
  }
}
