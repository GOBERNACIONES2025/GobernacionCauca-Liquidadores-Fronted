import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { SlideOverComponent } from '../../../../shared/components/slide-over/slide-over';
import { PaginationComponent } from '../../../../../../shared/components/pagination/pagination';
import { SearchableSelectComponent } from '../../../../../../../shared/components/searchable-select/searchable-select';
import { ConfiguracionExtemporaneidadFacade } from '../../../../../application/facades/Tarifas/configuracion-extemporaneidad.facade';
import { ConfiguracionExtemporaneidadApiService } from '../../../../../infrastructure/api/Tarifas/configuracion-extemporaneidad-api.service';
import { DepartamentosFacade } from '../../../../../application/facades/Territorios/departamentos.facade';
import { DepartamentosApiService } from '../../../../../infrastructure/api/Territorios/departamentos-api.service';
import { TiposCalculoTarifaFacade } from '../../../../../application/facades/Tarifas/tipos-calculo-tarifa.facade';
import { TiposCalculoTarifaApiService } from '../../../../../infrastructure/api/Tarifas/tipos-calculo-tarifa-api.service';
import { VigenciasFacade } from '../../../../../application/facades/Normatividad/vigencias.facade';
import { VigenciasApiService } from '../../../../../infrastructure/api/Normatividad/vigencias-api.service';
import { NormasFacade } from '../../../../../application/facades/Normatividad/normas.facade';
import { NormasApiService } from '../../../../../infrastructure/api/Normatividad/normas-api.service';
import { ToastService } from '../../../../../../../core/services/toast.service';
import { ConfiguracionExtemporaneidad } from '../../../../../domain/models/Tarifas/configuracion-extemporaneidad.model';

@Component({
  selector: 'app-configuracion-extemporaneidad',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    PageHeaderComponent,
    SlideOverComponent,
    PaginationComponent,
    SearchableSelectComponent
  ],
  templateUrl: './configuracion-extemporaneidad.html',
  styleUrl: './configuracion-extemporaneidad.css'
})
export class ConfiguracionExtemporaneidadComponent implements OnInit {
  private fb = inject(FormBuilder);
  public facade = inject(ConfiguracionExtemporaneidadFacade);
  public apiService = inject(ConfiguracionExtemporaneidadApiService);
  public departamentosFacade = inject(DepartamentosFacade);
  private departamentosApi = inject(DepartamentosApiService);
  public tiposCalculoFacade = inject(TiposCalculoTarifaFacade);
  private tiposCalculoApi = inject(TiposCalculoTarifaApiService);
  public vigenciasFacade = inject(VigenciasFacade);
  private vigenciasApi = inject(VigenciasApiService);
  public normasFacade = inject(NormasFacade);
  private normasApi = inject(NormasApiService);
  private toast = inject(ToastService);

  breadcrumbs = ['Configuración', 'Tarifas', 'Extemporaneidad'];

  searchText = signal<string>('');
  searchSubject = new Subject<string>();

  pageNumber = signal<number>(1);
  pageSize = signal<number>(10);
  loadingEditId = signal<number | null>(null);

  selectedFilter = signal<'todos' | 'activos' | 'inactivos'>('todos');
  isSlideOverOpen = false;
  selectedId: number | null = null;

  get isEditMode(): boolean {
    return this.selectedId !== null;
  }

  // Validador de coherencia temporal si se especifican fechas de inicio y fin (ej. Papayazo/Amnistía)
  private rangoFechasValidator(control: AbstractControl): ValidationErrors | null {
    const inicio = control.get('fechaInicio')?.value;
    const fin = control.get('fechaFin')?.value;

    if (inicio && fin) {
      if (new Date(inicio) > new Date(fin)) {
        return { fechaFinMenor: true };
      }
    }
    return null;
  }

  // Validador personalizado acorde a las reglas del backend (FluentValidation)
  private sancionPorTipoValidator(control: AbstractControl): ValidationErrors | null {
    const tipoCalculoId = Number(control.get('tipoCalculoTarifaId')?.value);
    const porcentaje = control.get('porcentajeSancion')?.value;
    const valorFijo = control.get('valorFijoSancion')?.value;

    if (tipoCalculoId === 1) {
      // 1 = Porcentual
      if (porcentaje == null || isNaN(Number(porcentaje)) || Number(porcentaje) <= 0 || Number(porcentaje) > 100) {
        return { requierePorcentaje: true };
      }
    } else if (tipoCalculoId === 2) {
      // 2 = Valor Fijo
      if (valorFijo == null || isNaN(Number(valorFijo)) || Number(valorFijo) <= 0) {
        return { requiereValorFijo: true };
      }
    } else {
      const tienePorcentaje = porcentaje != null && !isNaN(Number(porcentaje)) && Number(porcentaje) > 0;
      const tieneValorFijo = valorFijo != null && !isNaN(Number(valorFijo)) && Number(valorFijo) > 0;
      if (!tienePorcentaje && !tieneValorFijo) {
        return { requiereSancion: true };
      }
    }
    return null;
  }

  extemporaneidadForm = this.fb.group(
    {
      departamentoId: [null as number | null, [Validators.required]],
      tipoCalculoTarifaId: [1 as number | null, [Validators.required]],
      vigenciaId: [null as number | null, [Validators.required]],
      normaId: [null as number | null, [Validators.required]],
      fechaInicio: ['' as string | null],
      fechaFin: ['' as string | null],
      diasPlazo: [60, [Validators.required, Validators.min(0)]],
      porcentajeSancion: [null as number | null, [Validators.min(0.01), Validators.max(100)]],
      valorFijoSancion: [null as number | null, [Validators.min(0.01)]],
      aplicaInteresMora: [true],
      activo: [true]
    },
    { validators: [this.sancionPorTipoValidator, this.rangoFechasValidator] }
  );

  searchDepartamentosFn = (term: string) =>
    this.departamentosApi.obtenerTodos(1, 50, term).pipe(map((res) => res.data.items));

  resolveDepartamentoFn = (id: number) =>
    this.departamentosApi.obtenerPorId(id).pipe(map((res) => res.data));

  searchTiposCalculoFn = (term: string) =>
    this.tiposCalculoApi.obtenerTodos(1, 50, term).pipe(map((res) => res.data.items));

  resolveTipoCalculoFn = (id: number) =>
    this.tiposCalculoApi.obtenerPorId(id).pipe(map((res) => res.data));

  searchVigenciasFn = (term: string) =>
    this.vigenciasApi.obtenerTodos({ pageNumber: 1, pageSize: 50, search: term }).pipe(map((res) => res.data.items));

  resolveVigenciaFn = (id: number) =>
    this.vigenciasApi.obtenerPorId(id).pipe(map((res) => res.data));

  searchNormasFn = (term: string) =>
    this.normasApi.obtenerTodos(1, 50, term).pipe(map((res) => res.data.items));

  resolveNormaFn = (id: number) =>
    this.normasApi.obtenerPorId(id).pipe(map((res) => res.data));

  configuracionesFiltradas = computed(() => this.facade.configuraciones());

  counts = computed(() => ({
    total: this.facade.totalConfiguraciones()
  }));

  constructor() {
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.pageNumber.set(1);
        this.cargarItems();
      });
  }

  ngOnInit(): void {
    if (this.departamentosFacade.departamentos().length === 0) {
      this.departamentosFacade.cargarDepartamentos();
    }
    if (this.tiposCalculoFacade.tiposCalculoTarifa().length === 0) {
      this.tiposCalculoFacade.cargarTiposCalculoTarifa();
    }
    if (this.vigenciasFacade.vigencias().length === 0) {
      this.vigenciasFacade.cargarVigencias();
    }
    if (this.normasFacade.normas().length === 0) {
      this.normasFacade.cargarNormas(1, 100);
    }
    this.cargarItems();
  }

  cargarItems(): void {
    let activo: boolean | undefined = undefined;
    if (this.selectedFilter() === 'activos') activo = true;
    if (this.selectedFilter() === 'inactivos') activo = false;

    this.facade.cargarConfiguraciones({
      pageNumber: this.pageNumber(),
      pageSize: this.pageSize(),
      search: this.searchText(),
      activo
    });
  }

  onPageChange(page: number): void {
    this.pageNumber.set(page);
    this.cargarItems();
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.pageNumber.set(1);
    this.cargarItems();
  }

  onSearchChange(event: any): void {
    const value = event?.target ? event.target.value : event;
    this.searchText.set(value);
    this.searchSubject.next(value);
  }

  setFilter(filter: 'todos' | 'activos' | 'inactivos'): void {
    this.selectedFilter.set(filter);
    this.pageNumber.set(1);
    this.cargarItems();
  }

  getDepartamentoNombre(item: ConfiguracionExtemporaneidad): string {
    if (item.departamentoNombre) {
      return item.departamentoNombre;
    }
    if (item.departamento?.nombre) {
      return item.departamento.nombre;
    }
    const dept = this.departamentosFacade.departamentos().find((d) => d.id === item.departamentoId);
    return dept ? dept.nombre : `Depto #${item.departamentoId}`;
  }

  getTipoCalculoNombre(item: ConfiguracionExtemporaneidad): string {
    if (item.tipoCalculoTarifaNombre) {
      return item.tipoCalculoTarifaNombre;
    }
    if (item.tipoCalculoTarifa?.nombre) {
      return item.tipoCalculoTarifa.nombre;
    }
    const match = this.tiposCalculoFacade.tiposCalculoTarifa().find((t) => t.id === item.tipoCalculoTarifaId);
    if (match) return match.nombre;
    if (item.tipoCalculoTarifaId === 1) return 'Porcentual';
    if (item.tipoCalculoTarifaId === 2) return 'Valor Fijo';
    return `Tipo #${item.tipoCalculoTarifaId}`;
  }

  getVigenciaAnio(item: ConfiguracionExtemporaneidad): string {
    if (item.vigenciaAnio) {
      return item.vigenciaAnio.toString();
    }
    if (item.vigencia?.anio) {
      return item.vigencia.anio.toString();
    }
    const v = this.vigenciasFacade.vigencias().find((x) => x.id === item.vigenciaId);
    return v ? v.anio.toString() : (item.vigenciaId ? item.vigenciaId.toString() : '-');
  }

  getNormaNumero(item: ConfiguracionExtemporaneidad): string {
    if (item.normaNumero) {
      return item.normaNumero;
    }
    if (item.norma?.numero) {
      return item.norma.numero;
    }
    const n = this.normasFacade.normas().find((x) => x.id === item.normaId);
    return n ? n.numero : (item.normaId ? `Norma #${item.normaId}` : '-');
  }

  openNew(): void {
    this.selectedId = null;
    const now = new Date();
    const currentYear = now.getFullYear();

    const primerDep = this.departamentosFacade.departamentos()[0]?.id || null;
    const primerTipoCalculo = this.tiposCalculoFacade.tiposCalculoTarifa()[0]?.id || 1;
    const vigenciaActual = this.vigenciasFacade.vigencias().find((v) => v.anio === currentYear)?.id ||
      this.vigenciasFacade.vigencias()[0]?.id || null;
    const primeraNorma = this.normasFacade.normas()[0]?.id || null;

    this.extemporaneidadForm.reset({
      departamentoId: primerDep,
      tipoCalculoTarifaId: primerTipoCalculo,
      vigenciaId: vigenciaActual,
      normaId: primeraNorma,
      fechaInicio: null,
      fechaFin: null,
      diasPlazo: 60,
      porcentajeSancion: 5.0,
      valorFijoSancion: null,
      aplicaInteresMora: true,
      activo: true
    });
    this.isSlideOverOpen = true;
  }

  edit(item: ConfiguracionExtemporaneidad): void {
    this.loadingEditId.set(item.id);
    this.apiService.obtenerPorId(item.id).subscribe({
      next: (res) => {
        this.loadingEditId.set(null);
        const data = res?.data || item;
        this.selectedId = data.id;

        this.extemporaneidadForm.patchValue({
          departamentoId: data.departamentoId ?? data.departamento?.id ?? null,
          tipoCalculoTarifaId: data.tipoCalculoTarifaId ?? (data as any).tipoCalculoTarifa?.id ?? 1,
          vigenciaId: data.vigenciaId ?? data.vigencia?.id ?? null,
          normaId: data.normaId ?? data.norma?.id ?? null,
          fechaInicio: data.fechaInicio ? data.fechaInicio.substring(0, 10) : null,
          fechaFin: data.fechaFin ? data.fechaFin.substring(0, 10) : null,
          diasPlazo: data.diasPlazo,
          porcentajeSancion: data.porcentajeSancion ?? null,
          valorFijoSancion: data.valorFijoSancion ?? null,
          aplicaInteresMora: data.aplicaInteresMora,
          activo: data.activo
        });
        this.isSlideOverOpen = true;
      },
      error: (err) => {
        this.loadingEditId.set(null);
        this.toast.error('Error al obtener la información de la configuración');
        console.error(err);
      }
    });
  }

  toggleActivo(item: ConfiguracionExtemporaneidad): void {
    const nuevoEstado = !item.activo;
    const actionName = nuevoEstado ? 'activada' : 'desactivada';

    this.facade
      .actualizar(item.id, {
        id: item.id,
        departamentoId: item.departamentoId,
        tipoCalculoTarifaId: item.tipoCalculoTarifaId ?? 1,
        vigenciaId: item.vigenciaId,
        normaId: item.normaId,
        fechaInicio: item.fechaInicio ? item.fechaInicio.substring(0, 10) : null,
        fechaFin: item.fechaFin ? item.fechaFin.substring(0, 10) : null,
        diasPlazo: item.diasPlazo,
        porcentajeSancion: item.porcentajeSancion,
        valorFijoSancion: item.valorFijoSancion,
        aplicaInteresMora: item.aplicaInteresMora,
        activo: nuevoEstado
      })
      .subscribe({
        next: () => {
          this.toast.success(`Configuración ${actionName} exitosamente`);
          this.cargarItems();
        },
        error: (err: any) => {
          const msg = err?.error?.detail || err?.error?.message || 'Error al cambiar el estado de la configuración';
          this.toast.error(msg);
          console.error(err);
        }
      });
  }

  closeSlideOver(): void {
    this.isSlideOverOpen = false;
    this.selectedId = null;
  }

  save(): void {
    if (this.extemporaneidadForm.hasError('fechaFinMenor')) {
      this.toast.error('La fecha de fin debe ser posterior o igual a la fecha de inicio.');
      return;
    }
    if (this.extemporaneidadForm.hasError('requierePorcentaje')) {
      this.toast.error('El porcentaje de sanción es obligatorio cuando el tipo de cálculo es Porcentual (entre 0.01% y 100%).');
      return;
    }
    if (this.extemporaneidadForm.hasError('requiereValorFijo')) {
      this.toast.error('El valor fijo de sanción es obligatorio cuando el tipo de cálculo es Valor Fijo (mayor a 0).');
      return;
    }
    if (this.extemporaneidadForm.hasError('requiereSancion')) {
      this.toast.error('Debe especificar al menos un porcentaje de sanción o un valor fijo de sanción.');
      return;
    }

    if (this.extemporaneidadForm.valid) {
      const val = this.extemporaneidadForm.value;
      const actionName = this.isEditMode ? 'actualizada' : 'creada';

      const payload = {
        departamentoId: Number(val.departamentoId),
        tipoCalculoTarifaId: Number(val.tipoCalculoTarifaId),
        vigenciaId: Number(val.vigenciaId),
        normaId: Number(val.normaId),
        fechaInicio: val.fechaInicio || null,
        fechaFin: val.fechaFin || null,
        diasPlazo: Number(val.diasPlazo),
        porcentajeSancion: val.porcentajeSancion != null && !isNaN(Number(val.porcentajeSancion))
          ? Number(val.porcentajeSancion)
          : null,
        valorFijoSancion: val.valorFijoSancion != null && !isNaN(Number(val.valorFijoSancion))
          ? Number(val.valorFijoSancion)
          : null,
        aplicaInteresMora: !!val.aplicaInteresMora
      };

      if (this.isEditMode) {
        this.facade
          .actualizar(this.selectedId!, {
            id: this.selectedId!,
            ...payload,
            activo: val.activo ?? true
          })
          .subscribe({
            next: () => {
              this.toast.success(`Configuración de extemporaneidad ${actionName} exitosamente`);
              this.closeSlideOver();
              this.cargarItems();
            },
            error: (err: any) => {
              const msg = err?.error?.detail || err?.error?.message || 'Error al actualizar la configuración';
              this.toast.error(msg);
              console.error(err);
            }
          });
      } else {
        this.facade.crear(payload).subscribe({
          next: () => {
            this.toast.success(`Configuración de extemporaneidad ${actionName} exitosamente`);
            this.closeSlideOver();
            this.cargarItems();
          },
          error: (err: any) => {
            const msg = err?.error?.detail || err?.error?.message || 'Error al crear la configuración';
            this.toast.error(msg);
            console.error(err);
          }
        });
      }
    } else {
      this.extemporaneidadForm.markAllAsTouched();
    }
  }
}
