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
import { ToastService } from '../../../../../../../core/services/toast.service';

@Component({
  selector: 'app-exenciones',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PageHeaderComponent, SlideOverComponent, PaginationComponent],
  templateUrl: './exenciones.html',
  styleUrl: './exenciones.css'
})
export class Exenciones implements OnInit {
  private fb = inject(FormBuilder);
  public facade = inject(ExencionesFacade);
  public departamentosFacade = inject(DepartamentosFacade);
  public normasFacade = inject(NormasFacade);
  public tiposBeneficiarioFacade = inject(TiposBeneficiarioExencionFacade);
  public rolesFacade = inject(RolesIntervinienteFacade);
  private toast = inject(ToastService);

  breadcrumbs = ['Configuración', 'Exenciones', 'Exención'];

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

  exencionForm = this.fb.group({
    departamentoId: [null as number | null, Validators.required],
    normaId: [null as number | null, Validators.required],
    tipoBeneficiarioId: [null as number | null],
    rolIntervinienteId: [null as number | null],
    codigo: ['', [Validators.required, Validators.maxLength(20)]],
    nombre: ['', Validators.required],
    descripcion: [''],
    activo: [true]
  });

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
      activo: true
    });
    this.isSlideOverOpen = true;
  }

  edit(item: Exencion) {
    this.selectedId = item.id;
    this.exencionForm.patchValue({
      departamentoId: item.departamento?.id || null,
      normaId: item.norma?.id || null,
      tipoBeneficiarioId: item.tipoBeneficiario?.id || null,
      rolIntervinienteId: item.rolInterviniente?.id || null,
      codigo: item.codigo,
      nombre: item.nombre,
      descripcion: item.descripcion || '',
      activo: item.activo
    });
    this.isSlideOverOpen = true;
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
        descripcion: val.descripcion || ''
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
