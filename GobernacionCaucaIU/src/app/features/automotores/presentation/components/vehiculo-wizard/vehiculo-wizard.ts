import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  signal,
  Output,
  EventEmitter,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { VehiculosFacade } from '../../../application/facades/vehiculos.facade';
import { VehiculoCompletoValidator } from '../../../application/validators/vehiculos/vehiculo-completo.validator';
import { FieldError } from '../../../application/validators/validation-result';
import {
  RegistrarVehiculoDto,
  PropietarioInicialDto,
  VehiculoItem
} from '../../../domain/models/vehiculo.model';

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
  @Output() toastEmit = new EventEmitter<{
    title: string;
    desc: string;
    type: 'success' | 'error' | 'info';
  }>();

  // ─── Estado local del wizard ──────────────────────────────────────────────
  readonly erroresPaso = signal<FieldError[]>([]);
  readonly propietarioEncontradoMsg = signal<string | null>(null);

  // ─── Formulario ───────────────────────────────────────────────────────────
  form!: FormGroup;
  private subs: Subscription[] = [];

  // ─── Constructor Reactivo (Sincroniza apertura del drawer nuevo vs edición)
  constructor() {
    effect(() => {
      const isOpen = this.facade.isDrawerOpen();
      const isNuevo = this.facade.isNuevoRegistro();
      const sel = this.facade.selectedVehiculo();

      if (isOpen) {
        if (isNuevo) {
          this.initForm();
        } else if (sel) {
          this.initForm();
          this.poblarParaEdicion(sel);
        }
      }
    });

    // Sincroniza selects reactivamente cuando los catálogos se actualicen
    effect(() => {
      const servs = this.facade.serviciosVehiculo();
      if (servs.length > 0 && this.form) {
        const currentServ = this.form.get('servicio')?.value;
        const normalized = this.normalizarServicio(currentServ);
        if (normalized && normalized !== currentServ) {
          this.form.get('servicio')?.setValue(normalized, { emitEvent: false });
        }
      }
    });

    effect(() => {
      const combs = this.facade.combustibles();
      if (combs.length > 0 && this.form) {
        const currentComb = this.form.get('combustible')?.value;
        const normalized = this.normalizarCombustible(currentComb);
        if (normalized && normalized !== currentComb) {
          this.form.get('combustible')?.setValue(normalized, { emitEvent: false });
        }
      }
    });
  }

  // ─── Computed helpers para el template ───────────────────────────────────
  get isNatural(): boolean {
    return this.form?.get('naturalezaJuridicaId')?.value == 1;
  }

  getPlaceholderDocumento(): string {
    const tipo = Number(this.form?.get('tipoDocumentoId')?.value);
    switch (tipo) {
      case 1: return 'Ej: 1035421980 (Solo números)';
      case 2: return 'Ej: 900123456 (NIT sin dígito)';
      case 3: return 'Ej: 123456789 (Cédula de Extranjería)';
      case 4: return 'Ej: 1023456789 (Tarjeta de Identidad)';
      case 5: return 'Ej: AB123456 (Pasaporte)';
      case 6: return 'Ej: 1023456789 (Registro Civil)';
      default: return 'Número de documento...';
    }
  }

  onDocumentoInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const tipo = Number(this.form.get('tipoDocumentoId')?.value);
    // Tipos numéricos: 1 (CC), 2 (NIT), 4 (TI), 6 (RC)
    if ([1, 2, 4, 6].includes(tipo)) {
      const soloDigitos = input.value.replace(/\D/g, '');
      if (input.value !== soloDigitos) {
        input.value = soloDigitos;
        this.form.get('numeroDocumento')?.setValue(soloDigitos, { emitEvent: false });
      }
    }
  }

  // ─── Normalizadores para selects ─────────────────────────────────────────
  private normalizarCombustible(comb?: string | number | null): string {
    const raw = comb !== null && comb !== undefined ? String(comb).trim() : '';
    const catalogo = this.facade.combustibles();

    const cleanStr = (str: string) =>
      str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

    if (!raw) {
      const matchGas = catalogo.find(c => cleanStr(c.nombre).includes('gasol'));
      return matchGas ? matchGas.nombre : 'Gasolina';
    }

    const exact = catalogo.find(c => c.nombre === raw);
    if (exact) return exact.nombre;

    if (!isNaN(Number(raw))) {
      const byId = catalogo.find(c => Number(c.id) === Number(raw));
      if (byId) return byId.nombre;
    }
    const byCodigo = catalogo.find(c => c.codigo && cleanStr(c.codigo) === cleanStr(raw));
    if (byCodigo) return byCodigo.nombre;

    const rawClean = cleanStr(raw);
    const matchClean = catalogo.find(c => cleanStr(c.nombre) === rawClean);
    if (matchClean) return matchClean.nombre;

    if (rawClean.includes('gasol')) {
      const match = catalogo.find(c => cleanStr(c.nombre).includes('gasol'));
      return match ? match.nombre : 'Gasolina';
    }
    if (rawClean.includes('dies')) {
      const match = catalogo.find(c => cleanStr(c.nombre).includes('dies'));
      return match ? match.nombre : 'Diésel';
    }
    if (rawClean.includes('elec')) {
      const match = catalogo.find(c => cleanStr(c.nombre).includes('elec'));
      return match ? match.nombre : 'Eléctrico';
    }
    if (rawClean.includes('hib')) {
      const match = catalogo.find(c => cleanStr(c.nombre).includes('hib'));
      return match ? match.nombre : 'Híbrido';
    }
    if (rawClean.includes('gas')) {
      const match = catalogo.find(c => cleanStr(c.nombre).includes('gas'));
      return match ? match.nombre : 'Gas GNV';
    }

    return raw;
  }

  private normalizarServicio(serv?: string | number | null): string {
    const raw = serv !== null && serv !== undefined ? String(serv).trim() : '';
    const catalogo = this.facade.serviciosVehiculo();

    const cleanStr = (str: string) =>
      str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

    if (!raw) {
      const matchPart = catalogo.find(s => cleanStr(s.nombre).includes('partic') || cleanStr(s.nombre).includes('priv'));
      return matchPart ? matchPart.nombre : 'Particular';
    }

    const exact = catalogo.find(s => s.nombre === raw);
    if (exact) return exact.nombre;

    if (!isNaN(Number(raw))) {
      const byId = catalogo.find(s => Number(s.id) === Number(raw));
      if (byId) return byId.nombre;
    }
    const byCodigo = catalogo.find(s => s.codigo && cleanStr(s.codigo) === cleanStr(raw));
    if (byCodigo) return byCodigo.nombre;

    const rawClean = cleanStr(raw);
    const matchClean = catalogo.find(s => cleanStr(s.nombre) === rawClean);
    if (matchClean) return matchClean.nombre;

    if (rawClean.includes('part') || rawClean.includes('priv') || rawClean === '1') {
      const match = catalogo.find(s => cleanStr(s.nombre).includes('part') || cleanStr(s.nombre).includes('priv'));
      return match ? match.nombre : 'Particular';
    }
    if (rawClean.includes('publ') || rawClean === '2') {
      const match = catalogo.find(s => cleanStr(s.nombre).includes('publ'));
      return match ? match.nombre : 'Público';
    }
    if (rawClean.includes('ofic') || rawClean === '3') {
      const match = catalogo.find(s => cleanStr(s.nombre).includes('ofic'));
      return match ? match.nombre : 'Oficial';
    }
    if (rawClean.includes('espec') || rawClean === '4') {
      const match = catalogo.find(s => cleanStr(s.nombre).includes('espec'));
      return match ? match.nombre : 'Especial';
    }
    if (rawClean.includes('diplo') || rawClean === '5') {
      const match = catalogo.find(s => cleanStr(s.nombre).includes('diplo'));
      return match ? match.nombre : 'Diplomático';
    }

    return raw;
  }

  // ─── Ciclo de vida ────────────────────────────────────────────────────────
  ngOnInit(): void {
    if (!this.form) {
      this.initForm();
    }
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  // ─── Inicialización del formulario ────────────────────────────────────────
  initForm(): void {
    this.subs.forEach(s => s.unsubscribe());
    this.subs = [];

    this.form = this.fb.group({
      // Paso 1: Datos del Vehículo
      tipoVehiculo: [''],
      marca: [{ value: '', disabled: true }],
      linea: [{ value: '', disabled: true }],
      placa: [''],
      estadoMatriculaId: [null],
      modelo: [null],
      cilindraje: [null],
      combustible: [this.normalizarCombustible(null)],
      servicio: [this.normalizarServicio(null)],
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

    // Cascada 3: Línea -> auto-completa cilindraje y combustible si están vacíos
    const s3 = this.form.get('linea')!.valueChanges.subscribe(lineaNombre => {
      if (!lineaNombre) return;
      const linea = this.facade.lineasDisponibles().find(
        l => l.nombre.toLowerCase() === lineaNombre.toLowerCase()
      );
      if (linea) {
        const patch: any = {};
        if (linea.cilindraje && !this.form.get('cilindraje')?.value) {
          patch.cilindraje = linea.cilindraje;
        }
        if (linea.combustible && !this.form.get('combustible')?.value) {
          patch.combustible = this.normalizarCombustible(linea.combustible);
        }
        if (Object.keys(patch).length > 0) {
          this.form.patchValue(patch, { emitEvent: false });
        }
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

    // Cascada 5: Cambio en tipoDocumento -> limpiar valor si no cumple formato
    const s5 = this.form.get('tipoDocumentoId')!.valueChanges.subscribe(() => {
      const numDoc = this.form.get('numeroDocumento')?.value;
      if (numDoc) {
        const inputEvent = { target: { value: numDoc } } as unknown as Event;
        this.onDocumentoInput(inputEvent);
      }
    });

    this.subs.push(s1, s2, s3, s4, s5);
  }

  // ─── Pre-poblado para edición ─────────────────────────────────────────────
  poblarParaEdicion(v: VehiculoItem): void {
    const tipoInicial = v.tipoVehiculo || v.clase || 'Automóvil';
    const marcaInicial = v.marca || '';
    const lineaInicial = v.linea || '';
    const combustibleInicial = this.normalizarCombustible(v.tipoCombustible || v.combustible);
    const servicioInicial = this.normalizarServicio(v.servicio || (v as any).tipoServicio);

    this.form.get('marca')!.enable({ emitEvent: false });
    this.form.get('linea')!.enable({ emitEvent: false });

    if (tipoInicial) this.facade.cargarMarcasPorTipo(tipoInicial);
    if (marcaInicial) this.facade.cargarLineasPorMarca(marcaInicial, tipoInicial);

    this.form.patchValue({
      placa: v.placa,
      estadoMatriculaId: v.estadoMatriculaId ? Number(v.estadoMatriculaId) : 1,
      marca: marcaInicial,
      linea: lineaInicial,
      modelo: v.modelo,
      servicio: servicioInicial,
      tipoVehiculo: tipoInicial,
      combustible: combustibleInicial,
      cilindraje: v.cilindraje,
      pasajeros: v.pasajeros || 5,
      organismoTransitoId: v.organismoTransitoId ? Number(v.organismoTransitoId) : null,
      fechaMatricula: v.fechaMatricula || '',
      incluirPropietario: true,
      tipoDocumentoId: 1,
      numeroDocumento: v.propietario?.numeroDocumento || v.propietarioDocumento || '',
      naturalezaJuridicaId: v.propietario?.tipoPersona === 'Jurídica' ? 2 : 1,
      nombreRazonSocial: v.propietario?.nombre || v.propietarioNombre || '',
      tipoVinculoPersonaId: 1,
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
          const combVeh = this.normalizarCombustible(veh.combustible || veh.tipoCombustible || combustibleInicial);
          const servVeh = this.normalizarServicio(veh.servicio || (veh as any).tipoServicio || v.servicio || (v as any).tipoServicio);

          if (tipoVeh) this.facade.cargarMarcasPorTipo(tipoVeh);
          if (veh.marca) this.facade.cargarLineasPorMarca(veh.marca, tipoVeh);

          this.form.patchValue({
            estadoMatriculaId: veh.estadoMatriculaId ? Number(veh.estadoMatriculaId) : (v.estadoMatriculaId ? Number(v.estadoMatriculaId) : 1),
            marca: veh.marca || marcaInicial,
            linea: veh.linea || lineaInicial,
            modelo: veh.modelo || v.modelo,
            servicio: servVeh,
            tipoVehiculo: tipoVeh,
            combustible: combVeh,
            cilindraje: veh.cilindraje || v.cilindraje,
            pasajeros: veh.pasajeros || v.pasajeros || 5,
            organismoTransitoId: veh.organismoTransitoId ? Number(veh.organismoTransitoId) : (v.organismoTransitoId ? Number(v.organismoTransitoId) : null),
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
            tipoVinculoPersonaId: prop.tipoVinculoId ? Number(prop.tipoVinculoId) : 1,
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
    const tipoDocId = Number(this.form.get('tipoDocumentoId')?.value);
    const numDoc = this.form.get('numeroDocumento')?.value;

    if (!tipoDocId || isNaN(tipoDocId)) {
      this.propietarioEncontradoMsg.set('⚠️ Seleccione primero el tipo de documento para realizar la búsqueda.');
      return;
    }

    if (!numDoc || !String(numDoc).trim()) {
      this.propietarioEncontradoMsg.set('⚠️ Ingrese un número de documento para realizar la búsqueda.');
      return;
    }

    const docLimpio = String(numDoc).trim();

    this.facade.buscarPropietario(tipoDocId, docLimpio).subscribe({
      next: (propietario) => {
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
          this.propietarioEncontradoMsg.set(`✅ Persona encontrada en base de datos: ${nombreCompleto}`);
        } else {
          this.form.patchValue({ personaId: null });
          this.desbloquearCamposPropietario();
          this.propietarioEncontradoMsg.set('ℹ️ Documento no registrado previamente. Puede ingresar los datos para crear el propietario.');
        }
      },
      error: () => {
        this.form.patchValue({ personaId: null });
        this.desbloquearCamposPropietario();
        this.propietarioEncontradoMsg.set('ℹ️ No fue posible consultar el documento. Puede ingresar los datos manualmente.');
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
  getError(campo: string): string | null {
    return this.erroresPaso().find(e => e.campo === campo)?.mensaje ?? null;
  }

  hasError(campo: string): boolean {
    return this.erroresPaso().some(e => e.campo === campo);
  }

  // ─── Navegación del wizard con validación por paso ───────────────────────
  onSiguiente(): void {
    const pasoActual = this.facade.currentStep();
    const totalPasos = this.facade.tabs().length;

    if (pasoActual < totalPasos) {
      const result = this.validator.validarPaso(pasoActual, this.form);
      if (!result.isValid) {
        this.erroresPaso.set(result.errors);
        return;
      }
      this.erroresPaso.set([]);
      this.facade.siguientePaso();
    } else {
      this.onFinalizarRegistro();
    }
  }

  onAnterior(): void {
    this.erroresPaso.set([]);
    this.facade.anteriorPaso();
  }

  // ─── Submit final ─────────────────────────────────────────────────────────
  onFinalizarRegistro(): void {
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
        correoElectronico: val.correoElectronico ? String(val.correoElectronico).trim() : null,
        telefono: val.telefono ? String(val.telefono).trim() : null,
        direccion: val.direccion ? String(val.direccion).trim() : null,
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
          desc: `El vehículo con placa ${payload.placa} fue registrado exitosamente.`,
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
    if (!vehiculoId) {
      this.toastEmit.emit({
        title: 'Error al Actualizar',
        desc: 'No se encontró el identificador del vehículo a modificar.',
        type: 'error'
      });
      return;
    }

    const val = this.form.getRawValue();
    const updatePayload: any = {
      placa: payload.placa,
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
      fechaMatricula: payload.fechaMatricula,
      propietarioNombre: val.nombreRazonSocial ? String(val.nombreRazonSocial).trim() : undefined,
      propietarioDocumento: val.numeroDocumento ? String(val.numeroDocumento).trim() : undefined,
      tipoVinculoPersonaId: Number(val.tipoVinculoPersonaId) || 1,
      porcentajePropiedad: Number(val.porcentajePropiedad) || 100
    };

    if (payload.propietarioInicial) {
      updatePayload.propietarioInicial = payload.propietarioInicial;
    }

    this.facade.actualizarVehiculo(vehiculoId, updatePayload).subscribe({
      next: () => {
        this.facade.refrescarDashboard();
        this.facade.cerrarRegistro();
        this.toastEmit.emit({
          title: 'Vehículo Actualizado',
          desc: `Los datos del vehículo con placa ${payload.placa} se guardaron exitosamente.`,
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
