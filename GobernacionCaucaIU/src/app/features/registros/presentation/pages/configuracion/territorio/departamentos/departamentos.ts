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

  // Filtered department list for table
  departamentosFiltrados = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const filter = this.selectedFilter();
    let items = this.facade.departamentos();

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
    const all = this.facade.departamentos();
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
      error: (err: any) => {
        this.toast.error(`Error al actualizar estado del departamento`);
        console.error(err);
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
          this.toast.error(`Error al intentar guardar el departamento`);
          console.error(err);
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


