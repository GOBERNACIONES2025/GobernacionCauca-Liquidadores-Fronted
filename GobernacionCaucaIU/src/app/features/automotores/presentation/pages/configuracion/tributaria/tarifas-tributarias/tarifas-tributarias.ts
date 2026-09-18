import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TarifasTributariasFacade } from '../../../../../application/facades/tarifas-tributarias.facade';
import { TarifaTributariaDto } from '../../../../../domain/interfaces/tarifas-tributarias.interface';
import { ToastService } from '../../../../../../../core/services/toast.service';

@Component({
  selector: 'app-tarifas-tributarias',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './tarifas-tributarias.html',
  styleUrl: './tarifas-tributarias.css'
})
export class TarifasTributariasPage implements OnInit {
  public facade = inject(TarifasTributariasFacade);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  // Formulario Reactivo
  tarifaForm!: FormGroup;

  // Estado UI
  readonly isSlideOverOpen = signal<boolean>(false);
  readonly isDetailsModalOpen = signal<boolean>(false);
  readonly selectedItem = signal<TarifaTributariaDto | null>(null);
  readonly itemParaEliminar = signal<TarifaTributariaDto | null>(null);
  readonly isEditMode = signal<boolean>(false);

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.tarifaForm = this.fb.group({
      id: [0],
      vigenciaFiscalId: [null, [Validators.required]],
      normaTributariaId: [null, [Validators.required]],
      departamentoId: [null, [Validators.required]],
      servicioVehiculoId: [null, [Validators.required]],
      claseVehiculoId: [null, [Validators.required]],
      combustibleId: [null, [Validators.required]],
      baseGravableDesde: [0, [Validators.required, Validators.min(0)]],
      baseGravableHasta: [null, [Validators.required, Validators.min(0)]],
      porcentajeTarifa: [null, [Validators.required, Validators.min(0), Validators.max(100)]],
      ordenRango: [1, [Validators.required, Validators.min(1)]],
      activa: [true]
    });
  }

  // Búsqueda y Filtros
  onSearch(term: string): void {
    this.facade.searchTerm.set(term);
    this.facade.pageNumber.set(1);
    this.facade.cargarTarifas();
  }

  onFilterVigencia(vigenciaId: any): void {
    this.facade.vigenciaFiltro.set(vigenciaId === 'TODOS' ? 'TODOS' : Number(vigenciaId));
    this.facade.pageNumber.set(1);
    this.facade.cargarTarifas();
  }

  onFilterClase(claseId: any): void {
    this.facade.claseFiltro.set(claseId === 'TODOS' ? 'TODOS' : Number(claseId));
    this.facade.pageNumber.set(1);
    this.facade.cargarTarifas();
  }

  onFilterServicio(servicioId: any): void {
    this.facade.servicioFiltro.set(servicioId === 'TODOS' ? 'TODOS' : Number(servicioId));
    this.facade.pageNumber.set(1);
    this.facade.cargarTarifas();
  }

  onFilterCombustible(combustibleId: any): void {
    this.facade.combustibleFiltro.set(combustibleId === 'TODOS' ? 'TODOS' : Number(combustibleId));
    this.facade.pageNumber.set(1);
    this.facade.cargarTarifas();
  }

  onFilterEstado(estado: 'TODOS' | 'ACTIVOS' | 'INACTIVOS'): void {
    this.facade.estadoFiltro.set(estado);
    this.facade.pageNumber.set(1);
    this.facade.cargarTarifas();
  }

  // Paginación
  onPageChange(page: number): void {
    this.facade.pageNumber.set(page);
    this.facade.cargarTarifas();
  }

  onPageSizeChange(size: number): void {
    this.facade.pageSize.set(size);
    this.facade.pageNumber.set(1);
    this.facade.cargarTarifas();
  }

  // Modales y Acciones
  abrirCrear(): void {
    this.isEditMode.set(false);
    this.selectedItem.set(null);

    const primerVig = this.facade.vigencias()[0]?.id || null;
    const primerNorma = this.facade.normas()[0]?.id || null;
    const primerDep = this.facade.departamentos()[0]?.id || null;
    const primerClase = this.facade.clasesVehiculo()[0]?.id || null;
    const primerServicio = this.facade.serviciosVehiculo()[0]?.id || null;
    const primerCombustible = this.facade.combustibles()[0]?.id || null;

    this.tarifaForm.reset({
      id: 0,
      vigenciaFiscalId: primerVig,
      normaTributariaId: primerNorma,
      departamentoId: primerDep,
      servicioVehiculoId: primerServicio,
      claseVehiculoId: primerClase,
      combustibleId: primerCombustible,
      baseGravableDesde: 0,
      baseGravableHasta: null,
      porcentajeTarifa: null,
      ordenRango: 1,
      activa: true
    });
    this.isSlideOverOpen.set(true);
  }

  abrirEditar(item: TarifaTributariaDto): void {
    this.isEditMode.set(true);
    this.selectedItem.set(item);

    this.tarifaForm.patchValue({
      id: item.id,
      vigenciaFiscalId: item.vigenciaFiscalId,
      normaTributariaId: item.normaTributariaId,
      departamentoId: item.departamentoId,
      servicioVehiculoId: item.servicioVehiculoId,
      claseVehiculoId: item.claseVehiculoId,
      combustibleId: item.combustibleId,
      baseGravableDesde: item.baseGravableDesde,
      baseGravableHasta: item.baseGravableHasta,
      porcentajeTarifa: item.porcentajeTarifa,
      ordenRango: item.ordenRango,
      activa: item.activa
    });
    this.isSlideOverOpen.set(true);
  }

  abrirDetalles(item: TarifaTributariaDto): void {
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

  guardarTarifa(): void {
    if (this.tarifaForm.invalid) {
      this.tarifaForm.markAllAsTouched();
      this.toast.warning('Por favor complete todos los campos requeridos correctamente.');
      return;
    }

    const val = this.tarifaForm.value;

    if (Number(val.baseGravableDesde) > Number(val.baseGravableHasta)) {
      this.toast.error('La Base Gravable Desde no puede ser mayor que la Base Gravable Hasta.');
      return;
    }

    if (this.isEditMode()) {
      const payload = {
        id: Number(val.id),
        vigenciaFiscalId: Number(val.vigenciaFiscalId),
        normaTributariaId: Number(val.normaTributariaId),
        departamentoId: Number(val.departamentoId),
        servicioVehiculoId: Number(val.servicioVehiculoId),
        claseVehiculoId: Number(val.claseVehiculoId),
        combustibleId: Number(val.combustibleId),
        baseGravableDesde: Number(val.baseGravableDesde),
        baseGravableHasta: Number(val.baseGravableHasta),
        porcentajeTarifa: Number(val.porcentajeTarifa),
        ordenRango: Number(val.ordenRango),
        activa: Boolean(val.activa)
      };

      this.facade.actualizarTarifa(val.id, payload).subscribe(ok => {
        if (ok) {
          this.toast.success('Tarifa tributaria actualizada exitosamente.');
          this.cerrarSlideOver();
        } else {
          this.toast.error('Error al actualizar la tarifa tributaria.');
        }
      });
    } else {
      const payload = {
        vigenciaFiscalId: Number(val.vigenciaFiscalId),
        normaTributariaId: Number(val.normaTributariaId),
        departamentoId: Number(val.departamentoId),
        servicioVehiculoId: Number(val.servicioVehiculoId),
        claseVehiculoId: Number(val.claseVehiculoId),
        combustibleId: Number(val.combustibleId),
        baseGravableDesde: Number(val.baseGravableDesde),
        baseGravableHasta: Number(val.baseGravableHasta),
        porcentajeTarifa: Number(val.porcentajeTarifa),
        ordenRango: Number(val.ordenRango),
        activa: Boolean(val.activa ?? true)
      };

      this.facade.crearTarifa(payload).subscribe(ok => {
        if (ok) {
          this.toast.success('Tarifa tributaria registrada exitosamente.');
          this.cerrarSlideOver();
        } else {
          this.toast.error('Error al registrar la tarifa tributaria. Verifique que la combinación no exista.');
        }
      });
    }
  }

  toggleActiva(item: TarifaTributariaDto): void {
    const estadoTexto = !item.activa ? 'activada' : 'desactivada';
    this.facade.toggleActiva(item).subscribe(ok => {
      if (ok) {
        this.toast.success(`Tarifa tributaria ${estadoTexto} correctamente.`);
      } else {
        this.toast.error('No se pudo cambiar el estado de la tarifa.');
      }
    });
  }

  // Eliminación Física
  abrirConfirmarEliminar(item: TarifaTributariaDto): void {
    this.itemParaEliminar.set(item);
  }

  cerrarConfirmarEliminar(): void {
    this.itemParaEliminar.set(null);
  }

  confirmarEliminacion(): void {
    const item = this.itemParaEliminar();
    if (!item) return;

    this.facade.eliminarTarifa(item.id).subscribe(ok => {
      if (ok) {
        this.toast.success('Tarifa tributaria eliminada exitosamente.');
        this.cerrarConfirmarEliminar();
      } else {
        this.toast.error('Error al eliminar la tarifa tributaria.');
      }
    });
  }
}
