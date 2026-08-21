import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { SlideOverComponent } from '../../../../shared/components/slide-over/slide-over';
import { EntidadesRegistroFacade } from '../../../../../application/facades/Registro/entidades-registro.facade';
import { TiposEntidadRegistroFacade } from '../../../../../application/facades/Registro/tipos-entidad-registro.facade';
import { DepartamentosFacade } from '../../../../../application/facades/Territorios/departamentos.facade';
import { MunicipiosFacade } from '../../../../../application/facades/Territorios/municipios.facade';
import { EntidadRegistro } from '../../../../../domain/models/Registro/entidad-registro.model';
import { ToastService } from '../../../../../../../core/services/toast.service';

@Component({
  selector: 'app-entidades-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PageHeaderComponent, SlideOverComponent],
  templateUrl: './entidades-registro.html',
  styleUrl: './entidades-registro.css'
})
export class EntidadesRegistro implements OnInit {
  private fb = inject(FormBuilder);
  public facade = inject(EntidadesRegistroFacade);
  public tiposEntidadFacade = inject(TiposEntidadRegistroFacade);
  public departamentosFacade = inject(DepartamentosFacade);
  public municipiosFacade = inject(MunicipiosFacade);
  private toast = inject(ToastService);

  breadcrumbs = ['Configuración', 'Entidades', 'Entidad de Registro'];

  searchQuery = signal<string>('');
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

  // Filtered municipios based on selected departamento in form
  municipiosFiltradosForm = computed(() => {
    const depId = this.entidadForm.get('departamentoId')?.value;
    const todosMunicipios = this.municipiosFacade.municipios();
    if (!depId) return todosMunicipios;
    return todosMunicipios.filter(m => m.departamentoId === depId || (m.departamento && (m.departamento as any).id === depId));
  });

  // Filtered list for table
  entidadesFiltradas = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const filter = this.selectedFilter();
    let items = this.facade.entidadesRegistro();

    if (filter === 'activos') {
      items = items.filter(e => e.activo);
    } else if (filter === 'inactivos') {
      items = items.filter(e => !e.activo);
    }

    if (query) {
      items = items.filter(e => 
        e.codigo.toLowerCase().includes(query) ||
        e.nombre.toLowerCase().includes(query) ||
        e.nit.toLowerCase().includes(query) ||
        (e.tipoEntidadRegistro?.nombre && e.tipoEntidadRegistro.nombre.toLowerCase().includes(query)) ||
        (e.municipio?.nombre && e.municipio.nombre.toLowerCase().includes(query)) ||
        (e.departamento?.nombre && e.departamento.nombre.toLowerCase().includes(query))
      );
    }

    return items;
  });

  // Dynamic counts
  counts = computed(() => {
    const all = this.facade.entidadesRegistro();
    return {
      total: all.length,
      active: all.filter(e => e.activo).length,
      inactive: all.filter(e => !e.activo).length
    };
  });

  ngOnInit() {
    this.facade.cargarEntidadesRegistro(1, 100);
    this.tiposEntidadFacade.cargarTiposEntidadRegistro(1, 100);
    this.departamentosFacade.cargarDepartamentos(1, 100);
    this.municipiosFacade.cargarMunicipios(1, 100);
  }

  setFilter(filter: 'todos' | 'activos' | 'inactivos') {
    this.selectedFilter.set(filter);
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
    this.selectedId = item.id;
    this.entidadForm.patchValue({
      tipoEntidadRegistroId: item.tipoEntidadRegistro?.id || null,
      departamentoId: item.departamento?.id || null,
      municipioId: item.municipio?.id || null,
      nit: item.nit,
      codigo: item.codigo,
      nombre: item.nombre,
      emailContacto: item.emailContacto || '',
      activo: item.activo
    });
    this.isSlideOverOpen = true;
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
        this.facade.cargarEntidadesRegistro(1, 100);
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
            this.facade.cargarEntidadesRegistro(1, 100);
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
            this.facade.cargarEntidadesRegistro(1, 100);
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
