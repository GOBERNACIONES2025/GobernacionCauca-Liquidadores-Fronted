import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaginationComponent } from '../../../../../../shared/components/pagination/pagination';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { SlideOverComponent } from '../../../../shared/components/slide-over/slide-over';
import { TarifasFacade } from '../../../../../application/facades/Tarifas/tarifas.facade';
import { DepartamentosFacade } from '../../../../../application/facades/Territorios/departamentos.facade';
import { TiposActoRegistroFacade } from '../../../../../application/facades/Registro/tipos-acto-registro.facade';
import { VigenciasFacade } from '../../../../../application/facades/Normatividad/vigencias.facade';
import { NormasFacade } from '../../../../../application/facades/Normatividad/normas.facade';
import { TiposCalculoTarifaFacade } from '../../../../../application/facades/Tarifas/tipos-calculo-tarifa.facade';
import { Tarifa } from '../../../../../domain/models/Tarifas/tarifa.model';
import { TarifasApiService } from '../../../../../infrastructure/api/Tarifas/tarifas-api.service';
import { ToastService } from '../../../../../../../core/services/toast.service';
import { DepartamentosApiService } from '../../../../../infrastructure/api/Territorios/departamentos-api.service';
import { TiposActoRegistroApiService } from '../../../../../infrastructure/api/Registro/tipos-acto-registro-api.service';
import { VigenciasApiService } from '../../../../../infrastructure/api/Normatividad/vigencias-api.service';
import { NormasApiService } from '../../../../../infrastructure/api/Normatividad/normas-api.service';
import { TiposCalculoTarifaApiService } from '../../../../../infrastructure/api/Tarifas/tipos-calculo-tarifa-api.service';
import { SearchableSelectComponent } from '../../../../../../../shared/components/searchable-select/searchable-select';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-tarifas',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PageHeaderComponent, SlideOverComponent, PaginationComponent, SearchableSelectComponent],
  templateUrl: './tarifas.html',
  styleUrl: './tarifas.css'
})
export class Tarifas implements OnInit {
  private fb = inject(FormBuilder);
  public facade = inject(TarifasFacade);
  public apiService = inject(TarifasApiService);
  public departamentosFacade = inject(DepartamentosFacade);
  public tiposActoFacade = inject(TiposActoRegistroFacade);
  public vigenciasFacade = inject(VigenciasFacade);
  public normasFacade = inject(NormasFacade);
  public tiposCalculoFacade = inject(TiposCalculoTarifaFacade);
  
  private departamentosApi = inject(DepartamentosApiService);
  private tiposActoApi = inject(TiposActoRegistroApiService);
  private vigenciasApi = inject(VigenciasApiService);
  private normasApi = inject(NormasApiService);
  private tiposCalculoApi = inject(TiposCalculoTarifaApiService);
  private toast = inject(ToastService);

  breadcrumbs = ['Configuración', 'Tarifas', 'Tarifa'];

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

  tarifaForm = this.fb.group({
    departamentoId: [null as number | null, Validators.required],
    tipoActoRegistroId: [null as number | null, Validators.required],
    vigenciaId: [null as number | null, Validators.required],
    normaId: [null as number | null, Validators.required],
    tipoCalculoTarifaId: [null as number | null, Validators.required],
    porcentaje: [null as number | null],
    valorFijo: [null as number | null],
    baseMinima: [null as number | null],
    baseMaxima: [null as number | null],
    valorMinimo: [null as number | null],
    valorMaximo: [null as number | null],
    activo: [true]
  });

  searchDepartamentosFn = (term: string) => this.departamentosApi.obtenerTodos(1, 50, term).pipe(map(res => res.data.items));
  resolveDepartamentoFn = (id: number) => this.departamentosApi.obtenerPorId(id).pipe(map(res => res.data));

  searchTiposActoFn = (term: string) => this.tiposActoApi.obtenerTodos(1, 50, term).pipe(map(res => res.data.items));
  resolveTipoActoFn = (id: number) => this.tiposActoApi.obtenerPorId(id).pipe(map(res => res.data));

  searchVigenciasFn = (term: string) => this.vigenciasApi.obtenerTodos({ pageNumber: 1, pageSize: 50, search: term }).pipe(map(res => res.data.items));
  resolveVigenciaFn = (id: number) => this.vigenciasApi.obtenerPorId(id).pipe(map(res => res.data));

  searchNormasFn = (term: string) => this.normasApi.obtenerTodos(1, 50, term).pipe(map(res => res.data.items));
  resolveNormaFn = (id: number) => this.normasApi.obtenerPorId(id).pipe(map(res => res.data));

  searchTiposCalculoFn = (term: string) => this.tiposCalculoApi.obtenerTodos(1, 50, term).pipe(map(res => res.data.items));
  resolveTipoCalculoFn = (id: number) => this.tiposCalculoApi.obtenerPorId(id).pipe(map(res => res.data));

  // Filtered list for table
  tarifasFiltradas = computed(() => this.facade.tarifas());

  // Dynamic counts
  counts = computed(() => {
    return {
      total: this.facade.totalTarifas()
    };
  });

  ngOnInit() {
    this.cargarItems();
  }

  cargarItems() {
    let activo: boolean | undefined = undefined;
    if (this.selectedFilter && this.selectedFilter() === 'activos') activo = true;
    if (this.selectedFilter && this.selectedFilter() === 'inactivos') activo = false;
    this.facade.cargarTarifas({ pageNumber: this.pageNumber(), pageSize: this.pageSize(), search: this.searchText(), activo });;
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
    const primerActo = this.tiposActoFacade.tiposActoRegistro()[0]?.id || null;
    const primerVig = this.vigenciasFacade.vigencias()[0]?.id || null;
    const primeraNorma = this.normasFacade.normas()[0]?.id || null;
    const primerCalculo = this.tiposCalculoFacade.tiposCalculoTarifa()[0]?.id || null;

    this.tarifaForm.reset({
      departamentoId: primerDep,
      tipoActoRegistroId: primerActo,
      vigenciaId: primerVig,
      normaId: primeraNorma,
      tipoCalculoTarifaId: primerCalculo,
      porcentaje: 1.0,
      valorFijo: null,
      baseMinima: null,
      baseMaxima: null,
      valorMinimo: null,
      valorMaximo: null,
      activo: true
    });
    this.isSlideOverOpen = true;
  }

  edit(item: Tarifa) {
    this.loadingEditId.set(item.id);
    this.apiService.obtenerPorId(item.id).subscribe({
      next: (res) => {
        this.loadingEditId.set(null);
        const data = res?.data || item;
        this.selectedId = data.id;
        this.tarifaForm.patchValue({
          departamentoId: data.departamento?.id ?? (data as any).departamentoId ?? null,
          tipoActoRegistroId: data.tipoActoRegistro?.id ?? (data as any).tipoActoRegistroId ?? null,
          vigenciaId: data.vigencia?.id ?? (data as any).vigenciaId ?? null,
          normaId: data.norma?.id ?? (data as any).normaId ?? null,
          tipoCalculoTarifaId: data.tipoCalculoTarifa?.id ?? (data as any).tipoCalculoTarifaId ?? null,
          porcentaje: data.porcentaje,
          valorFijo: data.valorFijo,
          baseMinima: data.baseMinima,
          baseMaxima: data.baseMaxima,
          valorMinimo: data.valorMinimo,
          valorMaximo: data.valorMaximo,
          activo: data.activo
        });
        this.isSlideOverOpen = true;
      },
      error: (err) => {
        this.loadingEditId.set(null);
        this.toast.error('Error al obtener la información de la tarifa');
        console.error(err);
      }
    });
  }

  toggleActivo(item: Tarifa) {
    const nuevoEstado = !item.activo;
    const actionName = nuevoEstado ? 'activada' : 'desactivada';

    this.facade.actualizar(item.id, {
      id: item.id,
      departamentoId: item.departamento?.id || 1,
      tipoActoRegistroId: item.tipoActoRegistro?.id || 1,
      vigenciaId: item.vigencia?.id || 1,
      normaId: item.norma?.id || 1,
      tipoCalculoTarifaId: item.tipoCalculoTarifa?.id || 1,
      porcentaje: item.porcentaje,
      valorFijo: item.valorFijo,
      baseMinima: item.baseMinima,
      baseMaxima: item.baseMaxima,
      valorMinimo: item.valorMinimo,
      valorMaximo: item.valorMaximo,
      activo: nuevoEstado
    }).subscribe({
      next: () => {
        this.toast.success(`Tarifa ${actionName} exitosamente`);
        this.cargarItems();
      },
      error: (err: any) => {
        this.toast.error(`Error al actualizar la tarifa`);
        console.error(err);
      }
    });
  }

  closeSlideOver() {
    this.isSlideOverOpen = false;
    this.selectedId = null;
  }

  saveTarifa() {
    if (this.tarifaForm.valid) {
      const val = this.tarifaForm.value;
      const actionName = this.isEditMode ? 'actualizada' : 'creada';

      const payload = {
        departamentoId: Number(val.departamentoId),
        tipoActoRegistroId: Number(val.tipoActoRegistroId),
        vigenciaId: Number(val.vigenciaId),
        normaId: Number(val.normaId),
        tipoCalculoTarifaId: Number(val.tipoCalculoTarifaId),
        porcentaje: val.porcentaje ? Number(val.porcentaje) : null,
        valorFijo: val.valorFijo ? Number(val.valorFijo) : null,
        baseMinima: val.baseMinima ? Number(val.baseMinima) : null,
        baseMaxima: val.baseMaxima ? Number(val.baseMaxima) : null,
        valorMinimo: val.valorMinimo ? Number(val.valorMinimo) : null,
        valorMaximo: val.valorMaximo ? Number(val.valorMaximo) : null
      };

      if (this.isEditMode) {
        this.facade.actualizar(this.selectedId!, {
          id: this.selectedId!,
          ...payload,
          activo: val.activo ?? true
        }).subscribe({
          next: () => {
            this.toast.success(`Tarifa ${actionName} exitosamente`);
            this.closeSlideOver();
            this.cargarItems();
          },
          error: (err: any) => {
            this.toast.error(`Error al actualizar la tarifa`);
            console.error(err);
          }
        });
      } else {
        this.facade.crear(payload).subscribe({
          next: () => {
            this.toast.success(`Tarifa ${actionName} exitosamente`);
            this.closeSlideOver();
            this.cargarItems();
          },
          error: (err: any) => {
            this.toast.error(`Error al crear la tarifa`);
            console.error(err);
          }
        });
      }
    } else {
      this.tarifaForm.markAllAsTouched();
    }
  }
}
