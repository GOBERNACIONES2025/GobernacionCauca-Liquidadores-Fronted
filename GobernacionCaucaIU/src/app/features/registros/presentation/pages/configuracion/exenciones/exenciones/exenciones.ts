import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PageHeaderComponent, SlideOverComponent],
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

  searchQuery = signal<string>('');
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
  exencionesFiltradas = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const filter = this.selectedFilter();
    let items = this.facade.exenciones();

    if (filter === 'activos') {
      items = items.filter(e => e.activo);
    } else if (filter === 'inactivos') {
      items = items.filter(e => !e.activo);
    }

    if (query) {
      items = items.filter(e => 
        e.codigo.toLowerCase().includes(query) ||
        e.nombre.toLowerCase().includes(query) ||
        (e.descripcion && e.descripcion.toLowerCase().includes(query)) ||
        (e.tipoBeneficiario?.nombre && e.tipoBeneficiario.nombre.toLowerCase().includes(query)) ||
        (e.norma?.numero && e.norma.numero.toLowerCase().includes(query))
      );
    }

    return items;
  });

  // Dynamic counts
  counts = computed(() => {
    const all = this.facade.exenciones();
    return {
      total: all.length,
      active: all.filter(e => e.activo).length,
      inactive: all.filter(e => !e.activo).length
    };
  });

  ngOnInit() {
    this.facade.cargarExenciones(1, 100);
    this.departamentosFacade.cargarDepartamentos(1, 100);
    this.normasFacade.cargarNormas();
    this.tiposBeneficiarioFacade.cargarTiposBeneficiario(1, 100);
    this.rolesFacade.cargarRolesInterviniente(1, 100);
  }

  setFilter(filter: 'todos' | 'activos' | 'inactivos') {
    this.selectedFilter.set(filter);
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
        this.facade.cargarExenciones(1, 100);
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
            this.facade.cargarExenciones(1, 100);
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
            this.facade.cargarExenciones(1, 100);
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
