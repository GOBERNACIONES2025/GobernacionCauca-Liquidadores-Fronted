import { Component, inject, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { VehiculosFacade } from '../../../application/facades/vehiculos.facade';
import { RegistrarVehiculoDto, PropietarioInicialDto, VehiculoItem } from '../../../domain/models/vehiculo.model';

@Component({
  selector: 'app-vehiculos',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './vehiculos.html'
})
export class Vehiculos implements OnInit {
  readonly facade = inject(VehiculosFacade);
  private fb = inject(FormBuilder);

  form!: FormGroup;

  @HostListener('document:keydown.escape')
  handleEscapeKey(): void {
    if (this.facade.isDrawerOpen()) {
      this.facade.cerrarRegistro();
    } else if (this.facade.isRuntModalOpen()) {
      this.facade.cerrarRunt();
    } else if (this.facade.selectedVehiculo()) {
      this.facade.deseleccionarVehiculo();
    }
  }

  ngOnInit(): void {
    this.initForm();
    this.facade.refrescarDashboard();
    this.facade.cargarCatalogos();
  }

  initForm(): void {
    this.form = this.fb.group({
      // Paso 1: Información General
      placa: ['', [Validators.required, Validators.maxLength(10)]],
      estadoMatriculaId: [null, Validators.required],
      marca: ['', [Validators.required, Validators.maxLength(80)]],
      linea: ['', [Validators.required, Validators.maxLength(100)]],
      modelo: [null, [Validators.required, Validators.min(1900), Validators.max(2035)]],
      color: [''],
      servicio: [''],
      tipoVinculo: [''],

      // Paso 2: Datos Técnicos
      tipoVehiculo: [''],
      clase: [''],
      combustible: [''],
      cilindraje: [null, [Validators.required, Validators.min(1)]],
      pasajeros: [null],
      numeroMotor: [''],
      vinChasis: [''],
      organismoTransitoId: [null],
      fechaMatricula: [''],

      // Paso 2: Propietario Inicial / Contribuyente
      incluirPropietario: [true],
      personaId: [null],
      tipoDocumentoId: [null],
      numeroDocumento: ['', Validators.required],
      digitoVerificacion: [null],
      naturalezaJuridicaId: [null],
      nombreRazonSocial: ['', Validators.required],
      correoElectronico: [''],
      telefono: [''],
      direccion: [''],
      departamentoId: [null],
      ciudadId: [null],
      tipoVinculoPersonaId: [null],
      porcentajePropiedad: [100],
      fechaInicio: [new Date().toISOString().split('T')[0]],
      esResponsablePrincipal: [true],

      // Paso 3: Observaciones
      observaciones: ['']
    });

    // Cascada: Al cambiar Departamento del propietario -> filtrar Ciudades
    this.form.get('departamentoId')?.valueChanges.subscribe(deptId => {
      this.facade.cargarCiudadesPorDepartamento(Number(deptId));
      this.form.patchValue({ ciudadId: null }, { emitEvent: false });
    });

    // Cascada 1: Al cambiar Tipo de Vehículo -> filtrar Marcas oficiales
    this.form.get('tipoVehiculo')?.valueChanges.subscribe(tipo => {
      this.facade.cargarMarcasPorTipo(tipo);
      this.form.patchValue({ marca: '', linea: '' }, { emitEvent: false });
    });

    // Cascada 2: Al cambiar Marca -> filtrar Líneas oficiales para ese tipo y marca
    this.form.get('marca')?.valueChanges.subscribe(marca => {
      const tipo = this.form.get('tipoVehiculo')?.value;
      this.facade.cargarLineasPorMarca(marca, tipo);
      this.form.patchValue({ linea: '' }, { emitEvent: false });
    });

    // Cascada 3: Al cambiar Línea -> auto-completar datos técnicos sugeridos de la base gravable
    this.form.get('linea')?.valueChanges.subscribe(lineaNombre => {
      if (!lineaNombre) return;
      const encontrada = this.facade.lineasDisponibles().find(l => l.nombre.toLowerCase() === lineaNombre.toLowerCase()) ||
        this.facade.lineas().find(l => l.nombre.toLowerCase() === lineaNombre.toLowerCase());

      if (encontrada) {
        this.form.patchValue({
          clase: encontrada.clase || this.form.get('clase')?.value || '',
          combustible: encontrada.combustible || this.form.get('combustible')?.value || '',
          cilindraje: encontrada.cilindraje || this.form.get('cilindraje')?.value || null
        }, { emitEvent: false });
      }
    });
  }

  get isNatural(): boolean {
    return this.form.get('naturalezaJuridicaId')?.value == 1;
  }

  onAbrirRegistro(): void {
    this.facade.limpiarBusquedaPropietario();
    this.initForm();
    this.facade.abrirRegistro();
  }

  onEditarVehiculo(v: VehiculoItem): void {
    this.facade.seleccionarVehiculo(v);
  }

  onAbrirExpedienteModal(v: VehiculoItem): void {
    this.facade.abrirExpediente(v);
  }

  buscarPropietario(): void {
    const numDoc = this.form.get('numeroDocumento')?.value;
    const tipoDocId = this.form.get('tipoDocumentoId')?.value || 1;

    if (!numDoc || !String(numDoc).trim()) return;

    this.facade.buscarPropietario(tipoDocId, String(numDoc).trim()).subscribe(propietario => {
      if (propietario) {
        // Encontrado en base de datos
        const nombreCompleto = propietario.nombreCompleto || 
          propietario.razonSocial || 
          [propietario.primerNombre, propietario.segundoNombre, propietario.primerApellido, propietario.segundoApellido].filter(Boolean).join(' ');

        const deptId = propietario.departamentoId ? Number(propietario.departamentoId) : null;
        const ciuId = propietario.ciudadId ? Number(propietario.ciudadId) : (propietario.municipioId ? Number(propietario.municipioId) : null);

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
          ciudadId: ciuId
        });

        if (deptId) {
          this.facade.cargarCiudadesPorDepartamento(deptId);
        }
      } else {
        // No encontrado -> permitir creación desde aquí
        this.form.patchValue({
          personaId: null
        });
      }
    });
  }

  limpiarPropietario(): void {
    this.facade.limpiarBusquedaPropietario();
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

  onSiguiente(): void {
    if (this.facade.currentStep() < this.facade.tabs().length) {
      this.facade.siguientePaso();
    } else {
      this.onFinalizarRegistro();
    }
  }

  onFinalizarRegistro(): void {
    if (this.form.invalid) {
      console.warn('Formulario inválido:', this.form.value);
      this.form.markAllAsTouched();
      // Si faltan campos en el paso 1, volver al paso 1
      if (this.form.get('placa')?.invalid || this.form.get('marca')?.invalid || this.form.get('linea')?.invalid) {
        this.facade.setStep(1);
        alert('Por favor completa los campos obligatorios del Paso 1 (Placa, Marca, Línea).');
        return;
      }
    }

    const val = this.form.getRawValue();

    // Construir propietarioInicial si se incluyó
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
        razonSocial: razonSocial,
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

    const payload: RegistrarVehiculoDto = {
      placa: String(val.placa).trim().toUpperCase(),
      estadoMatriculaId: Number(val.estadoMatriculaId) || 1,
      marca: String(val.marca).trim(),
      linea: String(val.linea).trim(),
      modelo: Number(val.modelo),
      color: val.color || 'Blanco',
      servicio: val.servicio || 'Particular',
      tipoVehiculo: val.tipoVehiculo || 'Automóvil',
      clase: val.tipoVehiculo || 'Automóvil',
      combustible: val.combustible || 'Gasolina',
      cilindraje: Number(val.cilindraje) || 1000,
      pasajeros: val.pasajeros ? Number(val.pasajeros) : 5,
      numeroMotor: val.numeroMotor || '',
      vinChasis: val.vinChasis || '',
      organismoTransitoId: (val.organismoTransitoId && Number(val.organismoTransitoId) > 0) ? Number(val.organismoTransitoId) : undefined,
      fechaMatricula: val.fechaMatricula ? String(val.fechaMatricula).trim() : undefined,
      propietarioInicial: propietarioInicial
    };

    console.log('Enviando payload POST /api/vehiculos:', payload);

    this.facade.crearVehiculo(payload).subscribe({
      next: (response) => {
        console.log('Vehículo registrado exitosamente:', response);
        
        // Agregar a la lista local para reflejo inmediato en la tabla
        const nuevoVehiculo = {
          id: response.data?.id || Date.now(),
          placa: payload.placa,
          marca: payload.marca,
          linea: payload.linea,
          modelo: payload.modelo,
          cilindraje: payload.cilindraje,
          tipoCombustible: payload.combustible,
          clase: payload.clase,
          color: payload.color,
          servicio: payload.servicio,
          estadoMatricula: 'Matrícula Activa',
          seleccionado: true,
          propietario: {
            nombre: val.nombreRazonSocial || 'Propietario Asignado',
            tipoDocumento: 'CC',
            numeroDocumento: val.numeroDocumento || 'S/N',
            tipoPersona: val.naturalezaJuridicaId == 2 ? 'Jurídica' : 'Natural'
          }
        };

        this.facade.refrescarDashboard();
        this.facade.cerrarRegistro();
        this.initForm();
        alert(`¡Vehículo con placa ${payload.placa} registrado exitosamente!`);
      },
      error: (err) => {
        console.error('Error registrando vehículo en backend:', err);
        const serverMessage = err.error?.message || (Array.isArray(err.error?.errors) ? err.error.errors.join(', ') : (err.error?.errors ? JSON.stringify(err.error.errors) : null)) || err.message;
        
        if (err.status === 409) {
          alert(`Conflicto (409): ${serverMessage || `Ya existe un registro con estos datos (${payload.placa}).`}`);
        } else if (err.status === 400) {
          alert(`Error de validación (400): ${serverMessage || 'Revisa los campos requeridos.'}`);
        } else {
          alert(`Error del servidor (${err.status || 500}): ${serverMessage || 'No se pudo guardar el vehículo en la base de datos.'}`);
        }
      }
    });
  }
}
