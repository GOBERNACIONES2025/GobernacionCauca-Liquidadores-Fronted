import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BreadcrumbComponent } from '../../../../../shared/components/breadcrumb/breadcrumb.component';
import { VehiculosApiService } from '../../../infrastructure/api/vehiculos-api.service';
import { CatalogoApiService } from '../../../infrastructure/api/catalogo-api.service';
import { VehiculoItemDto } from '../../../domain/interfaces/vehiculo.interface';
import { CatalogoItemDto, TipoDocumentoDto } from '../../../domain/interfaces/catalogo.interface';
import { FormularioTraspasoComponent, TraspasoFormModel, AnexoInfo } from './components/formulario-traspaso/formulario-traspaso';
import { FormularioTrasladoComponent, TrasladoFormModel } from './components/formulario-traslado/formulario-traslado';
import { FormularioRematriculaComponent, RematriculaFormModel } from './components/formulario-rematricula/formulario-rematricula';
import { SearchableSelectComponent } from '../../../../../shared/components/searchable-select/searchable-select';

export type TipoNovedadVehiculo = 'Traspaso de Propiedad del Vehiculo' | 'Traslado' | 'Rematricula' | '';

export interface NovedadHistoricoItem {
  id: string;
  fecha: string;
  placa: string;
  tipoNovedad: string;
  detalle: string;
  responsable: string;
  estado: 'PROCESADA' | 'EN_REVISION' | 'APROBADA';
  anexo?: string;
}

@Component({
  selector: 'app-novedades',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    BreadcrumbComponent,
    SearchableSelectComponent,
    FormularioTraspasoComponent,
    FormularioTrasladoComponent,
    FormularioRematriculaComponent
  ],
  templateUrl: './novedades.html',
})
export class NovedadesPage implements OnInit {
  private readonly vehiculosApi = inject(VehiculosApiService);
  private readonly catalogoApi = inject(CatalogoApiService);

  // Opciones con búsqueda de coincidencias por teclado para la novedad
  readonly tiposNovedadOpciones = [
    { id: 'Traspaso de Propiedad del Vehiculo', nombre: 'Traspaso de Propiedad del Vehículo' },
    { id: 'Traslado', nombre: 'Traslado de Cuenta / Matrícula' },
    { id: 'Rematricula', nombre: 'Rematrícula' },
  ];

  // Estados reactivos principales
  readonly placa = signal<string>('');
  readonly tipoNovedad = signal<TipoNovedadVehiculo>('');
  readonly loading = signal<boolean>(false);
  readonly submitting = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // Información del vehículo obtenida desde /api/vehiculos
  readonly vehiculo = signal<VehiculoItemDto | null>(null);

  // Anexos para cada formulario
  readonly anexoTraspaso = signal<AnexoInfo | null>(null);
  readonly anexoTraslado = signal<AnexoInfo | null>(null);
  readonly anexoRematricula = signal<AnexoInfo | null>(null);

  readonly toastMessage = signal<{ title: string; desc: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Catálogos
  readonly tiposDocumento = signal<TipoDocumentoDto[]>([]);
  readonly organismosTransito = signal<CatalogoItemDto[]>([]);

  // Computed helper para visualización limpia en la cabecera
  readonly vehiculoDisplay = computed(() => {
    const v = this.vehiculo();
    if (!v) return null;
    const anyV = v as any;
    return {
      placa: v.placa || '',
      marca: v.marca || 'MARCA N/A',
      linea: v.linea || '',
      modelo: v.modelo || 'N/A',
      estadoMatricula: v.estadoMatricula || anyV.estadoMatriculaNombre || 'Activo',
      organismoTransito: v.organismoTransito || anyV.organismoTransitoNombre || 'Popayán',
      clase: v.clase || 'Automóvil',
      cilindraje: v.cilindraje ? `${v.cilindraje} cc` : 'N/A',
      combustible: v.combustible || v.tipoCombustible || 'Gasolina',
      servicio: v.servicio || 'Particular',
      municipio: anyV.municipioNombre || anyV.municipio || v.organismoTransito || 'Popayán',
      propietarioNombre: v.propietario?.nombre || v.propietarioNombre || 'Contribuyente Principal',
    };
  });

  // Modelos de datos para cada formulario desacoplado
  traspasoForm: TraspasoFormModel = {
    propietarioActualNombre: '',
    propietarioActualDoc: '',
    propietarioActualTipoDoc: '',
    propietarioActualTelefono: '',
    propietarioActualCorreo: '',
    propietarioActualDireccion: '',
    propietarioActualPorcentaje: 100,

    tipoDocumentoId: 1,
    numeroDocumento: '',
    primerNombre: '',
    segundoNombre: '',
    primerApellido: '',
    segundoApellido: '',
    razonSocial: '',
    esPersonaJuridica: false,
    telefono: '',
    correoElectronico: '',
    direccion: '',
    porcentajePropiedad: 100,
    fechaTraspaso: new Date().toISOString().substring(0, 10),
    numeroRadicado: '',
    esResponsablePrincipal: true,
    observaciones: '',
  };

  trasladoForm: TrasladoFormModel = {
    organismoOrigenId: '' as string | number,
    organismoOrigen: '',
    municipioOrigen: '',
    organismoDestinoId: '' as string | number,
    organismoDestinoNombre: '',
    departamentoDestino: '',
    municipioDestino: '',
    numeroResolucion: '',
    fechaSolicitud: new Date().toISOString().substring(0, 10),
    motivo: 'Cambio de Domicilio del Propietario',
    pazYSalvoVerificado: true,
    observaciones: '',
  };

  rematriculaForm: RematriculaFormModel = {
    motivo: 'Pérdida definitiva de placas',
    placaActual: '',
    nuevaPlaca: '',
    fechaRematricula: new Date().toISOString().substring(0, 10),
    organismoTransito: '',
    numeroActa: '',
    numeroMotorConfirmado: '',
    numeroChasisConfirmado: '',
    cilindrajeConfirmado: '',
    marcaLineaModelo: '',
    observaciones: '',
  };

  // Historial de novedades
  readonly historialNovedades = signal<NovedadHistoricoItem[]>([
    {
      id: 'NOV-2026-0041',
      fecha: '2026-09-27',
      placa: 'QWE456',
      tipoNovedad: 'Traspaso de Propiedad del Vehiculo',
      detalle: 'Traspaso a favor de Carlos Alberto Mendoza (CC 10.543.210)',
      responsable: 'Liquidador Automotores',
      estado: 'APROBADA',
      anexo: 'contrato_compraventa_QWE456.pdf',
    },
    {
      id: 'NOV-2026-0040',
      fecha: '2026-09-25',
      placa: 'ABC123',
      tipoNovedad: 'Traslado',
      detalle: 'Traslado de cuenta hacia Secretaría de Tránsito de Cali',
      responsable: 'Admin Sistema',
      estado: 'PROCESADA',
      anexo: 'resolucion_traslado_ABC123.pdf',
    },
  ]);

  ngOnInit(): void {
    this.cargarCatalogos();
  }

  cargarCatalogos(): void {
    this.catalogoApi.getTiposDocumento().subscribe({
      next: (res: any) => {
        const items = Array.isArray(res) ? res : res?.data || [];
        this.tiposDocumento.set(items);
      },
      error: () => {
        this.tiposDocumento.set([
          { id: 1, codigo: 'CC', nombre: 'Cédula de Ciudadanía' },
          { id: 2, codigo: 'NIT', nombre: 'NIT' },
          { id: 3, codigo: 'CE', nombre: 'Cédula de Extranjería' },
          { id: 4, codigo: 'TI', nombre: 'Tarjeta de Identidad' },
          { id: 5, codigo: 'PAS', nombre: 'Pasaporte' },
        ]);
      }
    });

    this.catalogoApi.getOrganismosTransito().subscribe({
      next: (res: any) => {
        const items = Array.isArray(res) ? res : res?.data || [];
        this.organismosTransito.set(items);
      },
      error: () => {
        this.organismosTransito.set([
          { id: 1, nombre: 'Secretaría de Tránsito y Transporte de Popayán' },
          { id: 2, nombre: 'Secretaría de Tránsito y Transporte de Santander de Quilichao' },
          { id: 3, nombre: 'Secretaría de Tránsito y Transporte de Puerto Tejada' },
          { id: 4, nombre: 'Secretaría de Tránsito de Cali' },
          { id: 5, nombre: 'Secretaría de Movilidad de Bogotá' },
          { id: 6, nombre: 'Secretaría de Movilidad de Medellín' },
        ]);
      }
    });
  }

  onPlacaInput(value: string): void {
    this.placa.set(value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
    if (this.error()) {
      this.error.set(null);
    }
  }

  onTipoNovedadChange(tipo: string): void {
    this.tipoNovedad.set(tipo as TipoNovedadVehiculo);
    if (this.vehiculo()) {
      this.autocompletarFormularios(this.vehiculo()!);
    }
  }

  buscarPlaca(): void {
    const rawPlaca = this.placa().trim().toUpperCase();
    if (!rawPlaca) {
      this.error.set('Por favor ingrese una placa para realizar la búsqueda.');
      return;
    }

    if (rawPlaca.length < 5 || rawPlaca.length > 7) {
      this.error.set('La placa debe tener entre 5 y 7 caracteres alfanuméricos.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.vehiculosApi.getVehiculos({ page: 1, pageSize: 10, buscar: rawPlaca }).subscribe({
      next: (res) => {
        this.loading.set(false);
        const items: VehiculoItemDto[] = res?.data?.items || (res as any)?.items || [];
        const encontrado = items.find((v: VehiculoItemDto) => v.placa?.toUpperCase() === rawPlaca) || items[0];

        if (encontrado) {
          this.vehiculo.set(encontrado);
          this.autocompletarFormularios(encontrado);
          this.mostrarToast('Vehículo Encontrado', `Datos del vehículo ${encontrado.placa} cargados correctamente.`, 'success');
        } else {
          this.vehiculo.set(null);
          this.error.set(`No se encontró ningún vehículo registrado con la placa ${rawPlaca}.`);
        }
      },
      error: () => {
        this.loading.set(false);
        this.vehiculo.set(null);
        this.error.set(`No fue posible consultar la placa ${rawPlaca}. Verifique la conexión con el servidor.`);
      }
    });
  }

  autocompletarFormularios(v: VehiculoItemDto): void {
    const orgTransito = v.organismoTransito || 'Secretaría de Tránsito de Popayán';
    const prop = v.propietario;
    const propResumen = v.propietarios && v.propietarios.length > 0 ? v.propietarios[0] : null;

    // 1. Traspaso
    this.traspasoForm.propietarioActualNombre = prop?.nombre || v.propietarioNombre || propResumen?.nombre || 'Propietario Registrado';
    this.traspasoForm.propietarioActualDoc = prop?.numeroDocumento || v.propietarioDocumento || propResumen?.numeroDocumento || '';
    this.traspasoForm.propietarioActualTipoDoc = prop?.tipoDocumento || propResumen?.tipoDocumento || 'CC';
    this.traspasoForm.propietarioActualTelefono = propResumen?.telefono || 'No registrado';
    this.traspasoForm.propietarioActualCorreo = propResumen?.correoElectronico || 'No registrado';
    this.traspasoForm.propietarioActualDireccion = propResumen?.direccion || 'No registrada';
    this.traspasoForm.propietarioActualPorcentaje = propResumen?.porcentajePropiedad || 100;

    // 2. Traslado
    this.trasladoForm.organismoOrigen = orgTransito;
    this.trasladoForm.municipioOrigen = orgTransito;
    if (v.organismoTransitoId) {
      this.trasladoForm.organismoOrigenId = v.organismoTransitoId;
    }

    // 3. Rematrícula
    this.rematriculaForm.placaActual = v.placa;
    this.rematriculaForm.organismoTransito = orgTransito;
    this.rematriculaForm.cilindrajeConfirmado = v.cilindraje ? `${v.cilindraje} cc` : '';
    this.rematriculaForm.marcaLineaModelo = `${v.marca || ''} ${v.linea || ''} (${v.modelo || ''})`.trim();
  }

  limpiarBusqueda(): void {
    this.placa.set('');
    this.vehiculo.set(null);
    this.error.set(null);
    this.tipoNovedad.set('');
    this.anexoTraspaso.set(null);
    this.anexoTraslado.set(null);
    this.anexoRematricula.set(null);
  }

  procesarNovedad(): void {
    const v = this.vehiculo();
    const novedad = this.tipoNovedad();

    if (!v) {
      this.mostrarToast('Atención', 'Primero debe consultar un vehículo con su placa.', 'error');
      return;
    }

    if (!novedad) {
      this.mostrarToast('Atención', 'Seleccione el tipo de novedad que desea registrar.', 'error');
      return;
    }

    this.submitting.set(true);

    setTimeout(() => {
      this.submitting.set(false);

      let detalle = '';
      let anexoNombre = '';
      if (novedad === 'Traspaso de Propiedad del Vehiculo') {
        const esJuridica = this.traspasoForm.esPersonaJuridica || 
          Number(this.traspasoForm.tipoDocumentoId) === 2 ||
          this.tiposDocumento().find(t => Number(t.id) === Number(this.traspasoForm.tipoDocumentoId))?.codigo?.toUpperCase() === 'NIT';
        const nombreNuevo = esJuridica 
          ? this.traspasoForm.razonSocial 
          : `${this.traspasoForm.primerNombre} ${this.traspasoForm.primerApellido}`.trim();
        detalle = `Traspaso desde ${this.traspasoForm.propietarioActualNombre || 'Actual'} hacia ${nombreNuevo || 'Nuevo Propietario'} (Doc: ${this.traspasoForm.numeroDocumento || 'N/A'}) - ${this.traspasoForm.porcentajePropiedad}%`;
        anexoNombre = this.anexoTraspaso()?.nombre || '';
      } else if (novedad === 'Traslado') {
        const orgDestino = this.organismosTransito().find(o => String(o.id) === String(this.trasladoForm.organismoDestinoId))?.nombre || this.trasladoForm.organismoDestinoNombre || 'Organismo Seleccionado';
        detalle = `Traslado de ${this.trasladoForm.organismoOrigen} hacia ${orgDestino} - Radicado: ${this.trasladoForm.numeroResolucion || 'S/N'}`;
        anexoNombre = this.anexoTraslado()?.nombre || '';
      } else if (novedad === 'Rematricula') {
        detalle = `Rematrícula procesada - Motivo: ${this.rematriculaForm.motivo}${this.rematriculaForm.nuevaPlaca ? ' - Nueva Placa: ' + this.rematriculaForm.nuevaPlaca : ''} - Acta: ${this.rematriculaForm.numeroActa || 'S/N'}`;
        anexoNombre = this.anexoRematricula()?.nombre || '';
      }

      const nuevoRegistro: NovedadHistoricoItem = {
        id: `NOV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        fecha: new Date().toISOString().substring(0, 10),
        placa: v.placa,
        tipoNovedad: novedad,
        detalle: detalle,
        responsable: 'Liquidador Automotores',
        estado: 'PROCESADA',
        anexo: anexoNombre || undefined,
      };

      this.historialNovedades.update(prev => [nuevoRegistro, ...prev]);
      this.mostrarToast('Novedad Radicada con Éxito', `La novedad "${novedad}" para la placa ${v.placa} ha sido registrada con radicado ${nuevoRegistro.id}.`, 'success');
    }, 800);
  }

  mostrarToast(title: string, desc: string, type: 'success' | 'error' | 'info' = 'info'): void {
    this.toastMessage.set({ title, desc, type });
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 4500);
  }
}
