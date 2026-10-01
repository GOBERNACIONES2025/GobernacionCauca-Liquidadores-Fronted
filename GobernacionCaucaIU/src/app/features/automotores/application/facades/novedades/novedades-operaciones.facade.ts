import { Injectable, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { NovedadesApiService } from '../../../infrastructure/api/novedades-api.service';
import { VehiculoItemDto } from '../../../domain/interfaces/vehiculo.interface';
import { TipoDocumentoDto } from '../../../domain/interfaces/catalogo.interface';
import {
  NuevoPropietarioRequest,
  RadicarTraspasoRequest,
  RadicarTrasladoCirculacionRequest,
  RadicarRematriculaRequest
} from '../../../domain/interfaces/novedades.interface';
import { 
  TraspasoFormModel, 
  NuevoPropietarioTraspaso, 
  AnexoInfo 
} from '../../../presentation/pages/novedades/components/formulario-traspaso/formulario-traspaso';
import { TrasladoFormModel } from '../../../presentation/pages/novedades/components/formulario-traslado/formulario-traslado';
import { RematriculaFormModel } from '../../../presentation/pages/novedades/components/formulario-rematricula/formulario-rematricula';

export type TipoNovedadVehiculo = 'Traspaso de Propiedad del Vehiculo' | 'Traslado' | 'Rematricula' | '';

export interface RadicarResultado {
  success: boolean;
  radicadoId?: string;
  mensaje?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NovedadesOperacionesFacade {
  private readonly novedadesApi = inject(NovedadesApiService);

  readonly tipoNovedad = signal<TipoNovedadVehiculo>('');
  readonly submitting = signal<boolean>(false);

  readonly anexoTraspaso = signal<AnexoInfo | null>(null);
  readonly anexoTraslado = signal<AnexoInfo | null>(null);
  readonly anexoRematricula = signal<AnexoInfo | null>(null);

  traspasoForm: TraspasoFormModel = this.crearTraspasoFormInicial();
  trasladoForm: TrasladoFormModel = this.crearTrasladoFormInicial();
  rematriculaForm: RematriculaFormModel = this.crearRematriculaFormInicial();

  crearPropietarioInicial(porcentaje: number = 100, esPrincipal: boolean = true): NuevoPropietarioTraspaso {
    return {
      personaId: null,
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
      porcentajePropiedad: porcentaje,
      esResponsablePrincipal: esPrincipal,
    };
  }

  crearTraspasoFormInicial(): TraspasoFormModel {
    return {
      propietarioActualNombre: '',
      propietarioActualDoc: '',
      propietarioActualTipoDoc: '',
      propietarioActualTelefono: '',
      propietarioActualCorreo: '',
      propietarioActualDireccion: '',
      propietarioActualPorcentaje: 100,
      propietarios: [this.crearPropietarioInicial(100, true)],
      fechaTraspaso: new Date().toISOString().substring(0, 10),
      numeroRadicado: '',
      observaciones: '',
    };
  }

  crearTrasladoFormInicial(): TrasladoFormModel {
    return {
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
  }

  crearRematriculaFormInicial(): RematriculaFormModel {
    return {
      motivo: 'Pérdida definitiva de placas',
      placaActual: '',
      nuevaPlaca: '',
      fechaRematricula: new Date().toISOString().substring(0, 10),
      organismoTransito: '',
      numeroActa: '',
      servicioActual: 'Particular',
      nuevoServicio: 'Público',
      cilindrajeConfirmado: '',
      marcaLineaModelo: '',
      observaciones: '',
    };
  }

  autocompletarFormularios(v: VehiculoItemDto): void {
    const anyV = v as any;
    const orgTransito = v.organismoTransito || anyV.organismoTransitoNombre || 'Secretaría de Tránsito de Popayán';
    const prop = v.propietario;
    const propResumen = v.propietarios && v.propietarios.length > 0 ? v.propietarios[0] : null;
    const servActual = v.servicio || anyV.servicioNombre || 'Particular';
    const esPublico = servActual.toLowerCase().includes('pub') || servActual.toLowerCase().includes('púb');
    const nuevoServicioDefault = esPublico ? 'Particular' : 'Publico';

    // 1. Traspaso
    this.traspasoForm = {
      propietarioActualNombre: prop?.nombre || v.propietarioNombre || propResumen?.nombre || 'Propietario Registrado',
      propietarioActualDoc: prop?.numeroDocumento || v.propietarioDocumento || propResumen?.numeroDocumento || '',
      propietarioActualTipoDoc: prop?.tipoDocumento || propResumen?.tipoDocumento || 'CC',
      propietarioActualTelefono: propResumen?.telefono || 'No registrado',
      propietarioActualCorreo: propResumen?.correoElectronico || 'No registrado',
      propietarioActualDireccion: propResumen?.direccion || 'No registrada',
      propietarioActualPorcentaje: propResumen?.porcentajePropiedad || 100,
      propietarios: [this.crearPropietarioInicial(100, true)],
      fechaTraspaso: new Date().toISOString().substring(0, 10),
      numeroRadicado: '',
      observaciones: '',
    };

    // 2. Traslado
    this.trasladoForm = {
      organismoOrigenId: v.organismoTransitoId || '',
      organismoOrigen: orgTransito,
      municipioOrigen: orgTransito,
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

    // 3. Rematrícula
    this.rematriculaForm = {
      motivo: 'Pérdida definitiva de placas',
      placaActual: v.placa,
      nuevaPlaca: '',
      numeroActa: '',
      fechaRematricula: new Date().toISOString().substring(0, 10),
      organismoTransito: orgTransito,
      servicioActual: servActual,
      nuevoServicio: esPublico ? 'Particular' : 'Público',
      cilindrajeConfirmado: v.cilindraje ? `${v.cilindraje} cc` : '',
      marcaLineaModelo: `${v.marca || ''} ${v.linea || ''} (${v.modelo || ''})`.trim(),
      observaciones: '',
    };
  }

  limpiarFormularios(v?: VehiculoItemDto | null): void {
    if (v) {
      this.autocompletarFormularios(v);
    } else {
      this.traspasoForm = this.crearTraspasoFormInicial();
      this.trasladoForm = this.crearTrasladoFormInicial();
      this.rematriculaForm = this.crearRematriculaFormInicial();
    }
    this.anexoTraspaso.set(null);
    this.anexoTraslado.set(null);
    this.anexoRematricula.set(null);
  }

  radicarNovedad(v: VehiculoItemDto, tiposDocumento: TipoDocumentoDto[]): Observable<RadicarResultado> {
    const novedad = this.tipoNovedad();

    if (!novedad) {
      return of({ success: false, error: 'Seleccione el tipo de novedad que desea registrar.' });
    }

    // ────────────────────────────────────────────────────────────────────────────────────
    // 1. TRASPASO
    // ────────────────────────────────────────────────────────────────────────────────────
    if (novedad === 'Traspaso de Propiedad del Vehiculo') {
      const props = this.traspasoForm.propietarios || [];

      if (!this.traspasoForm.fechaTraspaso) {
        return of({ success: false, error: 'Seleccione la fecha del trámite de traspaso.' });
      }
      if (props.length === 0) {
        return of({ success: false, error: 'Debe agregar al menos un nuevo propietario.' });
      }

      const totalPct = props.reduce((acc, p) => acc + (Number(p.porcentajePropiedad) || 0), 0);
      const totalRedondeado = Math.round(totalPct * 100) / 100;
      if (totalRedondeado !== 100) {
        return of({
          success: false,
          error: `El porcentaje total de propiedad debe ser exactamente 100%. Actualmente suma ${totalRedondeado}%.`
        });
      }

      for (let i = 0; i < props.length; i++) {
        const p = props[i];
        const numDoc = (p.numeroDocumento || '').trim();
        if (!p.tipoDocumentoId) {
          return of({ success: false, error: `Seleccione el tipo de documento del propietario #${i + 1}.` });
        }
        if (!p.personaId && !numDoc) {
          return of({ success: false, error: `Ingrese el número de documento del propietario #${i + 1}.` });
        }

        const esJur = this.esPersonaJuridica(p, tiposDocumento);

        if (!p.personaId) {
          // Persona nueva: validar nombre
          if (esJur && !p.razonSocial?.trim()) {
            return of({ success: false, error: `Ingrese la razón social del propietario #${i + 1}.` });
          }
          if (!esJur && !p.primerNombre?.trim()) {
            return of({ success: false, error: `Ingrese el primer nombre del propietario #${i + 1}.` });
          }
          if (!esJur && !p.primerApellido?.trim()) {
            return of({ success: false, error: `Ingrese el primer apellido del propietario #${i + 1}.` });
          }
        }

        if (!p.porcentajePropiedad || Number(p.porcentajePropiedad) <= 0) {
          return of({ success: false, error: `El propietario #${i + 1} debe tener una participación mayor a 0%.` });
        }
      }

      if (!props.some(p => p.esResponsablePrincipal)) {
        props[0].esResponsablePrincipal = true;
      }

      const nuevosPropietarios: NuevoPropietarioRequest[] = props.map(p => {
        const esJur = this.esPersonaJuridica(p, tiposDocumento);
        const nombreCompleto = esJur
          ? (p.razonSocial || '')
          : `${p.primerNombre || ''} ${p.segundoNombre || ''} ${p.primerApellido || ''} ${p.segundoApellido || ''}`.replace(/\s+/g, ' ').trim();

        const item: NuevoPropietarioRequest = {
          tipoVinculoPersonaId: 1,
          porcentajePropiedad: Number(p.porcentajePropiedad),
          esResponsablePrincipal: Boolean(p.esResponsablePrincipal),
        };

        if (p.personaId) {
          // Persona existente en BD — solo se necesita el ID
          item.personaId = p.personaId;
        } else {
          // Persona nueva — enviar datos para crearla
          item.numeroDocumento = (p.numeroDocumento || '').trim();
          item.tipoDocumentoId = Number(p.tipoDocumentoId);
          item.naturalizaJuridicaId = esJur ? 2 : 1;
          item.nombreCompleto = nombreCompleto;
          if (p.telefono) item.telefono = p.telefono;
          if (p.correoElectronico) item.correoElectronico = p.correoElectronico;
          if (p.direccion) item.direccion = p.direccion;
        }

        return item;
      });

      const nombresResumen = props.map((p, _i) => {
        const esJur = this.esPersonaJuridica(p, tiposDocumento);
        const nom = esJur ? (p.razonSocial || 'Persona Jurídica') : `${p.primerNombre || ''} ${p.primerApellido || ''}`.trim();
        return `${nom} (${p.porcentajePropiedad}%)`;
      }).join(', ');

      const payload: RadicarTraspasoRequest = {
        vehiculoId: v.id,
        placa: v.placa,
        numeroRadicado: null,
        motivo: this.traspasoForm.observaciones?.trim()
          ? this.traspasoForm.observaciones
          : `Traspaso a favor de: ${nombresResumen}`,
        observaciones: this.traspasoForm.observaciones || undefined,
        rutaArchivoSoporte: this.anexoTraspaso()?.nombre || undefined,
        fechaTraspaso: this.traspasoForm.fechaTraspaso,
        nuevosPropietarios,
      };

      this.submitting.set(true);
      return this.novedadesApi.radicarTraspaso(payload).pipe(
        map(res => {
          this.submitting.set(false);
          const radId = res?.value;
          this.limpiarFormularios(v);
          this.tipoNovedad.set('');
          return {
            success: true,
            radicadoId: String(radId),
            mensaje: `Traspaso para la placa ${v.placa} registrado con radicado #${radId}.`
          };
        }),
        catchError(err => {
          this.submitting.set(false);
          const errMsg = err?.error?.message || err?.message || 'Error al radicar el traspaso en el servidor.';
          return of({ success: false, error: errMsg });
        })
      );
    }

    // ────────────────────────────────────────────────────────────────────────────────────
    // 2. TRASLADO DE CIRCULACIÓN
    // ────────────────────────────────────────────────────────────────────────────────────
    if (novedad === 'Traslado') {
      if (!this.trasladoForm.organismoDestinoId) {
        return of({ success: false, error: 'Seleccione el organismo de tránsito de destino.' });
      }

      const orgDestinoId = Number(this.trasladoForm.organismoDestinoId);
      if (!orgDestinoId || isNaN(orgDestinoId)) {
        return of({ success: false, error: 'El organismo de tránsito de destino no es válido.' });
      }

      const payload: RadicarTrasladoCirculacionRequest = {
        vehiculoId: v.id,
        placa: v.placa,
        nuevoOrganismoTransitoId: orgDestinoId,
        numeroRadicado: null,
        motivo: this.trasladoForm.motivo || 'Traslado de Circulación',
        observaciones: this.trasladoForm.observaciones || undefined,
        rutaArchivoSoporte: this.anexoTraslado()?.nombre || undefined,
      };

      this.submitting.set(true);
      return this.novedadesApi.radicarTrasladoCirculacion(payload).pipe(
        map(res => {
          this.submitting.set(false);
          const radId = res?.value;
          this.limpiarFormularios(v);
          this.tipoNovedad.set('');
          return {
            success: true,
            radicadoId: String(radId),
            mensaje: `Traslado de circulación para la placa ${v.placa} registrado con radicado #${radId}.`
          };
        }),
        catchError(err => {
          this.submitting.set(false);
          const errMsg = err?.error?.message || err?.message || 'Error al radicar el traslado en el servidor.';
          return of({ success: false, error: errMsg });
        })
      );
    }

    // ────────────────────────────────────────────────────────────────────────────────────
    // 3. REMATRÍCULA
    // ────────────────────────────────────────────────────────────────────────────────────
    if (novedad === 'Rematricula') {
      const f = this.rematriculaForm;
      const nuevaPlaca = f.nuevaPlaca?.trim().toUpperCase() || undefined;

      // Al menos un campo de cambio debe estar presente
      if (!nuevaPlaca && !f.nuevoServicio && !f.cilindrajeConfirmado) {
        return of({ success: false, error: 'Ingrese al menos un campo de cambio (nueva placa, nuevo servicio o datos técnicos).' });
      }

      if (!f.fechaRematricula) {
        return of({ success: false, error: 'Ingrese la fecha de rematrícula.' });
      }

      // Mapear servicio al formato que espera el backend
      const servicioMap: Record<string, string> = {
        'particular': 'PARTICULAR',
        'público': 'PUBLICO',
        'publico': 'PUBLICO',
        'oficial': 'OFICIAL',
      };
      const nuevoServicioMapped = f.nuevoServicio
        ? (servicioMap[f.nuevoServicio.toLowerCase()] || f.nuevoServicio.toUpperCase())
        : undefined;

      const payload: RadicarRematriculaRequest = {
        vehiculoId: v.id,
        placa: v.placa,
        numeroRadicado: null,
        motivo: f.motivo || 'Rematrícula de vehículo',
        observaciones: f.observaciones || undefined,
        rutaArchivoSoporte: this.anexoRematricula()?.nombre || undefined,
        nuevaPlaca: nuevaPlaca,
        nuevoServicio: nuevoServicioMapped,
        nuevaFechaMatricula: f.fechaRematricula || undefined,
      };

      this.submitting.set(true);
      return this.novedadesApi.radicarRematricula(payload).pipe(
        map(res => {
          this.submitting.set(false);
          const radId = res?.value;
          this.limpiarFormularios(v);
          this.tipoNovedad.set('');
          return {
            success: true,
            radicadoId: String(radId),
            mensaje: `Rematrícula para la placa ${v.placa} registrada con radicado #${radId}.`
          };
        }),
        catchError(err => {
          this.submitting.set(false);
          const errMsg = err?.error?.message || err?.message || 'Error al radicar la rematrícula en el servidor.';
          return of({ success: false, error: errMsg });
        })
      );
    }

    return of({ success: false, error: 'Tipo de novedad no reconocido.' });
  }

  /** Helper: determina si un propietario es persona jurídica */
  private esPersonaJuridica(p: NuevoPropietarioTraspaso, tiposDocumento: TipoDocumentoDto[]): boolean {
    return Boolean(
      p.esPersonaJuridica ||
      Number(p.tipoDocumentoId) === 2 ||
      tiposDocumento.find(t => Number(t.id) === Number(p.tipoDocumentoId))?.codigo?.toUpperCase() === 'NIT'
    );
  }
}
