import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, Validators, FormBuilder, FormsModule } from '@angular/forms';
import { Subject, throwError, of } from 'rxjs';
import { takeUntil, concatMap, catchError, finalize } from 'rxjs/operators';
import { LiquidacionWizardService, ActoTemp } from '../../../services/liquidacion-wizard.service';
import { TiposActoRegistroFacade } from '../../../../../../application/facades/Registro/tipos-acto-registro.facade';
import { ExencionesFacade } from '../../../../../../application/facades/Exenciones/exenciones.facade';
import { RolesIntervinienteFacade } from '../../../../../../application/facades/Intervinientes/roles-interviniente.facade';
import { SolicitudesLiquidacionFacade } from '../../../../../../application/facades/Radicacion/solicitudes-liquidacion.facade';
import { InmueblesFacade } from '../../../../../../application/facades/Inmuebles/inmuebles.facade';
import { MunicipiosFacade } from '../../../../../../application/facades/Territorios/municipios.facade';
import { InmueblesApiService } from '../../../../../../infrastructure/api/Inmuebles/inmuebles-api.service';
import { ToastService } from '../../../../../../../../core/services/toast.service';
import { ActoRegistradoDto } from '../../../../../../domain/models/Radicacion/solicitud-wizard.model';
import { TipoActoRegistro } from '../../../../../../domain/models/Registro/tipo-acto-registro.model';
import { Inmueble, CrearInmuebleRequest, ActualizarInmuebleRequest } from '../../../../../../domain/models/Inmuebles/inmueble.model';

@Component({
  selector: 'app-step-actos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './step-actos.html'
})
export class StepActosComponent implements OnInit, OnDestroy {
  wizardService = inject(LiquidacionWizardService);
  tiposActoFacade = inject(TiposActoRegistroFacade);
  exencionesFacade = inject(ExencionesFacade);
  rolesIntervinienteFacade = inject(RolesIntervinienteFacade);
  solicitudesFacade = inject(SolicitudesLiquidacionFacade);
  inmueblesFacade = inject(InmueblesFacade);
  municipiosFacade = inject(MunicipiosFacade);
  inmueblesApi = inject(InmueblesApiService);
  toastService = inject(ToastService);
  fb = inject(FormBuilder);

  private destroy$ = new Subject<void>();

  // Estado para la búsqueda/creación de Inmuebles
  matriculaBuscada = signal<string>('');
  buscandoInmueble = signal<boolean>(false);
  inmuebleEncontrado = signal<Inmueble | null>(null);
  mostrarFormNuevoInmueble = signal<boolean>(false);
  guardandoNuevoInmueble = signal<boolean>(false);
  actoEditandoId = signal<string | null>(null);
  editandoInmuebleId = signal<number | null>(null);

  nuevoInmuebleForm = this.fb.nonNullable.group({
    municipioId: [0, [Validators.required, Validators.min(1)]],
    direccion: [''],
    avaluoCatastral: [0, [Validators.required, Validators.min(0)]]
  });

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
    this.municipiosFacade.cargarMunicipios(1, 100);
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
        inmuebleId: null,
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
        inmuebleId: null,
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

  buscarPorMatricula(): void {
    const matricula = this.matriculaBuscada().trim();
    if (!matricula) {
      this.toastService.warning('Por favor, ingrese una matrícula inmobiliaria.');
      return;
    }

    this.buscandoInmueble.set(true);
    this.inmuebleEncontrado.set(null);
    this.mostrarFormNuevoInmueble.set(false);

    this.inmueblesApi.obtenerTodos({ matriculaInmobiliaria: matricula, pageSize: 1 }).pipe(
      finalize(() => this.buscandoInmueble.set(false))
    ).subscribe({
      next: (res: any) => {
        const raw = res?.data;
        const items: any[] = Array.isArray(raw) ? raw : (raw?.items || []);
        const cleanMat = matricula.trim().toLowerCase();
        const inmueble = items.find((i: any) => 
          String(i.matriculaInmobiliaria || '').trim().toLowerCase() === cleanMat
        );

        if (inmueble) {
          this.inmuebleEncontrado.set(inmueble);
          
          const vigenciaActual = this.wizardService.paso1Form.get('vigenciaFiscal')?.value;
          const avaluoObj = inmueble.avaluos?.find((a: any) => a.vigenciaId === vigenciaActual) || inmueble.avaluos?.[0];
          const valorAvaluo = avaluoObj ? avaluoObj.valor : 0;

          this.wizardService.actoForm.patchValue({
            inmuebleId: inmueble.id,
            matriculaInmobiliaria: inmueble.matriculaInmobiliaria,
            avaluoCatastral: valorAvaluo
          });
          this.actualizarBaseDeclaradaSugerida();
          this.toastService.success('Inmueble encontrado y asignado.');
        } else {
          this.mostrarFormNuevoInmueble.set(true);
          this.toastService.warning('Inmueble no encontrado. Por favor, registre los datos para crearlo.');
        }
      },
      error: () => {
        this.toastService.error('Error al buscar el inmueble.');
      }
    });
  }

  abrirEdicionInmueble(): void {
    const inm = this.inmuebleEncontrado();
    if (!inm) return;

    this.editandoInmuebleId.set(inm.id);
    this.mostrarFormNuevoInmueble.set(true);

    const vigenciaActual = this.wizardService.paso1Form.get('vigenciaFiscal')?.value;
    const avaluoObj = inm.avaluos?.find((a: any) => a.vigenciaId === vigenciaActual) || inm.avaluos?.[0];
    const valorAvaluo = avaluoObj ? avaluoObj.valor : (this.wizardService.actoForm.get('avaluoCatastral')?.value || 0);

    this.nuevoInmuebleForm.patchValue({
      municipioId: inm.municipioId,
      direccion: inm.direccion || '',
      avaluoCatastral: valorAvaluo
    });
  }

  cancelarEdicionInmueble(): void {
    this.mostrarFormNuevoInmueble.set(false);
    this.editandoInmuebleId.set(null);
    this.nuevoInmuebleForm.reset({
      municipioId: 0,
      direccion: '',
      avaluoCatastral: 0
    });
  }

  guardarInmueble(): void {
    if (this.nuevoInmuebleForm.invalid) {
      this.nuevoInmuebleForm.markAllAsTouched();
      this.toastService.warning('Complete los campos obligatorios del inmueble.');
      return;
    }

    const formValues = this.nuevoInmuebleForm.getRawValue();
    const vigenciaActual = this.wizardService.paso1Form.get('vigenciaFiscal')?.value;

    if (!vigenciaActual) {
      this.toastService.error('Vigencia fiscal no definida en el Paso 1.');
      return;
    }

    const munObj = (this.municipiosFacade.municipios() as any[]).find((m: any) => m.id === Number(formValues.municipioId));
    const munNombre = munObj?.nombre || 'Municipio Seleccionado';

    const editId = this.editandoInmuebleId();

    if (editId) {
      // ACTUALIZAR INMUEBLE EXISTENTE
      const updatePayload: ActualizarInmuebleRequest = {
        id: editId,
        matriculaInmobiliaria: this.matriculaBuscada().trim(),
        municipioId: formValues.municipioId,
        direccion: formValues.direccion,
        avaluos: [
          {
            vigenciaId: vigenciaActual,
            valor: formValues.avaluoCatastral,
            fuente: 'Actualizado desde Wizard de Liquidación'
          }
        ]
      };

      this.guardandoNuevoInmueble.set(true);
      this.inmueblesApi.actualizar(editId, updatePayload).pipe(
        finalize(() => this.guardandoNuevoInmueble.set(false))
      ).subscribe({
        next: () => {
          this.toastService.success('Datos del inmueble actualizados.');
          this.wizardService.actoForm.patchValue({
            avaluoCatastral: formValues.avaluoCatastral
          });
          this.inmuebleEncontrado.update(inm => {
            if (!inm) return null;
            return {
              ...inm,
              municipioId: formValues.municipioId,
              municipioNombre: munNombre,
              direccion: formValues.direccion,
              avaluos: updatePayload.avaluos as any
            };
          });
          this.actualizarBaseDeclaradaSugerida();
          this.cancelarEdicionInmueble();
        },
        error: () => {
          this.toastService.error('Error al actualizar el inmueble.');
        }
      });
    } else {
      // CREAR NUEVO INMUEBLE
      const createPayload: CrearInmuebleRequest = {
        matriculaInmobiliaria: this.matriculaBuscada().trim(),
        municipioId: formValues.municipioId,
        direccion: formValues.direccion,
        avaluos: [
          {
            vigenciaId: vigenciaActual,
            valor: formValues.avaluoCatastral,
            fuente: 'Creado desde Wizard de Liquidación'
          }
        ]
      };

      this.guardandoNuevoInmueble.set(true);
      this.inmueblesApi.crear(createPayload).pipe(
        finalize(() => this.guardandoNuevoInmueble.set(false))
      ).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.toastService.success('Inmueble creado exitosamente.');
            this.wizardService.actoForm.patchValue({
              inmuebleId: res.data,
              matriculaInmobiliaria: createPayload.matriculaInmobiliaria,
              avaluoCatastral: formValues.avaluoCatastral
            });
            this.inmuebleEncontrado.set({
              id: res.data,
              matriculaInmobiliaria: createPayload.matriculaInmobiliaria,
              municipioId: createPayload.municipioId,
              municipioNombre: munNombre,
              direccion: formValues.direccion,
              createdAt: new Date().toISOString(),
              avaluos: createPayload.avaluos as any
            });
            this.actualizarBaseDeclaradaSugerida();
            this.cancelarEdicionInmueble();
          } else {
            this.toastService.error(res.message || 'Error al crear el inmueble.');
          }
        },
        error: () => {
          this.toastService.error('Error al crear el inmueble.');
        }
      });
    }
  }

  guardarActoAlExpediente(): void {
    const form = this.wizardService.actoForm;
    
    if (form.valid) {
      const val = form.value;
      const tipoActo = this.selectedTipoActoDetalle;
      const exencion = (this.exencionesFacade.exenciones() as any[]).find((e: any) => e.id === Number(val.exencionId));

      const valorActoNum = this.esSinCuantia ? 0 : Number(val.valorActo || 0);
      const avaluoNum = (this.requiereInmueble && !this.esSinCuantia) ? Number(val.avaluoCatastral || 0) : 0;
      const baseDeclaradaNum = this.esSinCuantia ? 0 : Number(val.baseDeclarada || 0);

      // Verificación de piso mínimo legal
      const pisoMinimo = this.requiereInmueble ? Math.max(valorActoNum, avaluoNum) : valorActoNum;
      if (!this.esSinCuantia && baseDeclaradaNum < pisoMinimo) {
        this.toastService.error(`La base declarada no puede ser inferior al mínimo legal ($${pisoMinimo.toLocaleString('es-CO')}).`);
        return;
      }

      const inmuebleIdFinal = this.requiereInmueble ? (val.inmuebleId || this.inmuebleEncontrado()?.id || null) : null;
      if (this.requiereInmueble && (!inmuebleIdFinal || inmuebleIdFinal <= 0)) {
        this.toastService.error('Para actos inmobiliarios, es obligatorio buscar y seleccionar un inmueble existente o registrar uno nuevo.');
        return;
      }

      const matriculaFinal = this.requiereInmueble ? (val.matriculaInmobiliaria || this.inmuebleEncontrado()?.matriculaInmobiliaria || '') : '';

      const editandoId = this.actoEditandoId();
      if (editandoId) {
        this.wizardService.actosExpediente.update(list => list.map(a => {
          if (String(a.idTemp) === String(editandoId)) {
            return {
              ...a,
              tipoActoId: Number(val.tipoActoRegistroId),
              tipoActoCodigo: tipoActo?.codigo || a.tipoActoCodigo,
              tipoActoNombre: tipoActo?.nombre || a.tipoActoNombre,
              categoriaNombre: tipoActo?.categoriaActo?.nombre || a.categoriaNombre,
              naturalezaNombre: tipoActo?.naturalezaActo?.nombre || a.naturalezaNombre,
              valorActo: valorActoNum,
              baseDeclarada: baseDeclaradaNum,
              inmuebleId: inmuebleIdFinal,
              matriculaInmobiliaria: matriculaFinal,
              avaluoCatastral: avaluoNum,
              exencionId: val.exencionId ? Number(val.exencionId) : null,
              exencionNombre: exencion ? exencion.nombre : null
            };
          }
          return a;
        }));
        this.toastService.success('Acto modificado exitosamente con los nuevos valores.');
      } else {
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
          inmuebleId: inmuebleIdFinal,
          matriculaInmobiliaria: matriculaFinal,
          avaluoCatastral: avaluoNum,
          exencionId: val.exencionId ? Number(val.exencionId) : null,
          exencionNombre: exencion ? exencion.nombre : null,
          intervinientes: []
        };
        this.wizardService.actosExpediente.update(list => [...list, nuevoActo]);
        this.toastService.success('Acto añadido al expediente.');
      }

      this.wizardService.isAddingActo.set(false);
      this.actoEditandoId.set(null);
      this.wizardService.actoForm.reset({
        tipoActoRegistroId: null,
        inmuebleId: null,
        valorActo: 0,
        baseDeclarada: 0,
        matriculaInmobiliaria: '',
        avaluoCatastral: 0,
        exencionId: null
      });
      this.inmuebleEncontrado.set(null);
      this.matriculaBuscada.set('');
      this.mostrarFormNuevoInmueble.set(false);
      this.wizardService.intervinientesActoActual.set([]);
    } else {
      this.wizardService.actoForm.markAllAsTouched();
      this.toastService.warning('Por favor complete los campos requeridos con valores válidos.');
    }
  }

  editarActo(acto: ActoTemp): void {
    if (this.wizardService.esSoloLectura()) return;
    this.actoEditandoId.set(acto.idTemp);
    this.wizardService.isAddingActo.set(true);
    this.matriculaBuscada.set(acto.matriculaInmobiliaria || '');
    this.mostrarFormNuevoInmueble.set(false);

    this.wizardService.actoForm.patchValue({
      tipoActoRegistroId: acto.tipoActoId,
      inmuebleId: acto.inmuebleId || null,
      valorActo: acto.valorActo,
      baseDeclarada: acto.baseDeclarada,
      matriculaInmobiliaria: acto.matriculaInmobiliaria || '',
      avaluoCatastral: acto.avaluoCatastral || 0,
      exencionId: acto.exencionId || null
    });

    this.aplicarReglasSegunTipoActo();
    this.wizardService.actoForm.patchValue({
      baseDeclarada: acto.baseDeclarada,
      valorActo: acto.valorActo,
      avaluoCatastral: acto.avaluoCatastral || 0
    }, { emitEvent: false });

    // Si tiene inmueble asociado, recuperar información completa del inmueble por API
    if (acto.inmuebleId) {
      this.buscandoInmueble.set(true);
      this.inmueblesApi.obtenerPorId(acto.inmuebleId).pipe(
        finalize(() => this.buscandoInmueble.set(false))
      ).subscribe({
        next: (res: any) => {
          if (res && res.success && res.data) {
            const inm: Inmueble = res.data;
            this.inmuebleEncontrado.set(inm);
            this.matriculaBuscada.set(inm.matriculaInmobiliaria);
            
            const vigenciaActual = this.wizardService.paso1Form.get('vigenciaFiscal')?.value;
            const avaluoObj = inm.avaluos?.find((a: any) => a.vigenciaId === vigenciaActual) || inm.avaluos?.[0];
            const valorAvaluo = acto.avaluoCatastral || avaluoObj?.valor || 0;

            this.wizardService.actoForm.patchValue({
              inmuebleId: inm.id,
              matriculaInmobiliaria: inm.matriculaInmobiliaria,
              avaluoCatastral: valorAvaluo
            });
            this.actualizarBaseDeclaradaSugerida();
          }
        },
        error: () => {
          if (acto.matriculaInmobiliaria) {
            this.inmuebleEncontrado.set({
              id: acto.inmuebleId || 0,
              matriculaInmobiliaria: acto.matriculaInmobiliaria,
              municipioId: 0,
              municipioNombre: 'Predio Asociado',
              direccion: '',
              createdAt: '',
              avaluos: [{ id: 0, vigenciaId: 0, valor: acto.avaluoCatastral || 0, fuente: '' }]
            });
          }
        }
      });
    } else if (acto.matriculaInmobiliaria) {
      this.matriculaBuscada.set(acto.matriculaInmobiliaria);
      this.buscarPorMatricula();
    } else {
      this.inmuebleEncontrado.set(null);
    }
  }

  desvincularInmueble(): void {
    this.inmuebleEncontrado.set(null);
    this.matriculaBuscada.set('');
    this.mostrarFormNuevoInmueble.set(false);
    this.wizardService.actoForm.patchValue({
      inmuebleId: null,
      matriculaInmobiliaria: '',
      avaluoCatastral: 0
    });
    this.aplicarReglasSegunTipoActo();
  }

  eliminarActoDelExpediente(idTemp: string): void {
    this.wizardService.actosExpediente.update(list => list.filter(a => a.idTemp !== idTemp));
    if (this.wizardService.actosExpediente().length === 0) {
      this.abrirFormularioNuevoActo();
    }
  }

  abrirFormularioNuevoActo(): void {
    if (this.wizardService.esSoloLectura()) return;
    this.actoEditandoId.set(null);
    this.wizardService.isAddingActo.set(true);
    this.matriculaBuscada.set('');
    this.inmuebleEncontrado.set(null);
    this.mostrarFormNuevoInmueble.set(false);
    this.wizardService.actoForm.reset({
      tipoActoRegistroId: null,
      inmuebleId: null,
      valorActo: 0,
      baseDeclarada: 0,
      matriculaInmobiliaria: '',
      avaluoCatastral: 0,
      exencionId: null
    });
  }

  continuar(): void {
    if (this.wizardService.esSoloLectura()) {
      this.wizardService.currentStep.set(4);
      return;
    }

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
      inmuebleId: a.inmuebleId || null,
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

