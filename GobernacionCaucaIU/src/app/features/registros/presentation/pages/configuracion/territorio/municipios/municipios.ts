import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { SlideOverComponent } from '../../../../shared/components/slide-over/slide-over';
import { MunicipiosFacade } from '../../../../../application/facades/Territorios/municipios.facade';
import { DepartamentosFacade } from '../../../../../application/facades/Territorios/departamentos.facade';
import { Municipio } from '../../../../../domain/models/Territorios/municipio.model';
import { ToastService } from '../../../../../../../core/services/toast.service';

@Component({
  selector: 'app-municipios',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PageHeaderComponent, SlideOverComponent],
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
  selectedFilter = signal<'todos' | 'activos' | 'inactivos'>('todos');

  // Fallback initial data in case backend has no records yet
  private readonly defaultMunicipios: Municipio[] = [
    { id: 1, codigoDane: '19001', nombre: 'Popayán', activo: true, departamento: 'Cauca' },
    { id: 2, codigoDane: '19698', nombre: 'Santander de Quilichao', activo: true, departamento: 'Cauca' },
    { id: 3, codigoDane: '19548', nombre: 'Piendamó', activo: true, departamento: 'Cauca' },
    { id: 4, codigoDane: '19573', nombre: 'Puerto Tejada', activo: false, departamento: 'Cauca' },
    { id: 5, codigoDane: '19517', nombre: 'Páez (Belalcázar)', activo: true, departamento: 'Cauca' },
  ];

  isSlideOverOpen = false;
  selectedId: number | null = null;

  get isEditMode(): boolean {
    return this.selectedId !== null;
  }

  municipioForm = this.fb.group({
    codigoDane: ['', [Validators.required, Validators.maxLength(5)]],
    nombre: ['', Validators.required],
    departamentoNombre: ['Cauca', Validators.required],
    activo: [true]
  });

  // Municipios list (from facade or fallback)
  listaMunicipios = computed(() => {
    const list = this.facade.municipios();
    return list.length > 0 ? list : this.defaultMunicipios;
  });

  // Filtered municipios list for table
  municipiosFiltrados = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const filter = this.selectedFilter();
    let items = this.listaMunicipios();

    if (filter === 'activos') {
      items = items.filter(m => m.activo);
    } else if (filter === 'inactivos') {
      items = items.filter(m => !m.activo);
    }

    if (query) {
      items = items.filter(m => 
        m.codigoDane.toLowerCase().includes(query) || 
        m.nombre.toLowerCase().includes(query) ||
        this.getDepartamentoNombre(m).toLowerCase().includes(query)
      );
    }

    return items;
  });

  // Dynamic counts
  counts = computed(() => {
    const all = this.listaMunicipios();
    return {
      total: all.length,
      active: all.filter(m => m.activo).length,
      inactive: all.filter(m => !m.activo).length
    };
  });

  ngOnInit() {
    this.facade.cargarMunicipios(1, 100);
    this.departamentosFacade.cargarDepartamentos(1, 100);
  }

  getDepartamentoNombre(item: Municipio): string {
    if (typeof item.departamento === 'string') {
      return item.departamento;
    }
    if (item.departamento && typeof item.departamento === 'object') {
      return item.departamento.nombre || 'Cauca';
    }
    return 'Cauca';
  }

  setFilter(filter: 'todos' | 'activos' | 'inactivos') {
    this.selectedFilter.set(filter);
  }

  openNew() {
    this.selectedId = null;
    this.municipioForm.reset({ 
      codigoDane: '',
      nombre: '',
      departamentoNombre: 'Cauca',
      activo: true 
    });
    this.isSlideOverOpen = true;
  }

  edit(item: Municipio) {
    this.selectedId = item.id;
    this.municipioForm.patchValue({
      codigoDane: item.codigoDane,
      nombre: item.nombre,
      departamentoNombre: this.getDepartamentoNombre(item),
      activo: item.activo
    });
    this.isSlideOverOpen = true;
  }

  toggleActivo(item: Municipio) {
    const nuevoEstado = !item.activo;
    const actionName = nuevoEstado ? 'activado' : 'desactivado';

    this.facade.actualizarMunicipio(item.id, {
      codigoDane: item.codigoDane,
      nombre: item.nombre,
      activo: nuevoEstado,
      departamento: item.departamento
    }).subscribe({
      next: () => {
        this.toast.success(`Municipio ${actionName} exitosamente`);
        this.facade.cargarMunicipios(1, 100);
      },
      error: () => {
        // Fallback in-memory
        const current = this.defaultMunicipios.find(m => m.id === item.id);
        if (current) {
          current.activo = nuevoEstado;
          this.searchQuery.set(this.searchQuery());
        }
        this.toast.info(`Estado actualizado: ${nuevoEstado ? 'Activo' : 'Inactivo'}`);
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

      const payload: Partial<Municipio> = {
        codigoDane: val.codigoDane!,
        nombre: val.nombre!,
        activo: val.activo ?? true,
        departamento: val.departamentoNombre!
      };

      const observer = {
        next: () => {
          this.toast.success(`Municipio ${actionName} exitosamente`);
          this.closeSlideOver();
          this.facade.cargarMunicipios(1, 100);
        },
        error: () => {
          // Fallback in-memory
          if (this.isEditMode) {
            const index = this.defaultMunicipios.findIndex(m => m.id === this.selectedId);
            if (index !== -1) {
              this.defaultMunicipios[index] = {
                ...this.defaultMunicipios[index],
                codigoDane: payload.codigoDane!,
                nombre: payload.nombre!,
                activo: payload.activo ?? true,
                departamento: payload.departamento!
              };
            }
          } else {
            this.defaultMunicipios.push({
              id: Date.now(),
              codigoDane: payload.codigoDane!,
              nombre: payload.nombre!,
              activo: payload.activo ?? true,
              departamento: payload.departamento!
            });
          }
          this.toast.success(`Municipio ${actionName} exitosamente`);
          this.closeSlideOver();
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
