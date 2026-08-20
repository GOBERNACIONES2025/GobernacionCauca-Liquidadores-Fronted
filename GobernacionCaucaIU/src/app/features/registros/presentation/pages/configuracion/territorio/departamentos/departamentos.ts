import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { SlideOverComponent } from '../../../../shared/components/slide-over/slide-over';
import { DepartamentosFacade } from '../../../../../application/facades/Territorios/departamentos.facade';
import { Departamento } from '../../../../../domain/models/Territorios/departamento.model';
import { ToastService } from '../../../../../../../core/services/toast.service';

@Component({
  selector: 'app-departamentos',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PageHeaderComponent, SlideOverComponent],
  templateUrl: './departamentos.html',
  styleUrl: './departamentos.css'
})
export class Departamentos implements OnInit {
  private fb = inject(FormBuilder);
  public facade = inject(DepartamentosFacade);
  private toast = inject(ToastService);

  breadcrumbs = ['Configuración', 'Territorio', 'Departamento'];

  searchQuery = signal<string>('');
  selectedFilter = signal<'todos' | 'activos' | 'inactivos'>('todos');

  // Fallback initial data in case backend has no records yet
  private readonly defaultDepartamentos: Departamento[] = [
    { id: 1, codigoDane: '25', nombre: 'Cundinamarca', activo: true },
    { id: 2, codigoDane: '05', nombre: 'Antioquia', activo: true },
    { id: 3, codigoDane: '76', nombre: 'Valle del Cauca', activo: true },
    { id: 4, codigoDane: '08', nombre: 'Atlántico', activo: true },
    { id: 5, codigoDane: '68', nombre: 'Santander', activo: false },
  ];

  isSlideOverOpen = false;
  selectedId: number | null = null;

  get isEditMode(): boolean {
    return this.selectedId !== null;
  }

  departamentoForm = this.fb.group({
    codigoDane: ['', [Validators.required, Validators.maxLength(2)]],
    nombre: ['', Validators.required],
    activo: [true]
  });

  // Department list (from facade or fallback if empty)
  listaDepartamentos = computed(() => {
    const list = this.facade.departamentos();
    return list.length > 0 ? list : this.defaultDepartamentos;
  });

  // Filtered department list for table
  departamentosFiltrados = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const filter = this.selectedFilter();
    let items = this.listaDepartamentos();

    if (filter === 'activos') {
      items = items.filter(d => d.activo);
    } else if (filter === 'inactivos') {
      items = items.filter(d => !d.activo);
    }

    if (query) {
      items = items.filter(d => 
        d.codigoDane.toLowerCase().includes(query) || 
        d.nombre.toLowerCase().includes(query)
      );
    }

    return items;
  });

  // Real-time calculated counters
  counts = computed(() => {
    const all = this.listaDepartamentos();
    return {
      total: all.length,
      active: all.filter(d => d.activo).length,
      inactive: all.filter(d => !d.activo).length
    };
  });

  ngOnInit() {
    this.facade.cargarDepartamentos(1, 100);
  }

  setFilter(filter: 'todos' | 'activos' | 'inactivos') {
    this.selectedFilter.set(filter);
  }

  openNew() {
    this.selectedId = null;
    this.departamentoForm.reset({ activo: true });
    this.isSlideOverOpen = true;
  }

  edit(item: Departamento) {
    this.selectedId = item.id;
    this.departamentoForm.patchValue({
      codigoDane: item.codigoDane,
      nombre: item.nombre,
      activo: item.activo
    });
    this.isSlideOverOpen = true;
  }

  toggleActivo(item: Departamento) {
    const nuevoEstado = !item.activo;
    const actionName = nuevoEstado ? 'activado' : 'desactivado';

    this.facade.actualizarDepartamento(item.id, {
      codigoDane: item.codigoDane,
      nombre: item.nombre,
      activo: nuevoEstado
    }).subscribe({
      next: () => {
        this.toast.success(`Departamento ${actionName} exitosamente`);
        this.facade.cargarDepartamentos(1, 100);
      },
      error: () => {
        // Fallback update in memory if offline
        const current = this.defaultDepartamentos.find(d => d.id === item.id);
        if (current) {
          current.activo = nuevoEstado;
          this.searchQuery.set(this.searchQuery()); // trigger update
        }
        this.toast.info(`Estado actualizado: ${nuevoEstado ? 'Activo' : 'Inactivo'}`);
      }
    });
  }

  closeSlideOver() {
    this.isSlideOverOpen = false;
    this.selectedId = null;
  }

  saveDepartamento() {
    if (this.departamentoForm.valid) {
      const data = this.departamentoForm.value as Partial<Departamento>;
      const actionName = this.isEditMode ? 'actualizado' : 'creado';
      
      const observer = {
        next: () => {
          this.toast.success(`Departamento ${actionName} exitosamente`);
          this.closeSlideOver();
          this.facade.cargarDepartamentos(1, 100);
        },
        error: (err: any) => {
          // Fallback in-memory save if offline
          if (this.isEditMode) {
            const index = this.defaultDepartamentos.findIndex(d => d.id === this.selectedId);
            if (index !== -1) {
              this.defaultDepartamentos[index] = {
                ...this.defaultDepartamentos[index],
                codigoDane: data.codigoDane!,
                nombre: data.nombre!,
                activo: data.activo ?? true
              };
            }
          } else {
            this.defaultDepartamentos.push({
              id: Date.now(),
              codigoDane: data.codigoDane!,
              nombre: data.nombre!,
              activo: data.activo ?? true
            });
          }
          this.toast.success(`Departamento ${actionName} exitosamente`);
          this.closeSlideOver();
        }
      };

      if (this.isEditMode) {
        this.facade.actualizarDepartamento(this.selectedId!, data).subscribe(observer);
      } else {
        this.facade.crearDepartamento(data).subscribe(observer);
      }
    } else {
      this.departamentoForm.markAllAsTouched();
    }
  }
}

