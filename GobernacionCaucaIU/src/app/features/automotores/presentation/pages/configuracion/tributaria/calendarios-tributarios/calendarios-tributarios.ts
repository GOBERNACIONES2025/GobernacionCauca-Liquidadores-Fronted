import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CalendariosTributariosFacade } from '../../../../../application/facades/calendarios-tributarios.facade';
import { CalendarioTributarioDto } from '../../../../../domain/interfaces/calendarios-tributarios.interface';
import { ToastService } from '../../../../../../../core/services/toast.service';

@Component({
  selector: 'app-calendarios-tributarios',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './calendarios-tributarios.html'
})
export class CalendariosTributariosPage implements OnInit {
  public facade = inject(CalendariosTributariosFacade);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  // Formulario Reactivo
  calendarioForm!: FormGroup;

  // Estado UI
  readonly isSlideOverOpen = signal<boolean>(false);
  readonly isDetailsModalOpen = signal<boolean>(false);
  readonly selectedItem = signal<CalendarioTributarioDto | null>(null);
  readonly itemParaEliminar = signal<CalendarioTributarioDto | null>(null);
  readonly isEditMode = signal<boolean>(false);

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    const today = new Date().toISOString().split('T')[0];

    this.calendarioForm = this.fb.group({
      id: [0],
      vigenciaFiscalIdInicio: [null, [Validators.required]],
      vigenciaFiscalIdFin: [null, [Validators.required]],
      normaTributariaId: [null, [Validators.required]],
      codigoImpuesto: ['VEHICULOS', [Validators.required, Validators.maxLength(50)]],
      fechaInicio: [today, [Validators.required]],
      fechaVencimiento: [today, [Validators.required]],
      porcentajeDescuento: [10, [Validators.required, Validators.min(1), Validators.max(100)]],
      activo: [true]
    }, {
      validators: [this.validarCoherenciaVigenciasYFechas()]
    });

    // Auto-ajustar año de fechaInicio al cambiar vigencia inicial
    this.calendarioForm.get('vigenciaFiscalIdInicio')?.valueChanges.subscribe(vigId => {
      if (!vigId) return;
      const vig = this.facade.vigencias().find(v => v.id === Number(vigId));
      if (!vig) return;
      const currentFecha = this.calendarioForm.get('fechaInicio')?.value;
      if (currentFecha) {
        const parts = currentFecha.split('-');
        if (parts.length === 3 && parseInt(parts[0], 10) !== vig.anio) {
          this.calendarioForm.patchValue({
            fechaInicio: `${vig.anio}-${parts[1]}-${parts[2]}`
          }, { emitEvent: false });
        }
      } else {
        this.calendarioForm.patchValue({
          fechaInicio: `${vig.anio}-01-01`
        }, { emitEvent: false });
      }
      this.calendarioForm.updateValueAndValidity({ emitEvent: false });
    });

    // Auto-ajustar año de fechaVencimiento al cambiar vigencia final
    this.calendarioForm.get('vigenciaFiscalIdFin')?.valueChanges.subscribe(vigId => {
      if (!vigId) return;
      const vig = this.facade.vigencias().find(v => v.id === Number(vigId));
      if (!vig) return;
      const currentFecha = this.calendarioForm.get('fechaVencimiento')?.value;
      if (currentFecha) {
        const parts = currentFecha.split('-');
        if (parts.length === 3 && parseInt(parts[0], 10) !== vig.anio) {
          this.calendarioForm.patchValue({
            fechaVencimiento: `${vig.anio}-${parts[1]}-${parts[2]}`
          }, { emitEvent: false });
        }
      } else {
        this.calendarioForm.patchValue({
          fechaVencimiento: `${vig.anio}-12-31`
        }, { emitEvent: false });
      }
      this.calendarioForm.updateValueAndValidity({ emitEvent: false });
    });
  }

  /**
   * Validador reactivo para asegurar consistencia entre los años de las vigencias y las fechas
   */
  private validarCoherenciaVigenciasYFechas() {
    return (group: any) => {
      const vigIdInicio = group.get('vigenciaFiscalIdInicio')?.value;
      const vigIdFin = group.get('vigenciaFiscalIdFin')?.value;
      const fechaInicio = group.get('fechaInicio')?.value;
      const fechaVencimiento = group.get('fechaVencimiento')?.value;

      if (!vigIdInicio || !vigIdFin || !fechaInicio || !fechaVencimiento) {
        return null;
      }

      const vigencias = this.facade.vigencias();
      const vigInicio = vigencias.find(v => v.id === Number(vigIdInicio));
      const vigFin = vigencias.find(v => v.id === Number(vigIdFin));

      const errors: any = {};

      if (vigInicio && vigFin && vigInicio.anio > vigFin.anio) {
        errors['rangoVigenciasInvalido'] = true;
      }

      const anioInicio = parseInt(fechaInicio.split('-')[0], 10);
      const anioFin = parseInt(fechaVencimiento.split('-')[0], 10);

      if (vigInicio && anioInicio !== vigInicio.anio) {
        errors['fechaInicioIncoherente'] = { anioEsperado: vigInicio.anio, anioActual: anioInicio };
      }

      if (vigFin && anioFin !== vigFin.anio) {
        errors['fechaFinIncoherente'] = { anioEsperado: vigFin.anio, anioActual: anioFin };
      }

      if (fechaInicio > fechaVencimiento) {
        errors['rangoFechasInvalido'] = true;
      }

      return Object.keys(errors).length > 0 ? errors : null;
    };
  }

  // Búsqueda y Filtros
  onSearch(term: string): void {
    this.facade.searchTerm.set(term);
    this.facade.pageNumber.set(1);
    this.facade.cargarCalendarios();
  }

  onFilterVigencia(vigenciaId: any): void {
    this.facade.vigenciaFiltro.set(vigenciaId === 'TODOS' ? 'TODOS' : Number(vigenciaId));
    this.facade.pageNumber.set(1);
    this.facade.cargarCalendarios();
  }

  onFilterNorma(normaId: any): void {
    this.facade.normaFiltro.set(normaId === 'TODOS' ? 'TODOS' : Number(normaId));
    this.facade.pageNumber.set(1);
    this.facade.cargarCalendarios();
  }

  onFilterEstado(estado: 'TODOS' | 'ACTIVOS' | 'INACTIVOS'): void {
    this.facade.estadoFiltro.set(estado);
    this.facade.pageNumber.set(1);
    this.facade.cargarCalendarios();
  }

  // Paginación
  onPageChange(page: number): void {
    this.facade.pageNumber.set(page);
    this.facade.cargarCalendarios();
  }

  onPageSizeChange(size: number): void {
    this.facade.pageSize.set(size);
    this.facade.pageNumber.set(1);
    this.facade.cargarCalendarios();
  }

  // Modales y Acciones
  abrirCrear(): void {
    this.isEditMode.set(false);
    this.selectedItem.set(null);

    const primerVig = this.facade.vigencias()[0];
    const primerVigId = primerVig?.id || null;
    const primerNorma = this.facade.normas()[0]?.id || null;
    const anioVig = primerVig?.anio || new Date().getFullYear();
    const today = new Date();
    const isCurrentYear = today.getFullYear() === anioVig;

    const fechaIniDefault = isCurrentYear ? today.toISOString().split('T')[0] : `${anioVig}-01-01`;
    const fechaFinDefault = isCurrentYear ? today.toISOString().split('T')[0] : `${anioVig}-12-31`;

    this.calendarioForm.reset({
      id: 0,
      vigenciaFiscalIdInicio: primerVigId,
      vigenciaFiscalIdFin: primerVigId,
      normaTributariaId: primerNorma,
      codigoImpuesto: 'VEHICULOS',
      fechaInicio: fechaIniDefault,
      fechaVencimiento: fechaFinDefault,
      porcentajeDescuento: 10,
      activo: true
    });
    this.isSlideOverOpen.set(true);
  }

  /**
   * Formatea un valor de porcentaje decimal (ej: 0.15) para mostrarlo como porcentaje legible (15%)
   */
  getPorcentajeDisplay(valor?: number | null): number {
    if (valor === null || valor === undefined) return 0;
    const num = Number(valor);
    if (isNaN(num) || num === 0) return 0;
    // Si viene en formato decimal de base de datos (0 < valor <= 1)
    if (num > 0 && num <= 1) {
      return Number((num * 100).toFixed(2));
    }
    return Number(num.toFixed(2));
  }

  abrirEditar(item: CalendarioTributarioDto): void {
    this.isEditMode.set(true);
    this.selectedItem.set(item);

    const inicio = item.fechaInicio ? item.fechaInicio.split('T')[0] : (item.fechaInicioVencimiento ? item.fechaInicioVencimiento.split('T')[0] : '');
    const fin = item.fechaVencimiento ? item.fechaVencimiento.split('T')[0] : (item.fechaFinVencimiento ? item.fechaFinVencimiento.split('T')[0] : '');
    const rawDesc = item.porcentajeDescuento;
    const descuento = this.getPorcentajeDisplay(rawDesc);

    this.calendarioForm.patchValue({
      id: item.id,
      vigenciaFiscalIdInicio: item.vigenciaFiscalIdInicio ?? item.vigenciaFiscalId ?? null,
      vigenciaFiscalIdFin: item.vigenciaFiscalIdFin ?? item.vigenciaFiscalIdInicio ?? item.vigenciaFiscalId ?? null,
      normaTributariaId: item.normaTributariaId ?? null,
      codigoImpuesto: item.codigoImpuesto || 'VEHICULOS',
      fechaInicio: inicio,
      fechaVencimiento: fin,
      porcentajeDescuento: Math.max(1, Math.min(100, descuento || 1)),
      activo: item.activo
    });
    this.isSlideOverOpen.set(true);
  }

  abrirDetalles(item: CalendarioTributarioDto): void {
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

  guardarCalendario(): void {
    if (this.calendarioForm.invalid) {
      this.calendarioForm.markAllAsTouched();

      const formErrors = this.calendarioForm.errors;
      if (formErrors) {
        if (formErrors['rangoVigenciasInvalido']) {
          this.toast.error('El año de la vigencia fiscal inicial no puede ser mayor que el año de la vigencia final.');
          return;
        }
        if (formErrors['fechaInicioIncoherente']) {
          const err = formErrors['fechaInicioIncoherente'];
          this.toast.error(`La fecha de inicio (${err.anioActual}) debe corresponder al año de la vigencia fiscal inicial (${err.anioEsperado}).`);
          return;
        }
        if (formErrors['fechaFinIncoherente']) {
          const err = formErrors['fechaFinIncoherente'];
          this.toast.error(`La fecha de vencimiento (${err.anioActual}) debe corresponder al año de la vigencia fiscal final (${err.anioEsperado}).`);
          return;
        }
        if (formErrors['rangoFechasInvalido']) {
          this.toast.error('La fecha de inicio no puede ser posterior a la fecha de vencimiento.');
          return;
        }
      }

      this.toast.warning('Por favor complete todos los campos obligatorios correctamente. El porcentaje debe estar entre 1 y 100.');
      return;
    }

    const val = this.calendarioForm.value;

    if (val.fechaInicio > val.fechaVencimiento) {
      this.toast.error('La fecha de inicio no puede ser posterior a la fecha de vencimiento.');
      return;
    }

    // Validación cronológica de años de vigencia
    const vigInicio = this.facade.vigencias().find(v => v.id === Number(val.vigenciaFiscalIdInicio));
    const vigFin = this.facade.vigencias().find(v => v.id === Number(val.vigenciaFiscalIdFin));
    if (vigInicio && vigFin && vigInicio.anio > vigFin.anio) {
      this.toast.error('El año de la vigencia fiscal inicial no puede ser mayor que el año de la vigencia fiscal final.');
      return;
    }

    // Validación de coherencia año fecha inicio vs vigencia inicio
    const anioInicio = parseInt(val.fechaInicio.split('-')[0], 10);
    if (vigInicio && anioInicio !== vigInicio.anio) {
      this.toast.error(`El año de la fecha de inicio (${anioInicio}) debe ser igual al año de la vigencia fiscal inicial (${vigInicio.anio}).`);
      return;
    }

    // Validación de coherencia año fecha fin vs vigencia fin
    const anioFin = parseInt(val.fechaVencimiento.split('-')[0], 10);
    if (vigFin && anioFin !== vigFin.anio) {
      this.toast.error(`El año de la fecha de vencimiento (${anioFin}) debe ser igual al año de la vigencia fiscal final (${vigFin.anio}).`);
      return;
    }

    const descVal = val.porcentajeDescuento !== null && val.porcentajeDescuento !== '' ? Number(val.porcentajeDescuento) : 0;
    if (descVal < 1 || descVal > 100) {
      this.toast.error('El porcentaje de descuento debe estar entre 1% y 100%.');
      return;
    }

    const payloadBase = {
      vigenciaFiscalIdInicio: Number(val.vigenciaFiscalIdInicio),
      vigenciaFiscalIdFin: Number(val.vigenciaFiscalIdFin),
      normaTributariaId: Number(val.normaTributariaId),
      codigoImpuesto: (val.codigoImpuesto || 'VEHICULOS').toUpperCase().trim(),
      fechaInicio: val.fechaInicio,
      fechaVencimiento: val.fechaVencimiento,
      porcentajeDescuento: descVal,
      activo: Boolean(val.activo ?? true)
    };

    if (this.isEditMode()) {
      const payload = {
        id: Number(val.id),
        ...payloadBase
      };

      this.facade.actualizarCalendario(val.id, payload).subscribe(ok => {
        if (ok) {
          this.toast.success('Calendario tributario actualizado exitosamente.');
          this.cerrarSlideOver();
        } else {
          this.toast.error('Error al actualizar el calendario tributario.');
        }
      });
    } else {
      this.facade.crearCalendario(payloadBase).subscribe(ok => {
        if (ok) {
          this.toast.success('Calendario tributario registrado exitosamente.');
          this.cerrarSlideOver();
        } else {
          this.toast.error('Error al registrar el calendario tributario.');
        }
      });
    }
  }

  toggleActivo(item: CalendarioTributarioDto): void {
    const estadoTexto = !item.activo ? 'activado' : 'desactivado';
    this.facade.toggleActivo(item).subscribe(ok => {
      if (ok) {
        this.toast.success(`Calendario tributario ${estadoTexto} correctamente.`);
      } else {
        this.toast.error('No se pudo cambiar el estado del calendario tributario.');
      }
    });
  }

  // Eliminación Física
  abrirConfirmarEliminar(item: CalendarioTributarioDto): void {
    this.itemParaEliminar.set(item);
  }

  cerrarConfirmarEliminar(): void {
    this.itemParaEliminar.set(null);
  }

  confirmarEliminacion(): void {
    const item = this.itemParaEliminar();
    if (!item) return;

    this.facade.eliminarCalendario(item.id).subscribe(ok => {
      if (ok) {
        this.toast.success('Calendario tributario eliminado exitosamente.');
        this.cerrarConfirmarEliminar();
      } else {
        this.toast.error('Error al eliminar el calendario tributario.');
      }
    });
  }

  // Estado temporal
  getEstadoTemporal(item: CalendarioTributarioDto): { label: string; bgClass: string; textClass: string; icon: string } {
    if (!item.activo) {
      return {
        label: 'Inactivo',
        bgClass: 'bg-slate-100 border-slate-200',
        textClass: 'text-slate-600',
        icon: 'fa-ban'
      };
    }

    const today = new Date().toISOString().split('T')[0];
    const inicio = item.fechaInicio ? item.fechaInicio.split('T')[0] : (item.fechaInicioVencimiento ? item.fechaInicioVencimiento.split('T')[0] : '');
    const fin = item.fechaVencimiento ? item.fechaVencimiento.split('T')[0] : (item.fechaFinVencimiento ? item.fechaFinVencimiento.split('T')[0] : '');

    if (fin && fin < today) {
      return {
        label: 'Vencido',
        bgClass: 'bg-rose-50 border-rose-200',
        textClass: 'text-rose-700',
        icon: 'fa-circle-xmark'
      };
    } else if (inicio && inicio > today) {
      return {
        label: 'Programado',
        bgClass: 'bg-amber-50 border-amber-200',
        textClass: 'text-amber-700',
        icon: 'fa-clock'
      };
    } else {
      return {
        label: 'Vigente',
        bgClass: 'bg-emerald-50 border-emerald-200',
        textClass: 'text-emerald-700',
        icon: 'fa-circle-check'
      };
    }
  }
}
