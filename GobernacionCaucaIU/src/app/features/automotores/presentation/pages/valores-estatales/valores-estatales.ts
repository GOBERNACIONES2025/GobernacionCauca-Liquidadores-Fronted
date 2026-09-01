import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ParametrosTributariosFacade } from '../../../application/facades/parametros-tributarios.facade';
import { ParametroTributario } from '../../../domain/models/parametro-tributario.model';

@Component({
  selector: 'app-valores-estatales',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './valores-estatales.html',
})
export class ValoresEstatalesPage implements OnInit {
  public facade = inject(ParametrosTributariosFacade);
  private fb = inject(FormBuilder);

  // Formulario Reactivo
  parametroForm!: FormGroup;
  cerrarForm!: FormGroup;

  // Feedback Toast
  readonly toastMessage = signal<{ title: string; desc: string; type: 'success' | 'error' | 'info' } | null>(null);

  ngOnInit(): void {
    this.initForms();
  }

  private initForms(): void {
    const today = new Date().toISOString().split('T')[0];
    const defaultVigenciaId = this.facade.vigenciaActiva()?.id || 1;

    this.parametroForm = this.fb.group({
      id: [0],
      vigenciaFiscalId: [defaultVigenciaId, [Validators.required]],
      normaTributariaId: [null],
      codigo: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9_-]+$/)]],
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      fechaInicioVigencia: [today, [Validators.required]],
      fechaFinVigencia: [''],
      valorDecimal: [null],
      valorTexto: [''],
      activo: [true],
    });

    this.cerrarForm = this.fb.group({
      fechaFinVigencia: [today, [Validators.required]],
      crearNuevoPeriodo: [true],
      nuevaVigenciaFiscalId: [defaultVigenciaId, [Validators.required]],
      nuevoValorDecimal: [null],
      nuevoValorTexto: [''],
      nuevaFechaInicioVigencia: ['2027-01-01', [Validators.required]],
    });
  }

  // Acciones de Modal
  abrirCrearModal(): void {
    const today = new Date().toISOString().split('T')[0];
    const defaultVigenciaId = this.facade.vigenciaActiva()?.id || 1;

    this.parametroForm.reset({
      id: 0,
      vigenciaFiscalId: defaultVigenciaId,
      normaTributariaId: null,
      codigo: '',
      nombre: '',
      fechaInicioVigencia: today,
      fechaFinVigencia: '',
      valorDecimal: null,
      valorTexto: '',
      activo: true,
    });
    this.facade.abrirCrear();
  }

  abrirEditarModal(item: ParametroTributario): void {
    this.parametroForm.patchValue({
      id: item.id,
      vigenciaFiscalId: item.vigenciaFiscalId,
      normaTributariaId: item.normaTributariaId ?? null,
      codigo: item.codigo,
      nombre: item.nombre,
      fechaInicioVigencia: item.fechaInicioVigencia,
      fechaFinVigencia: item.fechaFinVigencia || '',
      valorDecimal: item.valorDecimal,
      valorTexto: item.valorTexto || '',
      activo: item.activo,
    });
    this.facade.abrirEditar(item);
  }

  abrirCerrarModal(item: ParametroTributario): void {
    const today = new Date().toISOString().split('T')[0];
    const anioActual = Number(this.facade.getAnioPorVigenciaId(item.vigenciaFiscalId));
    const siguienteAnio = anioActual + 1;
    const siguienteFechaInicio = `${siguienteAnio}-01-01`;

    this.cerrarForm.patchValue({
      fechaFinVigencia: item.fechaFinVigencia || today,
      crearNuevoPeriodo: true,
      nuevaVigenciaFiscalId: item.vigenciaFiscalId,
      nuevoValorDecimal: item.valorDecimal,
      nuevoValorTexto: item.valorTexto || '',
      nuevaFechaInicioVigencia: siguienteFechaInicio,
    });
    this.facade.abrirCerrar(item);
  }

  abrirAuditoriaModal(item: ParametroTributario): void {
    this.facade.abrirAuditoria(item);
  }

  guardarParametro(): void {
    if (this.parametroForm.invalid) {
      this.parametroForm.markAllAsTouched();
      const camposInvalidos: string[] = [];
      Object.keys(this.parametroForm.controls).forEach((key) => {
        if (this.parametroForm.get(key)?.invalid) {
          camposInvalidos.push(key);
        }
      });
      this.toastMessage.set({
        title: 'Formulario Incompleto',
        desc: `Revise los campos obligatorios (${camposInvalidos.join(', ')}).`,
        type: 'error',
      });
      return;
    }

    const val = { ...this.parametroForm.value };
    if (val.codigo) {
      val.codigo = val.codigo.toUpperCase().trim();
    }
    const isEdit = this.facade.modalMode() === 'EDIT';

    if (isEdit) {
      this.facade.actualizarParametro(val.id, val).subscribe({
        next: () => {
          this.toastMessage.set({
            title: 'Parámetro Actualizado',
            desc: `El parámetro ${val.codigo} ha sido modificado exitosamente.`,
            type: 'success',
          });
        },
      });
    } else {
      this.facade.crearParametro(val).subscribe({
        next: () => {
          this.toastMessage.set({
            title: 'Parámetro Registrado',
            desc: `El parámetro ${val.codigo} ha sido creado exitosamente.`,
            type: 'success',
          });
        },
      });
    }
  }

  confirmarCierreVigencia(): void {
    if (this.cerrarForm.invalid) {
      this.cerrarForm.markAllAsTouched();
      return;
    }

    const item = this.facade.selectedParametro();
    if (!item) return;

    const val = this.cerrarForm.value;

    this.facade
      .cerrarParametroVigencia({
        id: item.id,
        fechaFinVigencia: val.fechaFinVigencia,
        crearNuevoPeriodo: val.crearNuevoPeriodo,
        nuevaVigenciaFiscalId: Number(val.nuevaVigenciaFiscalId),
        nuevoValorDecimal: val.nuevoValorDecimal !== null ? Number(val.nuevoValorDecimal) : null,
        nuevoValorTexto: val.nuevoValorTexto,
        nuevaFechaInicioVigencia: val.nuevaFechaInicioVigencia,
      })
      .subscribe({
        next: () => {
          this.toastMessage.set({
            title: 'Parámetro Cerrado',
            desc: `Se ha establecido la fecha de fin de vigencia (${val.fechaFinVigencia}) para ${item.codigo}.` +
              (val.crearNuevoPeriodo ? ' Se aperturó la nueva vigencia fiscal.' : ''),
            type: 'success',
          });
        },
      });
  }

  toggleEstadoActivo(item: ParametroTributario, event: Event): void {
    event.stopPropagation();
    this.facade.toggleActivo(item);
    this.toastMessage.set({
      title: item.activo ? 'Parámetro Inhabilitado' : 'Parámetro Habilitado',
      desc: `El estado del parámetro ${item.codigo} cambió a ${!item.activo ? 'ACTIVO' : 'INACTIVO'}.`,
      type: 'info',
    });
  }

  cerrarToast(): void {
    this.toastMessage.set(null);
  }

  isVigente(item: ParametroTributario): boolean {
    if (!item.activo) return false;
    const today = new Date().toISOString().split('T')[0];
    if (!item.fechaFinVigencia) return true;
    return item.fechaFinVigencia >= today;
  }
}
