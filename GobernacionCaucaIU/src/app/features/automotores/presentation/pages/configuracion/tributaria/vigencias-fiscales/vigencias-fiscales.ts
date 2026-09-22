import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { VigenciasFiscalesFacade } from '../../../../../application/facades/vigencias-fiscales.facade';
import { VigenciaFiscalDto } from '../../../../../domain/interfaces/vigencia-fiscal.interface';
import { ToastService } from '../../../../../../../core/services/toast.service';

@Component({
  selector: 'app-vigencias-fiscales',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './vigencias-fiscales.html'
})
export class VigenciasFiscalesPage implements OnInit {
  public facade = inject(VigenciasFiscalesFacade);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  // Formulario Reactivo
  vigenciaForm!: FormGroup;

  // Estados UI (Modales, Slide-overs)
  readonly isSlideOverOpen = signal<boolean>(false);
  readonly isDetailsModalOpen = signal<boolean>(false);
  readonly selectedItem = signal<VigenciaFiscalDto | null>(null);
  readonly itemParaEliminar = signal<VigenciaFiscalDto | null>(null);
  readonly isEditMode = signal<boolean>(false);

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    const currentYear = new Date().getFullYear();
    this.vigenciaForm = this.fb.group({
      id: [0],
      anio: [currentYear, [Validators.required, Validators.min(1900), Validators.max(2100)]],
      fechaInicio: [`${currentYear}-01-01`],
      fechaFin: [`${currentYear}-12-31`],
      activa: [true]
    });
  }

  // Búsqueda y Filtros
  onSearch(term: string): void {
    this.facade.searchTerm.set(term);
    this.facade.pageNumber.set(1);
    this.facade.cargarVigencias();
  }

  onFilterEstado(estado: 'TODOS' | 'ACTIVAS' | 'INACTIVAS'): void {
    this.facade.estadoFiltro.set(estado);
    this.facade.pageNumber.set(1);
    this.facade.cargarVigencias();
  }

  // Paginación
  onPageChange(page: number): void {
    if (page < 1 || page > this.facade.totalPages()) return;
    this.facade.pageNumber.set(page);
    this.facade.cargarVigencias();
  }

  onPageSizeChange(size: number): void {
    this.facade.pageSize.set(size);
    this.facade.pageNumber.set(1);
    this.facade.cargarVigencias();
  }

  // Control de Modales & SlideOver
  abrirCrear(): void {
    this.isEditMode.set(false);
    this.selectedItem.set(null);

    const nextYear = new Date().getFullYear();
    this.vigenciaForm.reset({
      id: 0,
      anio: nextYear,
      fechaInicio: `${nextYear}-01-01`,
      fechaFin: `${nextYear}-12-31`,
      activa: true
    });
    this.isSlideOverOpen.set(true);
  }

  abrirEditar(item: VigenciaFiscalDto): void {
    this.isEditMode.set(true);
    this.selectedItem.set(item);

    this.vigenciaForm.patchValue({
      id: item.id,
      anio: item.anio,
      fechaInicio: item.fechaInicio || '',
      fechaFin: item.fechaFin || '',
      activa: item.activa
    });
    this.isSlideOverOpen.set(true);
  }

  abrirDetalles(item: VigenciaFiscalDto): void {
    this.selectedItem.set(item);
    this.isDetailsModalOpen.set(true);
  }

  cerrarSlideOver(): void {
    this.isSlideOverOpen.set(false);
    this.selectedItem.set(null);
  }

  cerrarDetallesModal(): void {
    this.isDetailsModalOpen.set(false);
    this.selectedItem.set(null);
  }

  // Guardar Cambios
  guardarVigencia(): void {
    if (this.vigenciaForm.invalid) {
      this.vigenciaForm.markAllAsTouched();
      this.toast.warning('Por favor verifique los datos ingresados en el formulario.');
      return;
    }

    const val = this.vigenciaForm.value;

    if (val.fechaInicio && val.fechaFin && val.fechaInicio > val.fechaFin) {
      this.toast.error('La fecha de fin no puede ser anterior a la fecha de inicio.');
      return;
    }

    if (this.isEditMode()) {
      const payload = {
        id: Number(val.id),
        anio: Number(val.anio),
        activa: Boolean(val.activa),
        fechaInicio: val.fechaInicio ? String(val.fechaInicio) : null,
        fechaFin: val.fechaFin ? String(val.fechaFin) : null
      };

      this.facade.actualizarVigencia(val.id, payload).subscribe(res => {
        if (res.success) {
          this.toast.success(res.message || 'Vigencia fiscal actualizada correctamente.');
          this.cerrarSlideOver();
        } else {
          this.toast.error(res.message || 'Error al actualizar la vigencia fiscal.');
        }
      });
    } else {
      const payload = {
        anio: Number(val.anio),
        activa: Boolean(val.activa ?? true),
        fechaInicio: val.fechaInicio ? String(val.fechaInicio) : null,
        fechaFin: val.fechaFin ? String(val.fechaFin) : null
      };

      this.facade.crearVigencia(payload).subscribe(res => {
        if (res.success) {
          this.toast.success(res.message || 'Vigencia fiscal registrada correctamente.');
          this.cerrarSlideOver();
        } else {
          this.toast.error(res.message || 'Error al crear la vigencia fiscal.');
        }
      });
    }
  }

  // Alternar Activa
  toggleActiva(item: VigenciaFiscalDto): void {
    const nuevoEstado = !item.activa ? 'activada' : 'desactivada';
    this.facade.toggleActiva(item).subscribe(ok => {
      if (ok) {
        this.toast.success(`Vigencia ${item.anio} ${nuevoEstado} exitosamente.`);
      } else {
        this.toast.error('No se pudo modificar el estado de la vigencia.');
      }
    });
  }

  // Eliminación Física
  abrirConfirmarEliminar(item: VigenciaFiscalDto): void {
    this.itemParaEliminar.set(item);
  }

  cerrarConfirmarEliminar(): void {
    this.itemParaEliminar.set(null);
  }

  confirmarEliminacion(): void {
    const item = this.itemParaEliminar();
    if (!item) return;

    this.facade.eliminarVigencia(item.id).subscribe(res => {
      if (res.success) {
        this.toast.success('Vigencia fiscal eliminada exitosamente.');
        this.cerrarConfirmarEliminar();
      } else {
        this.toast.error(res.message || 'Error al eliminar la vigencia fiscal.');
        this.cerrarConfirmarEliminar();
      }
    });
  }

  // Helper para autocompletar fechas según el año digitado
  onAnioChange(): void {
    const anio = this.vigenciaForm.get('anio')?.value;
    if (anio && anio >= 1900 && anio <= 2100) {
      const fechaIni = this.vigenciaForm.get('fechaInicio')?.value;
      const fechaFin = this.vigenciaForm.get('fechaFin')?.value;
      if (!fechaIni || fechaIni.startsWith('20')) {
        this.vigenciaForm.patchValue({
          fechaInicio: `${anio}-01-01`,
          fechaFin: `${anio}-12-31`
        });
      }
    }
  }
}
