import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ExencionesTributariasFacade } from '../../../../../application/facades/exenciones-tributarias.facade';
import { ExencionTributariaDto } from '../../../../../domain/interfaces/exenciones-tributarias.interface';
import { ToastService } from '../../../../../../../core/services/toast.service';

@Component({
  selector: 'app-exenciones-tributarias',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './exenciones-tributarias.html',     
  styleUrl: './exenciones-tributarias.css'
})
export class ExencionesTributariasPage implements OnInit {
  public facade = inject(ExencionesTributariasFacade);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  // Formulario Reactivo
  exencionForm!: FormGroup;

  // Estado UI
  readonly isSlideOverOpen = signal<boolean>(false);
  readonly isDetailsModalOpen = signal<boolean>(false);
  readonly selectedItem = signal<ExencionTributariaDto | null>(null);
  readonly itemParaEliminar = signal<ExencionTributariaDto | null>(null);
  readonly isEditMode = signal<boolean>(false);

  // Opciones de ámbito y tipos de beneficio estándar
  readonly ambitosDisponibles = ['DEPARTAMENTAL', 'MUNICIPAL', 'NACIONAL'];
  readonly tiposBeneficioDisponibles = ['EXENTO', 'REDUCCION'];

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    const today = new Date().toISOString().split('T')[0];

    this.exencionForm = this.fb.group({
      id: [0],
      vigenciaFiscalId: [null, [Validators.required]],
      normaTributariaId: [null, [Validators.required]],
      departamentoId: [null, [Validators.required]],
      ambito: ['DEPARTAMENTAL', [Validators.required]],
      codigo: ['', [Validators.required, Validators.maxLength(50)]],
      nombre: ['', [Validators.required, Validators.maxLength(250)]],
      tipoBeneficio: ['EXENTO', [Validators.required]],
      porcentajeExoneracion: [100, [Validators.required, Validators.min(0), Validators.max(100)]],
      naturalezaJuridicaId: [null],
      servicioVehiculoId: [null],
      claseVehiculoId: [null],
      combustibleId: [null],
      antiguedadMinimaAnios: [null, [Validators.min(0)]],
      fechaInicioVigencia: [today, [Validators.required]],
      fechaFinVigencia: [null],
      activa: [true]
    });
  }

  // Búsqueda y Filtros
  onSearch(term: string): void {
    this.facade.searchTerm.set(term);
    this.facade.pageNumber.set(1);
    this.facade.cargarExenciones();
  }

  onFilterVigencia(vigenciaId: any): void {
    this.facade.vigenciaFiltro.set(vigenciaId === 'TODOS' ? 'TODOS' : Number(vigenciaId));
    this.facade.pageNumber.set(1);
    this.facade.cargarExenciones();
  }

  onFilterDepartamento(deptoId: any): void {
    this.facade.departamentoFiltro.set(deptoId === 'TODOS' ? 'TODOS' : Number(deptoId));
    this.facade.pageNumber.set(1);
    this.facade.cargarExenciones();
  }

  onFilterAmbito(ambito: string): void {
    this.facade.ambitoFiltro.set(ambito);
    this.facade.pageNumber.set(1);
    this.facade.cargarExenciones();
  }

  onFilterTipoBeneficio(tipo: string): void {
    this.facade.tipoBeneficioFiltro.set(tipo);
    this.facade.pageNumber.set(1);
    this.facade.cargarExenciones();
  }

  onFilterEstado(estado: 'TODOS' | 'ACTIVOS' | 'INACTIVOS'): void {
    this.facade.estadoFiltro.set(estado);
    this.facade.pageNumber.set(1);
    this.facade.cargarExenciones();
  }

  // Paginación
  onPageChange(page: number): void {
    this.facade.pageNumber.set(page);
    this.facade.cargarExenciones();
  }

  onPageSizeChange(size: number): void {
    this.facade.pageSize.set(size);
    this.facade.pageNumber.set(1);
    this.facade.cargarExenciones();
  }

  // Modales y Acciones
  abrirCrear(): void {
    this.isEditMode.set(false);
    this.selectedItem.set(null);

    const primerVig = this.facade.vigencias()[0]?.id || null;
    const primerNorma = this.facade.normas()[0]?.id || null;
    const primerDep = this.facade.departamentos()[0]?.id || null;
    const today = new Date().toISOString().split('T')[0];

    this.exencionForm.reset({
      id: 0,
      vigenciaFiscalId: primerVig,
      normaTributariaId: primerNorma,
      departamentoId: primerDep,
      ambito: 'DEPARTAMENTAL',
      codigo: '',
      nombre: '',
      tipoBeneficio: 'EXENTO',
      porcentajeExoneracion: 100,
      naturalezaJuridicaId: null,
      servicioVehiculoId: null,
      claseVehiculoId: null,
      combustibleId: null,
      antiguedadMinimaAnios: null,
      fechaInicioVigencia: today,
      fechaFinVigencia: null,
      activa: true
    });
    this.isSlideOverOpen.set(true);
  }

  abrirEditar(item: ExencionTributariaDto): void {
    this.isEditMode.set(true);
    this.selectedItem.set(item);

    const inicio = item.fechaInicioVigencia ? item.fechaInicioVigencia.split('T')[0] : '';
    const fin = item.fechaFinVigencia ? item.fechaFinVigencia.split('T')[0] : null;

    this.exencionForm.patchValue({
      id: item.id,
      vigenciaFiscalId: item.vigenciaFiscalId,
      normaTributariaId: item.normaTributariaId,
      departamentoId: item.departamentoId,
      ambito: item.ambito,
      codigo: item.codigo,
      nombre: item.nombre,
      tipoBeneficio: item.tipoBeneficio,
      porcentajeExoneracion: item.porcentajeExoneracion,
      naturalezaJuridicaId: item.naturalezaJuridicaId ?? null,
      servicioVehiculoId: item.servicioVehiculoId ?? null,
      claseVehiculoId: item.claseVehiculoId ?? null,
      combustibleId: item.combustibleId ?? null,
      antiguedadMinimaAnios: item.antiguedadMinimaAnios ?? null,
      fechaInicioVigencia: inicio,
      fechaFinVigencia: fin,
      activa: item.activa
    });
    this.isSlideOverOpen.set(true);
  }

  abrirDetalles(item: ExencionTributariaDto): void {
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

  guardarExencion(): void {
    if (this.exencionForm.invalid) {
      this.exencionForm.markAllAsTouched();
      this.toast.warning('Por favor complete todos los campos obligatorios correctamente.');
      return;
    }

    const val = this.exencionForm.value;

    if (val.fechaFinVigencia && val.fechaInicioVigencia > val.fechaFinVigencia) {
      this.toast.error('La fecha de inicio no puede ser posterior a la fecha de fin de vigencia.');
      return;
    }

    const payloadBase = {
      normaTributariaId: Number(val.normaTributariaId),
      vigenciaFiscalId: Number(val.vigenciaFiscalId),
      ambito: val.ambito,
      departamentoId: Number(val.departamentoId),
      codigo: val.codigo.toUpperCase().trim(),
      nombre: val.nombre.trim(),
      tipoBeneficio: val.tipoBeneficio,
      porcentajeExoneracion: Number(val.porcentajeExoneracion),
      naturalezaJuridicaId: val.naturalezaJuridicaId ? Number(val.naturalezaJuridicaId) : null,
      servicioVehiculoId: val.servicioVehiculoId ? Number(val.servicioVehiculoId) : null,
      claseVehiculoId: val.claseVehiculoId ? Number(val.claseVehiculoId) : null,
      combustibleId: val.combustibleId ? Number(val.combustibleId) : null,
      antiguedadMinimaAnios: val.antiguedadMinimaAnios !== null && val.antiguedadMinimaAnios !== '' ? Number(val.antiguedadMinimaAnios) : null,
      fechaInicioVigencia: val.fechaInicioVigencia,
      fechaFinVigencia: val.fechaFinVigencia || null
    };

    if (this.isEditMode()) {
      const payload = {
        id: Number(val.id),
        ...payloadBase,
        activa: Boolean(val.activa)
      };

      this.facade.actualizarExencion(val.id, payload).subscribe(ok => {
        if (ok) {
          this.toast.success('Exención tributaria actualizada exitosamente.');
          this.cerrarSlideOver();
        } else {
          this.toast.error('Error al actualizar la exención tributaria.');
        }
      });
    } else {
      const payload = {
        ...payloadBase,
        activa: Boolean(val.activa ?? true)
      };

      this.facade.crearExencion(payload).subscribe(ok => {
        if (ok) {
          this.toast.success('Exención tributaria registrada exitosamente.');
          this.cerrarSlideOver();
        } else {
          this.toast.error('Error al registrar la exención. Verifique que el código no esté duplicado para esta vigencia.');
        }
      });
    }
  }

  toggleActiva(item: ExencionTributariaDto): void {
    const estadoTexto = !item.activa ? 'activada' : 'desactivada';
    this.facade.toggleActiva(item).subscribe(ok => {
      if (ok) {
        this.toast.success(`Exención tributaria ${estadoTexto} correctamente.`);
      } else {
        this.toast.error('No se pudo cambiar el estado de la exención.');
      }
    });
  }

  // Eliminación Física
  abrirConfirmarEliminar(item: ExencionTributariaDto): void {
    this.itemParaEliminar.set(item);
  }

  cerrarConfirmarEliminar(): void {
    this.itemParaEliminar.set(null);
  }

  confirmarEliminacion(): void {
    const item = this.itemParaEliminar();
    if (!item) return;

    this.facade.eliminarExencion(item.id).subscribe(ok => {
      if (ok) {
        this.toast.success('Exención tributaria eliminada exitosamente.');
        this.cerrarConfirmarEliminar();
      } else {
        this.toast.error('Error al eliminar la exención tributaria.');
      }
    });
  }
}
