import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, of, throwError } from 'rxjs';
import { takeUntil, concatMap, catchError } from 'rxjs/operators';
import { LiquidacionWizardService, ActoTemp, IntervinienteTemp } from '../../../services/liquidacion-wizard.service';
import { TiposActoRegistroFacade } from '../../../../../../application/facades/Registro/tipos-acto-registro.facade';
import { ExencionesFacade } from '../../../../../../application/facades/Exenciones/exenciones.facade';
import { RolesIntervinienteFacade } from '../../../../../../application/facades/Intervinientes/roles-interviniente.facade';
import { SolicitudesLiquidacionFacade } from '../../../../../../application/facades/Radicacion/solicitudes-liquidacion.facade';
import { InmueblesFacade } from '../../../../../../application/facades/Inmuebles/inmuebles.facade';
import { ToastService } from '../../../../../../../../core/services/toast.service';
import { ActoRegistradoDto } from '../../../../../../domain/models/Radicacion/solicitud-wizard.model';
import { TipoActoRegistro } from '../../../../../../domain/models/Registro/tipo-acto-registro.model';
import { Inmueble } from '../../../../../../domain/models/Inmuebles/inmueble.model';

@Component({
  selector: 'app-step-actos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './step-actos.html'
})
export class StepActosComponent implements OnInit, OnDestroy {
  wizardService = inject(LiquidacionWizardService);
  tiposActoFacade = inject(TiposActoRegistroFacade);
  exencionesFacade = inject(ExencionesFacade);
  rolesIntervinienteFacade = inject(RolesIntervinienteFacade);
  solicitudesFacade = inject(SolicitudesLiquidacionFacade);
  inmueblesFacade = inject(InmueblesFacade);
  toastService = inject(ToastService);

  private destroy$ = new Subject<void>();

  get selectedTipoActoDetalle(): TipoActoRegistro | null {
    const id = this.wizardService.actoForm.get('tipoActoRegistroId')?.value;
    if (!id) return null;
    return (this.tiposActoFacade.tiposActoRegistro() as TipoActoRegistro[]).find(t => t.id === Number(id)) || null;
  }

  get esSinCuantia(): boolean {
    const nat = this.selectedTipoActoDetalle?.naturalezaActo;
    if (!nat) return false;
    const cod = (nat.codigo || '').trim().toUpperCase();
    const nom = (nat.nombre || '').trim().toUpperCase();
    return cod === 'SC' || cod === 'SIN_CUANTIA' || cod === 'SINCUANTIA' || nom.includes('SIN CUANTIA') || nom.includes('SIN CUANTÍA');
  }

  get requiereInmueble(): boolean {
    const cat = this.selectedTipoActoDetalle?.categoriaActo;
    if (!cat) return false;
    const cod = (cat.codigo || '').trim().toUpperCase();
    const nom = (cat.nombre || '').trim().toUpperCase();
    return cod === 'INM' || cod === 'INMOBILIARIO' || cod === 'ORIP' || nom.includes('INMOBILIAR') || nom.includes('PREDIAL') || nom.includes('INSTRUMENTOS PUBLICOS') || nom.includes('INSTRUMENTOS PÚBLICOS');
  }

  get pisoMinimoLegal(): number {
    if (this.esSinCuantia) return 0;
    const val = Number(this.wizardService.actoForm.get('valorActo')?.value) || 0;
    const ava = Number(this.wizardService.actoForm.get('avaluoCatastral')?.value) || 0;
    return this.requiereInmueble ? Math.max(val, ava) : val;
  }

  ngOnInit(): void {
    this.cargarCatalogoActosSegunEntidad();
    this.inmueblesFacade.cargarInmuebles({ pageSize: 100 });
    this.configurarSuscripcionesReactividad();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private cargarCatalogoActosSegunEntidad(): void {
    const entidadId = this.wizardService.paso2Form.get('entidadRegistroId')?.value;
    if (entidadId) {
      this.tiposActoFacade.cargarTiposActoPorEntidad(Number(entidadId));
    } else {
      this.tiposActoFacade.cargarTiposActoRegistro(1, 100);
    }
  }

  private configurarSuscripcionesReactividad(): void {
    // 1. Reaccionar al cambio de Tipo de Acto
    this.wizardService.actoForm.get('tipoActoRegistroId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.aplicarReglasSegunTipoActo();
      });

    // 2. Reaccionar al cambio de Valor del Acto
    this.wizardService.actoForm.get('valorActo')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => {
        if (!this.esSinCuantia) {
          this.actualizarBaseDeclaradaSugerida();
        }
      });

    // 3. Reaccionar al cambio de Avalúo Catastral
    this.wizardService.actoForm.get('avaluoCatastral')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => {
        if (this.requiereInmueble && !this.esSinCuantia) {
          this.actualizarBaseDeclaradaSugerida();
        }
      });
  }

  private aplicarReglasSegunTipoActo(): void {
    const form = this.wizardService.actoForm;

    if (this.esSinCuantia) {
      // Actos sin cuantía: forzar valores en 0
      form.patchValue({
        valorActo: 0,
        avaluoCatastral: 0,
        baseDeclarada: 0,
        matriculaInmobiliaria: ''
      }, { emitEvent: false });

      form.get('valorActo')?.clearValidators();
      form.get('avaluoCatastral')?.clearValidators();
      form.get('baseDeclarada')?.clearValidators();
      form.get('matriculaInmobiliaria')?.clearValidators();
    } else if (this.requiereInmueble) {
      // Actos inmobiliarios con cuantía
      form.get('valorActo')?.setValidators([Validators.required, Validators.min(0)]);
      form.get('avaluoCatastral')?.setValidators([Validators.min(0)]);
      form.get('matriculaInmobiliaria')?.setValidators([Validators.required]);
      
      const piso = this.pisoMinimoLegal;
      form.get('baseDeclarada')?.setValidators([Validators.required, Validators.min(piso)]);
      form.patchValue({ baseDeclarada: piso }, { emitEvent: false });
    } else {
      // Actos comerciales/mercantiles/muebles con cuantía
      form.patchValue({
        avaluoCatastral: 0,
        matriculaInmobiliaria: ''
      }, { emitEvent: false });

      form.get('valorActo')?.setValidators([Validators.required, Validators.min(0)]);
      form.get('avaluoCatastral')?.clearValidators();
      form.get('matriculaInmobiliaria')?.clearValidators();

      const valor = Number(form.get('valorActo')?.value) || 0;
      form.get('baseDeclarada')?.setValidators([Validators.required, Validators.min(valor)]);
      form.patchValue({ baseDeclarada: valor }, { emitEvent: false });
    }

    form.get('valorActo')?.updateValueAndValidity({ emitEvent: false });
    form.get('avaluoCatastral')?.updateValueAndValidity({ emitEvent: false });
    form.get('baseDeclarada')?.updateValueAndValidity({ emitEvent: false });
    form.get('matriculaInmobiliaria')?.updateValueAndValidity({ emitEvent: false });
  }

  private actualizarBaseDeclaradaSugerida(): void {
    const form = this.wizardService.actoForm;
    const piso = this.pisoMinimoLegal;
    const baseActual = Number(form.get('baseDeclarada')?.value) || 0;

    // Si la base actual es menor que el nuevo piso mínimo o estaba igual al piso anterior, actualizarla
    if (baseActual < piso || baseActual === 0) {
      form.patchValue({ baseDeclarada: piso }, { emitEvent: false });
    }

    form.get('baseDeclarada')?.setValidators([Validators.required, Validators.min(piso)]);
    form.get('baseDeclarada')?.updateValueAndValidity({ emitEvent: false });
  }

  seleccionarInmuebleExistente(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const inmuebleId = Number(select.value);
    if (!inmuebleId) return;

    const inmueble = (this.inmueblesFacade.inmuebles() as Inmueble[]).find(i => i.id === inmuebleId);
    if (inmueble) {
      const vigenciaActual = this.wizardService.paso1Form.get('vigenciaFiscal')?.value;
      const avaluoObj = inmueble.avaluos?.find(a => a.vigenciaId === vigenciaActual) 
                     || inmueble.avaluos?.[0];
      const valorAvaluo = avaluoObj ? avaluoObj.valor : 0;

      this.wizardService.actoForm.patchValue({
        matriculaInmobiliaria: inmueble.matriculaInmobiliaria,
        avaluoCatastral: valorAvaluo
      });
    }
  }

  guardarActoAlExpediente(): void {
    const form = this.wizardService.actoForm;
    
    if (form.valid) {
      const val = form.value;
      const tipoActo = this.selectedTipoActoDetalle;
      const exencion = (this.exencionesFacade.exenciones() as any[]).find((e: any) => e.id === Number(val.exencionId));

      const valorActoNum = this.esSinCuantia ? 0 : Number(val.valorActo);
      const avaluoNum = (this.requiereInmueble && !this.esSinCuantia) ? Number(val.avaluoCatastral) : 0;
      const baseDeclaradaNum = this.esSinCuantia ? 0 : Number(val.baseDeclarada);

      // Verificación de piso mínimo legal
      const pisoMinimo = this.requiereInmueble ? Math.max(valorActoNum, avaluoNum) : valorActoNum;
      if (!this.esSinCuantia && baseDeclaradaNum < pisoMinimo) {
        this.toastService.error(`La base declarada no puede ser inferior al mínimo legal ($${pisoMinimo.toLocaleString('es-CO')}).`);
        return;
      }

      const nuevoActo: ActoTemp = {
        idTemp: Math.random().toString(),
        tipoActoId: Number(val.tipoActoRegistroId),
        tipoActoCodigo: tipoActo?.codigo || '',
        tipoActoNombre: tipoActo?.nombre || '',
        categoriaNombre: tipoActo?.categoriaActo?.nombre || '',
        naturalezaNombre: tipoActo?.naturalezaActo?.nombre || '',
        tarifaInfo: '',
        valorActo: valorActoNum,
        baseDeclarada: baseDeclaradaNum,
        matriculaInmobiliaria: this.requiereInmueble ? val.matriculaInmobiliaria : '',
        avaluoCatastral: avaluoNum,
        exencionId: val.exencionId ? Number(val.exencionId) : null,
        exencionNombre: exencion ? exencion.nombre : null,
        intervinientes: []
      };

      this.wizardService.actosExpediente.update(list => [...list, nuevoActo]);
      this.wizardService.isAddingActo.set(false);
      this.wizardService.actoForm.reset({
        tipoActoRegistroId: null,
        valorActo: 0,
        baseDeclarada: 0,
        matriculaInmobiliaria: '',
        avaluoCatastral: 0,
        exencionId: null
      });
      this.wizardService.intervinientesActoActual.set([]);
      this.toastService.success('Acto añadido al expediente.');
    } else {
      this.wizardService.actoForm.markAllAsTouched();
      this.toastService.warning('Por favor complete los campos requeridos con valores válidos.');
    }
  }

  eliminarActoDelExpediente(idTemp: string): void {
    this.wizardService.actosExpediente.update(list => list.filter(a => a.idTemp !== idTemp));
    if (this.wizardService.actosExpediente().length === 0) {
      this.abrirFormularioNuevoActo();
    }
  }

  abrirFormularioNuevoActo(): void {
    this.wizardService.isAddingActo.set(true);
  }

  continuar(): void {
    if (this.wizardService.actosExpediente().length === 0) {
      this.toastService.warning('Debe registrar al menos un acto.');
      return;
    }

    const solicitudId = this.wizardService.solicitudId();
    if (!solicitudId) {
      this.toastService.error('No se encontró el ID de la solicitud. Regrese al primer paso.');
      return;
    }

    const actosPayload: ActoRegistradoDto[] = this.wizardService.actosExpediente().map(a => ({
      tipoActoRegistroId: a.tipoActoId,
      inmuebleId: null,
      valorActo: a.valorActo,
      baseDeclarada: a.baseDeclarada,
      observacion: null,
      exencionesIds: a.exencionId ? [a.exencionId] : []
    }));

    this.solicitudesFacade.registrarActos(solicitudId, { actos: actosPayload }).pipe(
      concatMap(res => {
        if (res.success) {
          return this.solicitudesFacade.obtenerSolicitudPorId(solicitudId);
        }
        return throwError(() => new Error('Error al registrar actos'));
      }),
      catchError(err => {
        const errorMsg = err?.error?.message || err?.error?.detail || 'Error al guardar actos. Verifique las bases declaradas.';
        this.toastService.error(errorMsg);
        return throwError(() => err);
      })
    ).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.wizardService.cargarDatosDesdeSolicitud(res.data);
          this.wizardService.currentStep.set(4);
          this.wizardService.etapaGuardada.set(3);
          this.toastService.success('Actos guardados exitosamente. Ahora añada los intervinientes.');
        }
      }
    });
  }

  retroceder(): void {
    this.wizardService.currentStep.set(2);
  }
}

