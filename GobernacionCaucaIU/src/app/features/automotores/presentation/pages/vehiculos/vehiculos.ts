import { Component, inject, OnInit, HostListener, signal } from '@angular/core';
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

  readonly activeMenuVehiculoId = signal<number | null>(null);

  toggleMenu(id: number, event: MouseEvent): void {
    event.stopPropagation();
    this.activeMenuVehiculoId.update(current => current === id ? null : id);
  }

  cerrarMenu(): void {
    this.activeMenuVehiculoId.set(null);
  }

  @HostListener('document:click')
  handleDocumentClick(): void {
    this.cerrarMenu();
  }

  @HostListener('document:keydown.escape')
  handleEscapeKey(): void {
    if (this.facade.isInactivarModalOpen()) {
      this.facade.cerrarInactivar();
    } else if (this.facade.isDrawerOpen()) {
      this.facade.cerrarRegistro();
    } else if (this.facade.isRuntModalOpen()) {
      this.facade.cerrarRunt();
    } else if (this.facade.selectedVehiculo()) {
      this.facade.deseleccionarVehiculo();
    }
    this.cerrarMenu();
  }

  ngOnInit(): void {
    this.initForm();
    this.facade.refrescarDashboard();
  }

  initForm(): void {
    this.form = this.fb.group({
      // Paso 1: Información General
      placa: ['', [Validators.required, Validators.maxLength(10)]],
      estadoMatriculaId: [null, Validators.required],
      marca: [{ value: '', disabled: true }, [Validators.required, Validators.maxLength(80)]],
      linea: [{ value: '', disabled: true }, [Validators.required, Validators.maxLength(100)]],
      modelo: [null, [Validators.required, Validators.min(1900), Validators.max(2035)]],
      servicio: [''],

      // Paso 2: Datos Técnicos
      tipoVehiculo: [''],
      clase: [''],
      combustible: [''],
      cilindraje: [null, [Validators.required, Validators.min(1)]],
      pasajeros: [null],
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
      tipoVinculoPersonaId: [1],
      porcentajePropiedad: [100],
      fechaInicio: [new Date().toISOString().split('T')[0]],
      esResponsablePrincipal: [true],

      // Paso 3: Observaciones
      observaciones: ['']
    });

    // Cascada: Al cambiar Departamento del propietario -> filtrar Ciudades
    this.form.get('departamentoId')?.valueChanges.subscribe(deptId => {
      if (deptId) {
        this.facade.cargarCiudadesPorDepartamento(Number(deptId));
      } else {
        this.facade.ciudadesDisponibles.set([]);
      }
    });

    // Cascada 1: Al cambiar Tipo de Vehículo -> filtrar Marcas oficiales
    this.form.get('tipoVehiculo')?.valueChanges.subscribe(tipo => {
      if (tipo) {
        this.facade.cargarMarcasPorTipo(tipo);
        this.form.get('marca')?.enable({ emitEvent: false });
      } else {
        this.form.get('marca')?.disable({ emitEvent: false });
        this.form.get('linea')?.disable({ emitEvent: false });
      }
    });

    // Cascada 2: Al cambiar Marca -> filtrar Líneas oficiales para ese tipo y marca
    this.form.get('marca')?.valueChanges.subscribe(marca => {
      const tipo = this.form.get('tipoVehiculo')?.value;
      if (marca) {
        this.facade.cargarLineasPorMarca(marca, tipo);
        this.form.get('linea')?.enable({ emitEvent: false });
      } else {
        this.form.get('linea')?.disable({ emitEvent: false });
      }
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

  bloquearCamposPropietario(): void {
    const campos = ['tipoDocumentoId', 'numeroDocumento', 'naturalezaJuridicaId', 'nombreRazonSocial', 'correoElectronico', 'telefono', 'direccion', 'departamentoId', 'ciudadId'];
    campos.forEach(c => this.form.get(c)?.disable({ emitEvent: false }));
  }

  desbloquearCamposPropietario(): void {
    const campos = ['tipoDocumentoId', 'numeroDocumento', 'naturalezaJuridicaId', 'nombreRazonSocial', 'correoElectronico', 'telefono', 'direccion', 'departamentoId', 'ciudadId'];
    campos.forEach(c => this.form.get(c)?.enable({ emitEvent: false }));
  }

  onAbrirRegistro(): void {
    this.facade.limpiarBusquedaPropietario();
    this.initForm();
    this.desbloquearCamposPropietario();
    this.facade.cargarCatalogos();
    this.facade.abrirRegistro();
  }

  onEditarVehiculo(v: VehiculoItem): void {
    this.facade.seleccionarVehiculo(v);
    this.facade.abrirExpediente(v);
    this.facade.cargarCatalogos();

    const tipoInicial = v.tipoVehiculo || v.clase || 'Automóvil';
    const marcaInicial = v.marca || '';
    const lineaInicial = v.linea || '';

    // Habilitar controles de marca y línea para edición
    this.form.get('marca')?.enable({ emitEvent: false });
    this.form.get('linea')?.enable({ emitEvent: false });

    if (tipoInicial) {
      this.facade.cargarMarcasPorTipo(tipoInicial);
    }
    if (marcaInicial) {
      this.facade.cargarLineasPorMarca(marcaInicial, tipoInicial);
    }

    // Pre-poblado INMEDIATO (0ms delay) con los datos disponibles en la tabla
    this.form.patchValue({
      placa: v.placa,
      estadoMatriculaId: v.estadoMatriculaId ? String(v.estadoMatriculaId) : '1',
      marca: marcaInicial,
      linea: lineaInicial,
      modelo: v.modelo,
      servicio: v.servicio || 'Particular',
      tipoVehiculo: tipoInicial,
      clase: v.clase || v.tipoVehiculo || 'Automóvil',
      combustible: v.tipoCombustible || v.combustible || 'Gasolina',
      cilindraje: v.cilindraje,
      pasajeros: v.pasajeros || 5,
      organismoTransitoId: v.organismoTransitoId ? String(v.organismoTransitoId) : '',
      fechaMatricula: v.fechaMatricula || '',
      // Propietario inmediato
      incluirPropietario: true,
      tipoDocumentoId: 1,
      numeroDocumento: v.propietario?.numeroDocumento || v.propietarioDocumento || '',
      naturalezaJuridicaId: v.propietario?.tipoPersona === 'Jurídica' ? 2 : 1,
      nombreRazonSocial: v.propietario?.nombre || v.propietarioNombre || '',
      tipoVinculoPersonaId: '1',
      porcentajePropiedad: 100,
      esResponsablePrincipal: true
    }, { emitEvent: false });

    this.form.get('placa')?.disable({ emitEvent: false });

    // Cargar expediente completo en segundo plano (sin bloquear la UI)
    if (v.id) {
      this.facade.cargarExpediente(v.id).subscribe(exp => {
        if (!exp) return;
        const veh = exp.vehiculo || exp;
        const prop = (exp.propietarios && exp.propietarios.length > 0) ? exp.propietarios[0] : null;

        if (veh) {
          const tipoVeh = veh.tipoVehiculo || veh.clase || v.tipoVehiculo || 'Automóvil';
          const marcaVeh = veh.marca || v.marca;
          const lineaVeh = veh.linea || v.linea;

          if (tipoVeh) {
            this.facade.cargarMarcasPorTipo(tipoVeh);
          }
          if (marcaVeh) {
            this.facade.cargarLineasPorMarca(marcaVeh, tipoVeh);
          }

          this.form.patchValue({
            placa: veh.placa || v.placa,
            estadoMatriculaId: veh.estadoMatriculaId ? String(veh.estadoMatriculaId) : (v.estadoMatriculaId ? String(v.estadoMatriculaId) : '1'),
            marca: marcaVeh,
            linea: lineaVeh,
            modelo: veh.modelo || v.modelo,
            servicio: veh.servicio || v.servicio || 'Particular',
            tipoVehiculo: tipoVeh,
            clase: veh.clase || veh.tipoVehiculo || v.clase || 'Automóvil',
            combustible: veh.combustible || v.tipoCombustible || 'Gasolina',
            cilindraje: veh.cilindraje || v.cilindraje,
            pasajeros: veh.pasajeros || v.pasajeros || 5,
            organismoTransitoId: veh.organismoTransitoId ? String(veh.organismoTransitoId) : (v.organismoTransitoId ? String(v.organismoTransitoId) : ''),
            fechaMatricula: veh.fechaMatricula || v.fechaMatricula || ''
          }, { emitEvent: false });
        }

        if (prop) {
          const deptId = prop.departamentoId ? Number(prop.departamentoId) : null;
          if (deptId) {
            this.facade.cargarCiudadesPorDepartamento(deptId);
          }

          this.form.patchValue({
            incluirPropietario: true,
            personaId: prop.personaId,
            tipoDocumentoId: prop.tipoDocumentoId ? Number(prop.tipoDocumentoId) : 1,
            numeroDocumento: prop.numeroDocumento || '',
            naturalezaJuridicaId: prop.naturalezaJuridicaId ? Number(prop.naturalezaJuridicaId) : (prop.tipoPersona === 'Jurídica' ? 2 : 1),
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

  onAbrirExpedienteModal(v: VehiculoItem): void {
    this.onEditarVehiculo(v);
  }

  buscarPropietario(): void {
    const numDoc = this.form.get('numeroDocumento')?.value;
    const tipoDocId = this.form.get('tipoDocumentoId')?.value || 1;

    if (!numDoc || !String(numDoc).trim()) return;

    this.facade.buscarPropietario(tipoDocId, String(numDoc).trim()).subscribe(propietario => {
      if (propietario) {
        // Encontrado en base de datos -> Cargar y BLOQUEAR campos personales
        const nombreCompleto = propietario.nombreCompleto || 
          propietario.razonSocial || 
          [propietario.primerNombre, propietario.segundoNombre, propietario.primerApellido, propietario.segundoApellido].filter(Boolean).join(' ');

        const deptId = propietario.departamentoId ? Number(propietario.departamentoId) : null;
        const ciuId = propietario.ciudadId ? Number(propietario.ciudadId) : (propietario.municipioId ? Number(propietario.municipioId) : null);

        if (deptId) {
          this.facade.cargarCiudadesPorDepartamento(deptId);
        }

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
        }, { emitEvent: false });

        this.bloquearCamposPropietario();
      } else {
        // No encontrado -> permitir creación y DESBLOQUEAR campos personales
        this.form.patchValue({
          personaId: null
        });
        this.desbloquearCamposPropietario();
      }
    });
  }

  limpiarPropietario(): void {
    this.facade.limpiarBusquedaPropietario();
    this.desbloquearCamposPropietario();
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
      servicio: val.servicio || 'Particular',
      tipoVehiculo: val.tipoVehiculo || 'Automóvil',
      clase: val.tipoVehiculo || 'Automóvil',
      combustible: val.combustible || 'Gasolina',
      cilindraje: Number(val.cilindraje) || 1000,
      pasajeros: val.pasajeros ? Number(val.pasajeros) : 5,
      organismoTransitoId: (val.organismoTransitoId && Number(val.organismoTransitoId) > 0) ? Number(val.organismoTransitoId) : undefined,
      fechaMatricula: val.fechaMatricula ? String(val.fechaMatricula).trim() : undefined,
      propietarioInicial: propietarioInicial
    };

    if (!this.facade.isNuevoRegistro()) {
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

      console.log(`Enviando PUT /api/vehiculos/${vehiculoId}:`, updatePayload);

      this.facade.actualizarVehiculo(vehiculoId, updatePayload).subscribe({
        next: (response) => {
          console.log('Vehículo actualizado exitosamente:', response);
          this.facade.refrescarDashboard();
          this.facade.cerrarRegistro();
          alert(`¡Vehículo con placa ${payload.placa} actualizado exitosamente!`);
        },
        error: (err) => {
          console.error('Error actualizando vehículo:', err);
          const serverMessage = err.error?.message || err.message;
          alert(`Error actualizando vehículo (${err.status || 500}): ${serverMessage || 'No se pudo guardar los cambios.'}`);
        }
      });
      return;
    }

    console.log('Enviando payload POST /api/vehiculos:', payload);

    this.facade.crearVehiculo(payload).subscribe({
      next: (response) => {
        console.log('Vehículo registrado exitosamente:', response);
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
