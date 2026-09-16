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
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { VehiculosFacade } from '../../../application/facades/vehiculos.facade';
import { VehiculoCompletoValidator } from '../../../application/validators/vehiculos/vehiculo-completo.validator';
import { FieldError } from '../../../application/validators/validation-result';
import {
  RegistrarVehiculoDto,
  PropietarioInicialDto,
  VehiculoItem,
  CatalogoCiudad
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
  readonly propietarioEncontradoMsgs = signal<Record<number, string | null>>({});
  readonly ciudadesPorPropietario = signal<Record<number, CatalogoCiudad[]>>({});
  readonly buscandoPropietarioIndex = signal<number | null>(null);

  // ─── Formulario ───────────────────────────────────────────────────────────
  form!: FormGroup;
  private subs: Subscription[] = [];

  // ─── Constructor Reactivo (Sincroniza apertura del drawer nuevo vs edicion)
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

    // Sincroniza selects reactivamente cuando los catalogos se actualicen
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

  // ─── Getters para FormArray de Propietarios ──────────────────────────────
  get propietariosArray(): FormArray {
    return this.form.get('propietarios') as FormArray;
  }

  isNatural(index: number): boolean {
    const pGroup = this.propietariosArray?.at(index);
    return (pGroup?.get('naturalezaJuridicaId')?.value ?? 1) == 1;
  }

  getPlaceholderDocumento(index: number): string {
    const pGroup = this.propietariosArray?.at(index);
    const tipo = Number(pGroup?.get('tipoDocumentoId')?.value);
    switch (tipo) {
      case 1: return 'Ej: 1035421980 (Solo numeros)';
      case 2: return 'Ej: 900123456 (NIT sin digito)';
      case 3: return 'Ej: 123456789 (Cedula de Extranjeria)';
      case 4: return 'Ej: 1023456789 (Tarjeta de Identidad)';
      case 5: return 'Ej: AB123456 (Pasaporte)';
      case 6: return 'Ej: 1023456789 (Registro Civil)';
      default: return 'Numero de documento...';
    }
  }

  onDocumentoInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const pGroup = this.propietariosArray.at(index);
    const tipo = Number(pGroup?.get('tipoDocumentoId')?.value);
    if ([1, 2, 4, 6].includes(tipo)) {
      const soloDigitos = input.value.replace(/\D/g, '');
      if (input.value !== soloDigitos) {
        input.value = soloDigitos;
        pGroup.get('numeroDocumento')?.setValue(soloDigitos, { emitEvent: false });
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
      return match ? match.nombre : 'Diesel';
    }
    if (rawClean.includes('elec')) {
      const match = catalogo.find(c => cleanStr(c.nombre).includes('elec'));
      return match ? match.nombre : 'Electrico';
    }
    if (rawClean.includes('hib')) {
      const match = catalogo.find(c => cleanStr(c.nombre).includes('hib'));
      return match ? match.nombre : 'Hibrido';
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
      return match ? match.nombre : 'Publico';
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
      return match ? match.nombre : 'Diplomatico';
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

  // ─── Inicializacion del formulario ────────────────────────────────────────
  initForm(): void {
    this.subs.forEach(s => s.unsubscribe());
    this.subs = [];

    this.form = this.fb.group({
      // Paso 1: Datos del Vehiculo
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

      // Paso 2: Propietarios y Copropietarios
      incluirPropietario: [true],
      propietarios: this.fb.array([
        this.crearPropietarioFormGroup({
          porcentajePropiedad: 100,
          esResponsablePrincipal: true,
          tipoVinculoPersonaId: 1,
          naturalezaJuridicaId: 1,
          tipoDocumentoId: 1
        })
      ]),

      // Paso 3: Observaciones
      observaciones: ['']
    });

    this.configurarCascadas();
    this.erroresPaso.set([]);
    this.propietarioEncontradoMsgs.set({});
    this.ciudadesPorPropietario.set({});
  }

  // ─── Creacion de FormGroup para cada propietario ──────────────────────────
  crearPropietarioFormGroup(datos?: Partial<PropietarioInicialDto>): FormGroup {
    const fg = this.fb.group({
      personaId: [datos?.personaId || null],
      tipoDocumentoId: [datos?.tipoDocumentoId || 1],
      numeroDocumento: [datos?.numeroDocumento || ''],
      digitoVerificacion: [datos?.digitoVerificacion || null],
      naturalezaJuridicaId: [datos?.naturalezaJuridicaId || 1],
      nombreRazonSocial: [datos?.razonSocial || (datos as any)?.nombreRazonSocial || (datos as any)?.nombrePropietario || ''],
      correoElectronico: [datos?.correoElectronico || ''],
      telefono: [datos?.telefono || ''],
      direccion: [datos?.direccion || ''],
      departamentoId: [datos?.departamentoId || null],
      ciudadId: [datos?.ciudadId || null],
      tipoVinculoPersonaId: [datos?.tipoVinculoPersonaId || 1],
      porcentajePropiedad: [datos?.porcentajePropiedad !== undefined ? datos.porcentajePropiedad : 100],
      fechaInicio: [datos?.fechaInicio || new Date().toISOString().split('T')[0]],
      esResponsablePrincipal: [datos?.esResponsablePrincipal !== undefined ? datos.esResponsablePrincipal : true]
    });

    if (datos?.departamentoId) {
      this.cargarCiudadesPropietario(this.propietariosArray?.length || 0, Number(datos.departamentoId));
    }

    return fg;
  }

  // ─── Gestion de Propietarios / Copropietarios ─────────────────────────────
  agregarCopropietario(): void {
    const restante = this.calcularPorcentajeRestante();
    const nuevoGrupo = this.crearPropietarioFormGroup({
      porcentajePropiedad: restante > 0 ? restante : 0,
      esResponsablePrincipal: false,
      tipoVinculoPersonaId: 1,
      naturalezaJuridicaId: 1,
      tipoDocumentoId: 1
    });
    this.propietariosArray.push(nuevoGrupo);
  }

  eliminarCopropietario(index: number): void {
    if (this.propietariosArray.length <= 1) return;

    const fuePrincipal = this.propietariosArray.at(index).get('esResponsablePrincipal')?.value;
    this.propietariosArray.removeAt(index);

    // Si se elimino el principal, asignar al primero
    if (fuePrincipal && this.propietariosArray.length > 0) {
      this.setResponsablePrincipal(0);
    }

    // Limpiar mensajes y ciudades
    const msgs = { ...this.propietarioEncontradoMsgs() };
    delete msgs[index];
    this.propietarioEncontradoMsgs.set(msgs);
  }

  setResponsablePrincipal(index: number): void {
    this.propietariosArray.controls.forEach((control, i) => {
      control.get('esResponsablePrincipal')?.setValue(i === index, { emitEvent: false });
    });
  }

  calcularPorcentajeTotal(): number {
    if (!this.propietariosArray) return 0;
    const total = this.propietariosArray.controls.reduce((acc, control) => {
      const val = Number(control.get('porcentajePropiedad')?.value) || 0;
      return acc + val;
    }, 0);
    return Math.round(total * 100) / 100;
  }

  calcularPorcentajeRestante(): number {
    const total = this.calcularPorcentajeTotal();
    return Math.max(0, Math.round((100 - total) * 100) / 100);
  }

  asignarRestante(index: number): void {
    const currentControl = this.propietariosArray.at(index);
    if (!currentControl) return;

    const actualVal = Number(currentControl.get('porcentajePropiedad')?.value) || 0;
    const otrosTotal = this.calcularPorcentajeTotal() - actualVal;
    const nuevoVal = Math.max(0, Math.round((100 - otrosTotal) * 100) / 100);
    currentControl.get('porcentajePropiedad')?.setValue(nuevoVal);
  }

  cargarCiudadesPropietario(index: number, deptId: number | null): void {
    if (!deptId) {
      const map = { ...this.ciudadesPorPropietario() };
      map[index] = [];
      this.ciudadesPorPropietario.set(map);
      this.propietariosArray.at(index)?.get('ciudadId')?.setValue(null, { emitEvent: false });
      return;
    }

    this.facade.cargarCiudadesPorDepartamento(Number(deptId));
    // La facade actualiza ciudadesDisponibles; guardamos copia local
    setTimeout(() => {
      const map = { ...this.ciudadesPorPropietario() };
      map[index] = this.facade.ciudadesDisponibles();
      this.ciudadesPorPropietario.set(map);
    }, 150);
  }

  onDepartamentoChange(index: number, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const deptId = select.value ? Number(select.value) : null;
    this.cargarCiudadesPropietario(index, deptId);
  }

  // ─── Cascadas de dependencias vehiculares ────────────────────────────────
  private configurarCascadas(): void {
    // Cascada 1: Tipo de Vehiculo -> habilita Marca y carga marcas disponibles
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

    // Cascada 2: Marca -> habilita Linea y carga lineas disponibles
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

    // Cascada 3: Linea -> auto-completa cilindraje y combustible si estan vacios
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

    this.subs.push(s1, s2, s3);
  }

  // ─── Pre-poblado para edicion ─────────────────────────────────────────────
  poblarParaEdicion(v: VehiculoItem): void {
    const tipoInicial = v.tipoVehiculo || v.clase || 'Automovil';
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
      incluirPropietario: true
    }, { emitEvent: false });

    this.form.get('placa')!.disable({ emitEvent: false });

    // Carga el expediente completo en background
    if (v.id) {
      this.facade.cargarExpediente(v.id).subscribe(exp => {
        if (!exp) return;
        const veh = exp.vehiculo || exp;
        const props = exp.propietarios && exp.propietarios.length > 0 ? exp.propietarios : [];

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

        if (props.length > 0) {
          this.propietariosArray.clear();
          props.forEach((prop: any, idx: number) => {
            const fg = this.crearPropietarioFormGroup({
              personaId: prop.personaId,
              tipoDocumentoId: prop.tipoDocumentoId ? Number(prop.tipoDocumentoId) : 1,
              numeroDocumento: prop.numeroDocumento || '',
              naturalezaJuridicaId: prop.naturalezaJuridicaId ? Number(prop.naturalezaJuridicaId) : 1,
              razonSocial: prop.nombrePropietario || '',
              correoElectronico: prop.correoElectronico || '',
              telefono: prop.telefono || '',
              direccion: prop.direccion || '',
              departamentoId: prop.departamentoId ? Number(prop.departamentoId) : null,
              ciudadId: prop.ciudadId ? Number(prop.ciudadId) : null,
              tipoVinculoPersonaId: prop.tipoVinculoId ? Number(prop.tipoVinculoId) : 1,
              porcentajePropiedad: prop.porcentajePropiedad || 100,
              fechaInicio: prop.fechaInicio || '',
              esResponsablePrincipal: prop.esResponsablePrincipal ?? (idx === 0)
            });
            this.propietariosArray.push(fg);
            if (prop.personaId || prop.numeroDocumento) {
              this.bloquearCamposPropietario(idx);
            }
          });
        }
      });
    }
  }

  // ─── Control de campos del propietario por indice ────────────────────────
  bloquearCamposPropietario(index: number): void {
    const pGroup = this.propietariosArray.at(index);
    if (!pGroup) return;
    const campos = [
      'tipoDocumentoId', 'numeroDocumento', 'naturalezaJuridicaId',
      'nombreRazonSocial', 'correoElectronico', 'telefono',
      'direccion', 'departamentoId', 'ciudadId'
    ];
    campos.forEach(c => pGroup.get(c)?.disable({ emitEvent: false }));
  }

  desbloquearCamposPropietario(index: number): void {
    const pGroup = this.propietariosArray.at(index);
    if (!pGroup) return;
    const campos = [
      'tipoDocumentoId', 'numeroDocumento', 'naturalezaJuridicaId',
      'nombreRazonSocial', 'correoElectronico', 'telefono',
      'direccion', 'departamentoId', 'ciudadId'
    ];
    campos.forEach(c => pGroup.get(c)?.enable({ emitEvent: false }));
  }

  // ─── Busqueda de propietario por documento individual ────────────────────
  buscarPropietario(index: number): void {
    const pGroup = this.propietariosArray.at(index);
    if (!pGroup) return;

    const tipoDocId = Number(pGroup.get('tipoDocumentoId')?.value);
    const numDoc = pGroup.get('numeroDocumento')?.value;

    if (!tipoDocId || isNaN(tipoDocId)) {
      this.setPropietarioMsg(index, 'Seleccione primero el tipo de documento para realizar la busqueda.');
      return;
    }

    if (!numDoc || !String(numDoc).trim()) {
      this.setPropietarioMsg(index, 'Ingrese un numero de documento para realizar la busqueda.');
      return;
    }

    const docLimpio = String(numDoc).trim();
    this.buscandoPropietarioIndex.set(index);

    this.facade.buscarPropietario(tipoDocId, docLimpio).subscribe({
      next: (propietario) => {
        this.buscandoPropietarioIndex.set(null);
        if (propietario) {
          const nombreCompleto = propietario.nombreCompleto ||
            propietario.razonSocial ||
            [propietario.primerNombre, propietario.segundoNombre,
             propietario.primerApellido, propietario.segundoApellido]
              .filter(Boolean).join(' ');

          const deptId = propietario.departamentoId ? Number(propietario.departamentoId) : null;
          if (deptId) {
            this.cargarCiudadesPropietario(index, deptId);
          }

          pGroup.patchValue({
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

          this.bloquearCamposPropietario(index);
          this.setPropietarioMsg(index, `Persona encontrada en base de datos: ${nombreCompleto}`);
        } else {
          pGroup.patchValue({ personaId: null });
          this.desbloquearCamposPropietario(index);
          this.setPropietarioMsg(index, 'Documento no registrado previamente. Puede ingresar los datos para registrar al contribuyente.');
        }
      },
      error: () => {
        this.buscandoPropietarioIndex.set(null);
        pGroup.patchValue({ personaId: null });
        this.desbloquearCamposPropietario(index);
        this.setPropietarioMsg(index, 'No fue posible consultar el documento. Puede ingresar los datos manualmente.');
      }
    });
  }

  limpiarPropietario(index: number): void {
    const pGroup = this.propietariosArray.at(index);
    if (!pGroup) return;

    this.desbloquearCamposPropietario(index);
    this.setPropietarioMsg(index, null);
    pGroup.patchValue({
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

  private setPropietarioMsg(index: number, msg: string | null): void {
    const current = { ...this.propietarioEncontradoMsgs() };
    current[index] = msg;
    this.propietarioEncontradoMsgs.set(current);
  }

  getPropietarioMsg(index: number): string | null {
    return this.propietarioEncontradoMsgs()[index] ?? null;
  }

  // ─── Helpers para mostrar errores de campo en el template ────────────────
  getError(campo: string, index?: number): string | null {
    if (index !== undefined) {
      const key = `propietario_${index}_${campo}`;
      const found = this.erroresPaso().find(e => e.campo === key || e.campo === campo);
      return found?.mensaje ?? null;
    }
    return this.erroresPaso().find(e => e.campo === campo)?.mensaje ?? null;
  }

  hasError(campo: string, index?: number): boolean {
    if (index !== undefined) {
      const key = `propietario_${index}_${campo}`;
      return this.erroresPaso().some(e => e.campo === key || e.campo === campo);
    }
    return this.erroresPaso().some(e => e.campo === campo);
  }

  // ─── Navegacion del wizard con validacion por paso ───────────────────────
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
        title: 'Campos incompletos o invalidos',
        desc: resumen || 'Por favor revise los campos marcados en rojo.',
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

  // ─── Construccion del DTO ─────────────────────────────────────────────────
  private construirPayload(): RegistrarVehiculoDto {
    const val = this.form.getRawValue();
    const listaPropietariosDto: PropietarioInicialDto[] = [];

    if (val.incluirPropietario && Array.isArray(val.propietarios)) {
      val.propietarios.forEach((p: any) => {
        if (p.numeroDocumento || p.personaId) {
          const nombreCompleto = (p.nombreRazonSocial || '').trim();
          let pNombre: string | null = null;
          let sNombre: string | null = null;
          let pApellido: string | null = null;
          let sApellido: string | null = null;
          let razonSocial: string | null = null;

          if (p.naturalezaJuridicaId == 1) {
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

          listaPropietariosDto.push({
            personaId: p.personaId || null,
            tipoDocumentoId: Number(p.tipoDocumentoId) || 1,
            numeroDocumento: String(p.numeroDocumento).trim(),
            digitoVerificacion: p.digitoVerificacion || null,
            naturalezaJuridicaId: Number(p.naturalezaJuridicaId) || 1,
            primerNombre: pNombre,
            segundoNombre: sNombre,
            primerApellido: pApellido,
            segundoApellido: sApellido,
            razonSocial,
            correoElectronico: p.correoElectronico ? String(p.correoElectronico).trim() : null,
            telefono: p.telefono ? String(p.telefono).trim() : null,
            direccion: p.direccion ? String(p.direccion).trim() : null,
            departamentoId: p.departamentoId ? Number(p.departamentoId) : null,
            ciudadId: p.ciudadId ? Number(p.ciudadId) : null,
            tipoVinculoPersonaId: Number(p.tipoVinculoPersonaId) || 1,
            porcentajePropiedad: Number(p.porcentajePropiedad) || 100,
            fechaInicio: p.fechaInicio || new Date().toISOString().split('T')[0],
            esResponsablePrincipal: Boolean(p.esResponsablePrincipal)
          });
        }
      });
    }

    return {
      placa: String(val.placa).trim().toUpperCase(),
      estadoMatriculaId: Number(val.estadoMatriculaId) || 1,
      marca: String(val.marca).trim(),
      linea: String(val.linea).trim(),
      modelo: Number(val.modelo),
      servicio: val.servicio || 'Particular',
      tipoVehiculo: val.tipoVehiculo || 'Automovil',
      clase: val.tipoVehiculo || 'Automovil',
      combustible: val.combustible || 'Gasolina',
      cilindraje: Number(val.cilindraje) || 1000,
      pasajeros: val.pasajeros ? Number(val.pasajeros) : undefined,
      organismoTransitoId: val.organismoTransitoId && Number(val.organismoTransitoId) > 0
        ? Number(val.organismoTransitoId) : undefined,
      fechaMatricula: val.fechaMatricula ? String(val.fechaMatricula).trim() : undefined,
      propietarios: listaPropietariosDto.length > 0 ? listaPropietariosDto : undefined,
      propietarioInicial: listaPropietariosDto.length > 0 ? listaPropietariosDto[0] : null
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
          desc: `El vehiculo con placa ${payload.placa} fue registrado exitosamente.`,
          type: 'success'
        });
      },
      error: (err: any) => {
        const msg = err.error?.message ||
          (Array.isArray(err.error?.errors) ? err.error.errors.join(', ') : null) ||
          err.message;
        this.toastEmit.emit({
          title: 'Error al Registrar',
          desc: msg || 'No se pudo guardar el vehiculo.',
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
        desc: 'No se encontro el identificador del vehiculo a modificar.',
        type: 'error'
      });
      return;
    }

    const val = this.form.getRawValue();
    const principalProp = payload.propietarios?.find(p => p.esResponsablePrincipal) || payload.propietarios?.[0] || payload.propietarioInicial;

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
      propietarioNombre: principalProp?.razonSocial || [principalProp?.primerNombre, principalProp?.primerApellido].filter(Boolean).join(' ') || undefined,
      propietarioDocumento: principalProp?.numeroDocumento || undefined,
      tipoVinculoPersonaId: principalProp?.tipoVinculoPersonaId || 1,
      porcentajePropiedad: principalProp?.porcentajePropiedad || 100,
      propietarios: payload.propietarios,
      propietarioInicial: payload.propietarioInicial
    };

    this.facade.actualizarVehiculo(vehiculoId, updatePayload).subscribe({
      next: () => {
        this.facade.refrescarDashboard();
        this.facade.cerrarRegistro();
        this.toastEmit.emit({
          title: 'Vehiculo Actualizado',
          desc: `Los datos del vehiculo con placa ${payload.placa} se guardaron exitosamente.`,
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

