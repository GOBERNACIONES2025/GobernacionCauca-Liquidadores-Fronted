import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { SlideOverComponent } from '../../../../shared/components/slide-over/slide-over';
import { PaginationComponent } from '../../../../../../shared/components/pagination/pagination';
import { SearchableSelectComponent } from '../../../../../../../shared/components/searchable-select/searchable-select';
import { TasasInteresMoraFacade } from '../../../../../application/facades/Tarifas/tasas-interes-mora.facade';
import { TasasInteresMoraApiService } from '../../../../../infrastructure/api/Tarifas/tasas-interes-mora-api.service';
import { VigenciasFacade } from '../../../../../application/facades/Normatividad/vigencias.facade';
import { VigenciasApiService } from '../../../../../infrastructure/api/Normatividad/vigencias-api.service';
import { ToastService } from '../../../../../../../core/services/toast.service';
import { TasaInteresMora } from '../../../../../domain/models/Tarifas/tasa-interes-mora.model';

@Component({
  selector: 'app-tasas-interes-mora',
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
  templateUrl: './tasas-interes-mora.html',
  styleUrl: './tasas-interes-mora.css'
})
export class TasasInteresMoraComponent implements OnInit {
  private fb = inject(FormBuilder);
  public facade = inject(TasasInteresMoraFacade);
  public apiService = inject(TasasInteresMoraApiService);
  public vigenciasFacade = inject(VigenciasFacade);
  private vigenciasApi = inject(VigenciasApiService);
  private toast = inject(ToastService);

  breadcrumbs = ['Configuración', 'Tarifas', 'Tasas de Interés de Mora'];

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

  // Validador de coherencia temporal de rango de fechas
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

  tasaForm = this.fb.group(
    {
      vigenciaId: [null as number | null, [Validators.required]],
      fechaInicio: ['', [Validators.required]],
      fechaFin: ['', [Validators.required]],
      tasaMensual: [null as number | null, [Validators.required, Validators.min(0.0001)]],
      tasaDiaria: [null as number | null, [Validators.required, Validators.min(0.000001)]],
      activo: [true]
    },
    { validators: [this.rangoFechasValidator] }
  );

  searchVigenciasFn = (term: string) =>
    this.vigenciasApi.obtenerTodos({ pageNumber: 1, pageSize: 50, search: term }).pipe(map((res) => res.data.items));

  resolveVigenciaFn = (id: number) =>
    this.vigenciasApi.obtenerPorId(id).pipe(map((res) => res.data));

  tasasFiltradas = computed(() => this.facade.tasas());

  counts = computed(() => ({
    total: this.facade.totalTasas()
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
    if (this.vigenciasFacade.vigencias().length === 0) {
      this.vigenciasFacade.cargarVigencias();
    }
    this.cargarItems();
  }

  cargarItems(): void {
    let activo: boolean | undefined = undefined;
    if (this.selectedFilter() === 'activos') activo = true;
    if (this.selectedFilter() === 'inactivos') activo = false;

    this.facade.cargarTasas({
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

  getVigenciaAnio(item: TasaInteresMora): string {
    if (item.vigenciaAnio) {
      return item.vigenciaAnio.toString();
    }
    if (item.vigencia?.anio) {
      return item.vigencia.anio.toString();
    }
    if (item.vigenciaId) {
      const v = this.vigenciasFacade.vigencias().find((x) => x.id === item.vigenciaId);
      if (v) return v.anio.toString();
      return `Vigencia #${item.vigenciaId}`;
    }
    return 'General';
  }

  calcularTasaDiariaSugerida(): void {
    const mensual = this.tasaForm.get('tasaMensual')?.value;
    if (mensual && Number(mensual) > 0) {
      // Cálculo convencional de tasa diaria proporcional
      const diaria = +(Number(mensual) / 30).toFixed(6);
      this.tasaForm.patchValue({ tasaDiaria: diaria });
      this.toast.info(`Tasa diaria estimada: ${diaria}%`);
    }
  }

  openNew(): void {
    this.selectedId = null;
    const now = new Date();
    const anio = now.getFullYear();
    const mes = String(now.getMonth() + 1).padStart(2, '0');
    const primerDia = `${anio}-${mes}-01`;

    // Último día del mes actual
    const ultimoDiaDate = new Date(anio, now.getMonth() + 1, 0);
    const ultimoDia = `${anio}-${mes}-${String(ultimoDiaDate.getDate()).padStart(2, '0')}`;

    const vigenciaActual = this.vigenciasFacade.vigencias().find((v) => v.anio === anio)?.id || null;

    this.tasaForm.reset({
      vigenciaId: vigenciaActual,
      fechaInicio: primerDia,
      fechaFin: ultimoDia,
      tasaMensual: 2.15,
      tasaDiaria: +(2.15 / 30).toFixed(6),
      activo: true
    });
    this.isSlideOverOpen = true;
  }

  edit(item: TasaInteresMora): void {
    this.loadingEditId.set(item.id);
    this.apiService.obtenerPorId(item.id).subscribe({
      next: (res) => {
        this.loadingEditId.set(null);
        const data = res?.data || item;
        this.selectedId = data.id;

        this.tasaForm.patchValue({
          vigenciaId: data.vigenciaId ?? data.vigencia?.id ?? null,
          fechaInicio: data.fechaInicio ? data.fechaInicio.substring(0, 10) : '',
          fechaFin: data.fechaFin ? data.fechaFin.substring(0, 10) : '',
          tasaMensual: data.tasaMensual,
          tasaDiaria: data.tasaDiaria,
          activo: data.activo
        });
        this.isSlideOverOpen = true;
      },
      error: (err) => {
        this.loadingEditId.set(null);
        this.toast.error('Error al obtener la información de la tasa de mora');
        console.error(err);
      }
    });
  }

  toggleActivo(item: TasaInteresMora): void {
    const nuevoEstado = !item.activo;
    const actionName = nuevoEstado ? 'activada' : 'desactivada';

    this.facade
      .actualizar(item.id, {
        id: item.id,
        vigenciaId: item.vigenciaId,
        fechaInicio: item.fechaInicio ? item.fechaInicio.substring(0, 10) : '',
        fechaFin: item.fechaFin ? item.fechaFin.substring(0, 10) : '',
        tasaMensual: item.tasaMensual,
        tasaDiaria: item.tasaDiaria,
        activo: nuevoEstado
      })
      .subscribe({
        next: () => {
          this.toast.success(`Tasa de interés de mora ${actionName} exitosamente`);
          this.cargarItems();
        },
        error: (err: any) => {
          const msg = err?.error?.detail || err?.error?.message || 'Error al cambiar el estado de la tasa';
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
    if (this.tasaForm.hasError('fechaFinMenor')) {
      this.toast.error('La fecha de fin debe ser posterior o igual a la fecha de inicio.');
      return;
    }

    if (this.tasaForm.valid) {
      const val = this.tasaForm.value;
      const actionName = this.isEditMode ? 'actualizada' : 'creada';

      const payload = {
        vigenciaId: Number(val.vigenciaId),
        fechaInicio: val.fechaInicio!,
        fechaFin: val.fechaFin!,
        tasaMensual: Number(val.tasaMensual),
        tasaDiaria: Number(val.tasaDiaria)
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
              this.toast.success(`Tasa de interés de mora ${actionName} exitosamente`);
              this.closeSlideOver();
              this.cargarItems();
            },
            error: (err: any) => {
              const msg = err?.error?.detail || err?.error?.message || 'Error al actualizar la tasa de interés';
              this.toast.error(msg);
              console.error(err);
            }
          });
      } else {
        this.facade.crear(payload).subscribe({
          next: () => {
            this.toast.success(`Tasa de interés de mora ${actionName} exitosamente`);
            this.closeSlideOver();
            this.cargarItems();
          },
          error: (err: any) => {
            const msg = err?.error?.detail || err?.error?.message || 'Error al crear la tasa de interés';
            this.toast.error(msg);
            console.error(err);
          }
        });
      }
    } else {
      this.tasaForm.markAllAsTouched();
    }
  }
}
