import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  signal,
  Input,
  Output,
  EventEmitter
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { VehiculosFacade } from '../../../application/facades/vehiculos.facade';
import { VehiculoCompletoValidator } from '../../../application/validators/vehiculo-completo.validator';
import { FieldError } from '../../../application/validators/validation-result';
import {
  RegistrarVehiculoDto,
  PropietarioInicialDto,
  VehiculoItem
} from '../../../domain/models/vehiculo.model';

/**
 * @file vehiculo-wizard.ts
 * @description Componente hijo responsable del wizard de registro/edición de vehículos.
 *
 * Extrae toda la lógica del wizard que estaba en vehiculos.ts:
 *   - FormGroup completo con sus 20+ campos
 *   - Cascadas: tipo -> marca -> línea, departamento -> ciudad
 *   - Búsqueda de propietario por documento
 *   - Validación por paso usando VehiculoCompletoValidator
 *   - Construcción del DTO y delegación a la facade
 *
 * La VehiculosFacade sigue siendo la única fuente de verdad para el estado.
 * Este componente SOLO decide cuándo llamar a la facade — nunca la reemplaza.
 *
 * Inputs:
 *   - toastFn: función para mostrar toast (del componente padre Vehiculos)
 *
 * Uso en vehiculos.html:
 *   <app-vehiculo-wizard (toastEmit)="onToast($event)" />
 */
@Component({
  selector: 'app-vehiculo-wizard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './vehiculo-wizard.html'
})
export class VehiculoWizardComponent implements OnInit, OnDestroy {

  // ─── Dependencias ─────────────────────────────────────────────────────────
  readonly facade = inject(VehiculosFacade);
  readonly validator = inject(VehiculoCompletoValidator);
  private fb = inject(FormBuilder);

  // ─── Outputs ──────────────────────────────────────────────────────────────
  /** Emite cuando hay que mostrar un toast al componente padre */
  @Output() toastEmit = new EventEmitter<{
    title: string;
    desc: string;
    type: 'success' | 'error' | 'info';
  }>();

  // ─── Estado local del wizard ──────────────────────────────────────────────
  /** Errores del paso actual para mostrar en el template */
  readonly erroresPaso = signal<FieldError[]>([]);

  /** Indica si se está mostrando un estado de "propietario encontrado en BD" */
  readonly propietarioEncontradoMsg = signal<string | null>(null);

  // ─── Formulario ───────────────────────────────────────────────────────────
  form!: FormGroup;
  private subs: Subscription[] = [];

  // ─── Computed helpers para el template ───────────────────────────────────
  get isNatural(): boolean {
    return this.form?.get('naturalezaJuridicaId')?.value == 1;
  }

  // ─── Ciclo de vida ────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.initForm();
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  // ─── Inicialización del formulario ────────────────────────────────────────

  initForm(): void {
    this.form = this.fb.group({
      // Paso 1: Datos del Vehículo
      tipoVehiculo: [''],
      marca: [{ value: '', disabled: true }],
      linea: [{ value: '', disabled: true }],
      placa: [''],
      estadoMatriculaId: [null],
      modelo: [null],
      cilindraje: [null],
      combustible: [''],
      servicio: [''],
      color: [''],
      pasajeros: [null],
      organismoTransitoId: [null],
      fechaMatricula: [''],

      // Paso 2: Propietario Inicial
      incluirPropietario: [true],
      personaId: [null],
      tipoDocumentoId: [null],
      numeroDocumento: [''],
      digitoVerificacion: [null],
      naturalezaJuridicaId: [null],
      nombreRazonSocial: [''],
      correoElectronico: [''],
      telefono: [''],
      direccion: [''],
      departamentoId: [null],
      ciudadId: [null],
      tipoVinculoPersonaId: [1],
      porcentajePropiedad: [100],
      fechaInicio: [new Date().toISOString().split('T')[0]],
      esResponsablePrincipal: [true],

      // Paso 3: Observaciones
      observaciones: ['']
    });

    this.configurarCascadas();
    this.erroresPaso.set([]);
    this.propietarioEncontradoMsg.set(null);
  }

  // ─── Cascadas de dependencias entre campos ────────────────────────────────

  private configurarCascadas(): void {
    // Cascada 1: Tipo de Vehículo -> habilita Marca y carga marcas disponibles
    const s1 = this.form.get('tipoVehiculo')!.valueChanges.subscribe(tipo => {
      if (tipo) {
        this.facade.cargarMarcasPorTipo(tipo);
        this.form.get('marca')!.enable({ emitEvent: false });
      } else {
        this.form.get('marca')!.setValue('', { emitEvent: false });
        this.form.get('marca')!.disable({ emitEvent: false });
        this.form.get('linea')!.setValue('', { emitEvent: false });
        this.form.get('linea')!.disable({ emitEvent: false });
      }
    });

    // Cascada 2: Marca -> habilita Línea y carga líneas disponibles
    const s2 = this.form.get('marca')!.valueChanges.subscribe(marca => {
      const tipo = this.form.get('tipoVehiculo')?.value;
      if (marca) {
        this.facade.cargarLineasPorMarca(marca, tipo);
        this.form.get('linea')!.enable({ emitEvent: false });
      } else {
        this.form.get('linea')!.setValue('', { emitEvent: false });
        this.form.get('linea')!.disable({ emitEvent: false });
      }
    });

    // Cascada 3: Línea -> auto-completa cilindraje y combustible
    const s3 = this.form.get('linea')!.valueChanges.subscribe(lineaNombre => {
      if (!lineaNombre) return;
      const linea = this.facade.lineasDisponibles().find(
        l => l.nombre.toLowerCase() === lineaNombre.toLowerCase()
      );
      if (linea) {
        this.form.patchValue({
          cilindraje: linea.cilindraje || this.form.get('cilindraje')?.value || null,
          combustible: linea.combustible || this.form.get('combustible')?.value || ''
        }, { emitEvent: false });
      }
    });

    // Cascada 4: Departamento -> carga ciudades
    const s4 = this.form.get('departamentoId')!.valueChanges.subscribe(deptId => {
      if (deptId) {
        this.facade.cargarCiudadesPorDepartamento(Number(deptId));
      } else {
        this.facade.ciudadesDisponibles.set([]);
        this.form.get('ciudadId')!.setValue(null, { emitEvent: false });
      }
    });

    this.subs.push(s1, s2, s3, s4);
  }

  // ─── Pre-poblado para edición ─────────────────────────────────────────────

  poblarParaEdicion(v: VehiculoItem): void {
    const tipoInicial = v.tipoVehiculo || v.clase || 'Automóvil';
    const marcaInicial = v.marca || '';
    const lineaInicial = v.linea || '';

    this.form.get('marca')!.enable({ emitEvent: false });
    this.form.get('linea')!.enable({ emitEvent: false });

    if (tipoInicial) this.facade.cargarMarcasPorTipo(tipoInicial);
    if (marcaInicial) this.facade.cargarLineasPorMarca(marcaInicial, tipoInicial);

    this.form.patchValue({
      placa: v.placa,
      estadoMatriculaId: v.estadoMatriculaId ? String(v.estadoMatriculaId) : '1',
      marca: marcaInicial,
      linea: lineaInicial,
      modelo: v.modelo,
      servicio: v.servicio || 'Particular',
      tipoVehiculo: tipoInicial,
      combustible: v.tipoCombustible || v.combustible || 'Gasolina',
      cilindraje: v.cilindraje,
      pasajeros: v.pasajeros || 5,
      organismoTransitoId: v.organismoTransitoId ? String(v.organismoTransitoId) : '',
      fechaMatricula: v.fechaMatricula || '',
      incluirPropietario: true,
      tipoDocumentoId: 1,
      numeroDocumento: v.propietario?.numeroDocumento || v.propietarioDocumento || '',
      naturalezaJuridicaId: v.propietario?.tipoPersona === 'Jurídica' ? 2 : 1,
      nombreRazonSocial: v.propietario?.nombre || v.propietarioNombre || '',
      tipoVinculoPersonaId: '1',
      porcentajePropiedad: 100,
      esResponsablePrincipal: true
    }, { emitEvent: false });

    this.form.get('placa')!.disable({ emitEvent: false });

    // Carga el expediente completo en background
    if (v.id) {
      this.facade.cargarExpediente(v.id).subscribe(exp => {
        if (!exp) return;
        const veh = exp.vehiculo || exp;
        const prop = exp.propietarios?.length > 0 ? exp.propietarios[0] : null;

        if (veh) {
          const tipoVeh = veh.tipoVehiculo || veh.clase || tipoInicial;
          if (tipoVeh) this.facade.cargarMarcasPorTipo(tipoVeh);
          if (veh.marca) this.facade.cargarLineasPorMarca(veh.marca, tipoVeh);

          this.form.patchValue({
            estadoMatriculaId: veh.estadoMatriculaId ? String(veh.estadoMatriculaId) : '1',
            marca: veh.marca || marcaInicial,
            linea: veh.linea || lineaInicial,
            modelo: veh.modelo || v.modelo,
            servicio: veh.servicio || v.servicio || 'Particular',
            tipoVehiculo: tipoVeh,
            combustible: veh.combustible || v.tipoCombustible || 'Gasolina',
            cilindraje: veh.cilindraje || v.cilindraje,
            pasajeros: veh.pasajeros || v.pasajeros || 5,
            organismoTransitoId: veh.organismoTransitoId ? String(veh.organismoTransitoId) : '',
            fechaMatricula: veh.fechaMatricula || v.fechaMatricula || ''
          }, { emitEvent: false });
        }

        if (prop) {
          const deptId = prop.departamentoId ? Number(prop.departamentoId) : null;
          if (deptId) this.facade.cargarCiudadesPorDepartamento(deptId);

          this.form.patchValue({
            personaId: prop.personaId,
            tipoDocumentoId: prop.tipoDocumentoId ? Number(prop.tipoDocumentoId) : 1,
            numeroDocumento: prop.numeroDocumento || '',
            naturalezaJuridicaId: prop.naturalezaJuridicaId ? Number(prop.naturalezaJuridicaId) : 1,
            nombreRazonSocial: prop.nombrePropietario || '',
            correoElectronico: prop.correoElectronico || '',
            telefono: prop.telefono || '',
            direccion: prop.direccion || '',
            departamentoId: deptId,
            ciudadId: prop.ciudadId ? Number(prop.ciudadId) : null,
            tipoVinculoPersonaId: prop.tipoVinculoId ? String(prop.tipoVinculoId) : '1',
            porcentajePropiedad: prop.porcentajePropiedad || 100,
            fechaInicio: prop.fechaInicio || '',
            esResponsablePrincipal: prop.esResponsablePrincipal ?? true
          }, { emitEvent: false });

          if (prop.personaId || prop.numeroDocumento) {
            this.bloquearCamposPropietario();
          }
        }
      });
    }
  }

  // ─── Control de campos del propietario ────────────────────────────────────

  bloquearCamposPropietario(): void {
    const campos = [
      'tipoDocumentoId', 'numeroDocumento', 'naturalezaJuridicaId',
      'nombreRazonSocial', 'correoElectronico', 'telefono',
      'direccion', 'departamentoId', 'ciudadId'
    ];
    campos.forEach(c => this.form.get(c)?.disable({ emitEvent: false }));
  }

  desbloquearCamposPropietario(): void {
    const campos = [
      'tipoDocumentoId', 'numeroDocumento', 'naturalezaJuridicaId',
      'nombreRazonSocial', 'correoElectronico', 'telefono',
      'direccion', 'departamentoId', 'ciudadId'
    ];
    campos.forEach(c => this.form.get(c)?.enable({ emitEvent: false }));
  }

  // ─── Búsqueda de propietario por documento ────────────────────────────────

  buscarPropietario(): void {
    const numDoc = this.form.get('numeroDocumento')?.value;
    const tipoDocId = this.form.get('tipoDocumentoId')?.value || 1;
    if (!numDoc || !String(numDoc).trim()) return;

    this.facade.buscarPropietario(tipoDocId, String(numDoc).trim()).subscribe(propietario => {
      if (propietario) {
        const nombreCompleto = propietario.nombreCompleto ||
          propietario.razonSocial ||
          [propietario.primerNombre, propietario.segundoNombre,
           propietario.primerApellido, propietario.segundoApellido]
            .filter(Boolean).join(' ');

        const deptId = propietario.departamentoId ? Number(propietario.departamentoId) : null;
        if (deptId) this.facade.cargarCiudadesPorDepartamento(deptId);

        this.form.patchValue({
          personaId: propietario.id || propietario.personaId,
          nombreRazonSocial: nombreCompleto,
          naturalezaJuridicaId: propietario.naturalezaJuridicaId || (propietario.razonSocial ? 2 : 1),
          tipoDocumentoId: propietario.tipoDocumentoId || tipoDocId,
          digitoVerificacion: propietario.digitoVerificacion || null,
          correoElectronico: propietario.correoElectronico || propietario.email || '',
          telefono: propietario.telefono || '',
          direccion: propietario.direccion || propietario.direccionResidencia || '',
          departamentoId: deptId,
          ciudadId: propietario.ciudadId || propietario.municipioId || null
        }, { emitEvent: false });

        this.bloquearCamposPropietario();
        this.propietarioEncontradoMsg.set(`Persona encontrada: ${nombreCompleto}`);
      } else {
        this.form.patchValue({ personaId: null });
        this.desbloquearCamposPropietario();
        this.propietarioEncontradoMsg.set('Documento no registrado. Puede ingresar los datos manualmente.');
      }
    });
  }

  limpiarPropietario(): void {
    this.facade.limpiarBusquedaPropietario();
    this.desbloquearCamposPropietario();
    this.propietarioEncontradoMsg.set(null);
    this.form.patchValue({
      personaId: null,
      numeroDocumento: '',
      nombreRazonSocial: '',
      digitoVerificacion: null,
      correoElectronico: '',
      telefono: '',
      direccion: '',
      departamentoId: null,
      ciudadId: null
    });
  }

  // ─── Helper para mostrar error de campo en el template ───────────────────

  /**
   * Retorna el mensaje de error para un campo dado según los errores del paso actual.
   * Usar en el HTML: getError('placa')
   */
  getError(campo: string): string | null {
    return this.erroresPaso().find(e => e.campo === campo)?.mensaje ?? null;
  }

  /** Indica si un campo tiene error en el paso actual */
  hasError(campo: string): boolean {
    return this.erroresPaso().some(e => e.campo === campo);
  }

  // ─── Navegación del wizard con validación por paso ───────────────────────

  onSiguiente(): void {
    const pasoActual = this.facade.currentStep();
    const totalPasos = this.facade.tabs().length;

    if (pasoActual < totalPasos) {
      // Valida solo el paso actual antes de avanzar
      const result = this.validator.validarPaso(pasoActual, this.form);
      if (!result.isValid) {
        this.erroresPaso.set(result.errors);
        return;
      }
      this.erroresPaso.set([]);
      this.facade.siguientePaso();
    } else {
      // Último paso: finalizar registro
      this.onFinalizarRegistro();
    }
  }

  onAnterior(): void {
    this.erroresPaso.set([]);
    this.facade.anteriorPaso();
  }

  // ─── Submit final ─────────────────────────────────────────────────────────

  onFinalizarRegistro(): void {
    // Validación completa de todos los pasos antes de enviar
    const result = this.validator.validarCompleto(this.form);

    if (!result.isValid) {
      this.erroresPaso.set(result.errors);
      const primerPaso = this.validator.primerPasoConError(result);
      this.facade.setStep(primerPaso);

      const resumen = this.validator.resumenErrores(result);
      this.toastEmit.emit({
        title: 'Campos incompletos o inválidos',
        desc: resumen || 'Por favor revisa los campos marcados en rojo.',
        type: 'info'
      });
      return;
    }

    this.erroresPaso.set([]);
    const payload = this.construirPayload();

    if (!this.facade.isNuevoRegistro()) {
      this.actualizarVehiculo(payload);
    } else {
      this.crearVehiculo(payload);
    }
  }

  // ─── Construcción del DTO ─────────────────────────────────────────────────

  private construirPayload(): RegistrarVehiculoDto {
    const val = this.form.getRawValue();
    let propietarioInicial: PropietarioInicialDto | null = null;

    if (val.incluirPropietario && (val.numeroDocumento || val.personaId)) {
      const nombreCompleto = (val.nombreRazonSocial || '').trim();
      let pNombre: string | null = null;
      let sNombre: string | null = null;
      let pApellido: string | null = null;
      let sApellido: string | null = null;
      let razonSocial: string | null = null;

      if (val.naturalezaJuridicaId == 1) {
        const partes = nombreCompleto.split(/\s+/);
        pNombre = partes[0] || null;
        pApellido = partes[1] || null;
        if (partes.length === 3) {
          sApellido = partes[2];
        } else if (partes.length >= 4) {
          sNombre = partes[1];
          pApellido = partes[2];
          sApellido = partes.slice(3).join(' ');
        }
      } else {
        razonSocial = nombreCompleto;
      }

      propietarioInicial = {
        personaId: val.personaId || null,
        tipoDocumentoId: Number(val.tipoDocumentoId) || 1,
        numeroDocumento: String(val.numeroDocumento).trim(),
        digitoVerificacion: val.digitoVerificacion || null,
        naturalezaJuridicaId: Number(val.naturalezaJuridicaId) || 1,
        primerNombre: pNombre,
        segundoNombre: sNombre,
        primerApellido: pApellido,
        segundoApellido: sApellido,
        razonSocial,
        correoElectronico: val.correoElectronico || null,
        telefono: val.telefono || null,
        direccion: val.direccion || null,
        departamentoId: val.departamentoId ? Number(val.departamentoId) : null,
        ciudadId: val.ciudadId ? Number(val.ciudadId) : null,
        tipoVinculoPersonaId: Number(val.tipoVinculoPersonaId) || 1,
        porcentajePropiedad: Number(val.porcentajePropiedad) || 100,
        fechaInicio: val.fechaInicio || new Date().toISOString().split('T')[0],
        esResponsablePrincipal: Boolean(val.esResponsablePrincipal)
      };
    }

    return {
      placa: String(val.placa).trim().toUpperCase(),
      estadoMatriculaId: Number(val.estadoMatriculaId) || 1,
      marca: String(val.marca).trim(),
      linea: String(val.linea).trim(),
      modelo: Number(val.modelo),
      servicio: val.servicio || 'Particular',
      tipoVehiculo: val.tipoVehiculo || 'Automóvil',
      clase: val.tipoVehiculo || 'Automóvil',
      combustible: val.combustible || 'Gasolina',
      cilindraje: Number(val.cilindraje) || 1000,
      pasajeros: val.pasajeros ? Number(val.pasajeros) : undefined,
      organismoTransitoId: val.organismoTransitoId && Number(val.organismoTransitoId) > 0
        ? Number(val.organismoTransitoId) : undefined,
      fechaMatricula: val.fechaMatricula ? String(val.fechaMatricula).trim() : undefined,
      propietarioInicial
    };
  }

  // ─── Llamadas a la facade ─────────────────────────────────────────────────

  private crearVehiculo(payload: RegistrarVehiculoDto): void {
    this.facade.crearVehiculo(payload).subscribe({
      next: () => {
        this.facade.refrescarDashboard();
        this.facade.cerrarRegistro();
        this.initForm();
        this.toastEmit.emit({
          title: 'Registro Exitoso',
          desc: `El vehículo con placa ${payload.placa} fue enviado a revisión (PENDIENTE DE APROBACIÓN).`,
          type: 'success'
        });
      },
      error: (err: any) => {
        const msg = err.error?.message ||
          (Array.isArray(err.error?.errors) ? err.error.errors.join(', ') : null) ||
          err.message;
        this.toastEmit.emit({
          title: 'Error al Registrar',
          desc: msg || 'No se pudo guardar el vehículo.',
          type: 'error'
        });
      }
    });
  }

  private actualizarVehiculo(payload: RegistrarVehiculoDto): void {
    const vehiculoId = this.facade.selectedVehiculo()?.id;
    if (!vehiculoId) return;

    const updatePayload = {
      marca: payload.marca,
      linea: payload.linea,
      modelo: payload.modelo,
      servicio: payload.servicio,
      tipoVehiculo: payload.tipoVehiculo,
      clase: payload.clase,
      combustible: payload.combustible,
      cilindraje: payload.cilindraje,
      pasajeros: payload.pasajeros,
      estadoMatriculaId: payload.estadoMatriculaId,
      organismoTransitoId: payload.organismoTransitoId,
      fechaMatricula: payload.fechaMatricula
    };

    this.facade.actualizarVehiculo(vehiculoId, updatePayload).subscribe({
      next: () => {
        this.facade.refrescarDashboard();
        this.facade.cerrarRegistro();
        this.toastEmit.emit({
          title: 'Vehículo Actualizado',
          desc: `Los datos de la placa ${payload.placa} se guardaron exitosamente.`,
          type: 'success'
        });
      },
      error: (err: any) => {
        const msg = err.error?.message || err.message;
        this.toastEmit.emit({
          title: 'Error al Actualizar',
          desc: msg || 'No se pudo guardar los cambios.',
          type: 'error'
        });
      }
    });
  }
}
