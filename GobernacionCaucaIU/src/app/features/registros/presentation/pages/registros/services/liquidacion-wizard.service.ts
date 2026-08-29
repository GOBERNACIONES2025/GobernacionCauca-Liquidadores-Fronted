import { Injectable, inject, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LiquidacionSimuladaResponse } from '../../../../domain/models/Liquidacion/liquidacion-simulada.model';
import { ExencionesFacade } from '../../../../application/facades/Exenciones/exenciones.facade';

export interface IntervinienteTemp {
  idTemp: string;
  contribuyenteId?: number | null;
  nombre: string;
  documento: string;
  rolId: number;
  rolNombre: string;
  porcentaje: number;
}

export interface ActoTemp {
  idTemp: string;
  tipoActoId: number;
  tipoActoCodigo: string;
  tipoActoNombre: string;
  categoriaNombre: string;
  naturalezaNombre: string;
  tarifaInfo: string;
  valorActo: number;
  baseDeclarada: number;
  inmuebleId?: number | null;
  matriculaInmobiliaria?: string;
  avaluoCatastral?: number;
  exencionId?: number | null;
  exencionNombre?: string | null;
  intervinientes: IntervinienteTemp[];
}

@Injectable({
  providedIn: 'root'
})
export class LiquidacionWizardService {
  private fb = inject(FormBuilder);
  private exencionesFacade = inject(ExencionesFacade);

  // Estado visual
  currentStep = signal<number>(1);
  
  // Datos fijos/temporales de la sesión
  solicitudId = signal<number | null>(null);
  etapaGuardada = signal<number>(0);
  radicadoGenerado = signal<string>('');
  fechaRadicado = signal<string>(new Date().toISOString().split('T')[0]);
  vigenciaFiscal = signal<number | null>(null);

  // Estados de Solicitud (1: RADICADA, 2: EN_REVISION, 3: PENDIENTE, 4: LIQUIDADA, 5: DEVUELTA, 6: ANULADA, 7: CERRADA)
  estadoSolicitudId = signal<number>(1);
  estadoSolicitudNombre = signal<string>('Radicada');
  
  // Banderas de control de mutabilidad
  esSoloLectura = computed(() => [4, 6, 7].includes(this.estadoSolicitudId()) || this.liquidacionGeneradaExitosa());
  esEditable = computed(() => !this.esSoloLectura());
  
  // ===================== FORMULARIOS =====================

  // Paso 1: Radicación & Contribuyente
  paso1Form: FormGroup = this.fb.group({
    contribuyenteId: [null as number | null],
    tipoPersonaId: [null as number | null, Validators.required],
    tipoIdentificacionId: [null as number | null, Validators.required],
    numeroIdentificacion: ['', Validators.required],
    nombre: ['', Validators.required],
    email: [''],
    telefono: [''],
    direccion: [''],
    
    // Datos de radicación
    numeroRadicado: ['', Validators.required],
    fechaRadicado: [new Date().toISOString().split('T')[0], Validators.required],
    vigenciaFiscal: [null as number | null, Validators.required],
    departamentoId: [null as number | null, Validators.required],
    observacionRadicacion: ['']
  });

  // Paso 2: Documento
  paso2Form: FormGroup = this.fb.group({
    numeroDocumento: ['', Validators.required],
    fechaDocumento: [new Date().toISOString().split('T')[0], Validators.required],
    entidadRegistroId: [null as number | null, Validators.required],
    municipioJurisdiccionId: [null as number | null, Validators.required],
    descripcionDocumento: ['']
  });
  
  documentoSoporteFile: File | null = null;
  documentoSoporteNombre = signal<string | null>(null);

  // Paso 3: Actos
  isAddingActo = signal<boolean>(true);
  actosExpediente = signal<ActoTemp[]>([]);
  intervinientesActoActual = signal<IntervinienteTemp[]>([]);
  
  actoForm: FormGroup = this.fb.group({
    tipoActoRegistroId: [null as number | null, Validators.required],
    inmuebleId: [null as number | null],
    valorActo: [0, [Validators.required, Validators.min(0)]],
    baseDeclarada: [0, [Validators.required, Validators.min(0)]],
    matriculaInmobiliaria: [''],
    avaluoCatastral: [0],
    exencionId: [null as number | null]
  });

  // Paso 4: Intervinientes (NUEVO)
  intervinienteSeleccionado = signal<any | null>(null);
  creandoNuevoInterviniente = signal<boolean>(false);
  actoSeleccionadoId = signal<string | null>(null);

  intervinienteBusquedaForm: FormGroup = this.fb.group({
    numeroIdentificacion: ['', Validators.required]
  });

  intervinienteNuevoForm: FormGroup = this.fb.group({
    tipoPersonaId: [null as number | null, Validators.required],
    tipoIdentificacionId: [null as number | null, Validators.required],
    numeroIdentificacion: ['', Validators.required],
    nombre: ['', Validators.required],
    email: [''],
    telefono: [''],
    direccion: ['']
  });

  intervinienteAsignarForm: FormGroup = this.fb.group({
    rolId: [null as number | null, Validators.required],
    porcentaje: [100, [Validators.required, Validators.min(1), Validators.max(100)]]
  });

  // Paso 4: Liquidación
  liquidacionGeneradaExitosa = signal<boolean>(false);
  idLiquidacionFinal = signal<number | null>(null);
  liquidacionSimulada = signal<LiquidacionSimuladaResponse | null>(null);

  // MÉTODOS DE UTILIDAD

  resetWizard() {
    this.currentStep.set(1);
    this.solicitudId.set(null);
    this.etapaGuardada.set(0);
    this.radicadoGenerado.set('');
    this.estadoSolicitudId.set(1);
    this.estadoSolicitudNombre.set('Radicada');
    
    this.paso1Form.reset({
      contribuyenteId: null,
      tipoPersonaId: null,
      tipoIdentificacionId: null,
      numeroIdentificacion: '',
      nombre: '',
      email: '',
      telefono: '',
      direccion: '',
      numeroRadicado: '',
      fechaRadicado: new Date().toISOString().split('T')[0],
      vigenciaFiscal: null,
      departamentoId: null,
      observacionRadicacion: ''
    });
    
    this.paso2Form.reset({
      numeroDocumento: '',
      fechaDocumento: new Date().toISOString().split('T')[0],
      entidadRegistroId: null,
      municipioJurisdiccionId: null,
      descripcionDocumento: ''
    });
    
    this.actoForm.reset({
      tipoActoRegistroId: null,
      inmuebleId: null,
      valorActo: 0,
      baseDeclarada: 0,
      matriculaInmobiliaria: '',
      avaluoCatastral: 0,
      exencionId: null
    });
    
    this.intervinientesActoActual.set([]);
    this.actosExpediente.set([]);
    this.isAddingActo.set(true);
    this.liquidacionGeneradaExitosa.set(false);
    this.idLiquidacionFinal.set(null);
    this.liquidacionSimulada.set(null);
    this.documentoSoporteFile = null;
    this.documentoSoporteNombre.set(null);
    
    this.intervinienteSeleccionado.set(null);
    this.creandoNuevoInterviniente.set(false);
    this.actoSeleccionadoId.set(null);
    this.intervinienteBusquedaForm.reset();
    this.intervinienteNuevoForm.reset();
    this.intervinienteAsignarForm.reset({ rolId: null, porcentaje: 100 });
  }
  cargarDatosDesdeSolicitud(solicitud: any) {
    this.solicitudId.set(solicitud.solicitudId);
    this.etapaGuardada.set(solicitud.etapaActual);
    this.radicadoGenerado.set(solicitud.numeroRadicado);
    this.estadoSolicitudId.set(solicitud.estadoSolicitudId || 1);
    this.estadoSolicitudNombre.set(solicitud.nombreEstado || 'Radicada');

    if (solicitud.estadoSolicitudId === 4) {
      this.liquidacionGeneradaExitosa.set(true);
    }
    
    // Asignar el paso actual según la etapa guardada (nunca superando el paso 5)
    // Si etapa es 1 (Radicación completada), saltamos al paso 2
    // Si etapa es 2 (Documento completado), saltamos al paso 3, etc.
    const nextStep = Math.min(solicitud.etapaActual + 1, 5);
    this.currentStep.set(nextStep);

    // Poblar Paso 1
    if (solicitud.numeroRadicado) {
      this.paso1Form.patchValue({
        numeroRadicado: solicitud.numeroRadicado,
        fechaRadicacion: solicitud.fechaRadicacion ? solicitud.fechaRadicacion.substring(0, 10) : this.paso1Form.value.fechaRadicado,
        vigenciaFiscal: solicitud.vigenciaId,
        departamentoId: solicitud.departamentoId,
        observacionRadicacion: solicitud.observacion
      });
    }

    if (solicitud.contribuyente) {
      this.paso1Form.patchValue({
        contribuyenteId: solicitud.contribuyente.id,
        tipoPersonaId: solicitud.contribuyente.tipoPersonaId,
        tipoIdentificacionId: solicitud.contribuyente.tipoIdentificacionId,
        numeroIdentificacion: solicitud.contribuyente.numeroIdentificacion,
        nombre: solicitud.contribuyente.nombre,
        email: solicitud.contribuyente.email,
        telefono: solicitud.contribuyente.telefono,
        direccion: solicitud.contribuyente.direccion
      });
    }

    // Poblar Paso 2, 3 y 4
    if (solicitud.documentos && solicitud.documentos.length > 0) {
      const doc = solicitud.documentos[0];
      this.paso2Form.patchValue({
        numeroDocumento: doc.numeroDocumento,
        fechaDocumento: doc.fechaDocumento ? doc.fechaDocumento.substring(0, 10) : '',
        entidadRegistroId: doc.entidadRegistroId,
        municipioJurisdiccionId: doc.municipioJurisdiccionId,
        descripcionDocumento: doc.descripcion
      });

      this.documentoSoporteFile = null;
      if (doc.nombreArchivo) {
        this.documentoSoporteNombre.set(doc.nombreArchivo);
      } else if (solicitud.etapaActual >= 2) {
        this.documentoSoporteNombre.set('Documento adjunto en la base de datos');
      }
      
      // Poblar Actos
      if (doc.actos && doc.actos.length > 0) {
        const actosTemp = doc.actos.map((a: any) => {
          // 1. Extraer ID y Nombre de Exención de forma tolerante
          let exId: number | null = null;
          if (a.exencionId && Number(a.exencionId) > 0) {
            exId = Number(a.exencionId);
          } else if (Array.isArray(a.exencionesIds) && a.exencionesIds.length > 0) {
            exId = Number(a.exencionesIds[0]);
          } else if (Array.isArray(a.exenciones) && a.exenciones.length > 0) {
            exId = Number(a.exenciones[0]?.exencionId || a.exenciones[0]?.id || a.exenciones[0]);
          } else if (Array.isArray(a.actosExenciones) && a.actosExenciones.length > 0) {
            exId = Number(a.actosExenciones[0]?.exencionId || a.actosExenciones[0]?.id);
          }

          let exNombre: string | null = a.exencionNombre || null;
          if (!exNombre && Array.isArray(a.exenciones) && a.exenciones.length > 0) {
            exNombre = a.exenciones[0]?.exencionNombre || a.exenciones[0]?.nombre || null;
          }
          if (!exNombre && Array.isArray(a.actosExenciones) && a.actosExenciones.length > 0) {
            exNombre = a.actosExenciones[0]?.exencionNombre || a.actosExenciones[0]?.exencion?.nombre || null;
          }
          if (!exNombre && exId) {
            const exList = (this.exencionesFacade.exenciones() as any[]) || [];
            const exFound = exList.find((e: any) => e.id === exId);
            if (exFound) {
              exNombre = exFound.nombre;
            } else {
              exNombre = `Exención #${exId}`;
            }
          }

          // 2. Extraer Intervinientes de forma tolerante
          const rawIntvs = Array.isArray(a.intervinientes) ? a.intervinientes : (a.intervinientesActo || a.actoIntervinientes || []);
          const intervinientesMapped = rawIntvs.map((i: any) => {
            const contrib = i.contribuyente || {};
            const contribId = Number(contrib.id || i.contribuyenteId || i.idContribuyente || 0);
            const contribNombre = contrib.nombre || contrib.nombreCompleto || contrib.razonSocial || i.contribuyenteNombre || i.nombre || 'Desconocido';
            const contribDoc = contrib.numeroIdentificacion || contrib.documento || i.numeroIdentificacion || i.documento || '';
            const rolId = Number(i.rolIntervinienteId || i.rolId || i.idRol || 0);
            const rolNombre = i.rolIntervinienteNombre || i.rolNombre || i.nombreRol || i.rol?.nombre || 'Rol Desconocido';
            const porcentaje = Number(i.porcentajeParticipacion ?? i.porcentaje ?? i.porcentajeParticipacionActo ?? 100);

            return {
              idTemp: (i.id || Math.random()).toString(),
              contribuyenteId: contribId,
              nombre: contribNombre,
              documento: contribDoc,
              rolId: rolId,
              rolNombre: rolNombre,
              porcentaje: porcentaje
            };
          });

          return {
            idTemp: a.id ? a.id.toString() : Math.random().toString(),
            tipoActoId: Number(a.tipoActoRegistroId || a.tipoActoId),
            tipoActoCodigo: a.tipoActoCodigo || '',
            tipoActoNombre: a.tipoActoRegistroNombre || a.tipoActoNombre || 'Acto Registrado',
            categoriaNombre: a.categoriaNombre || '',
            naturalezaNombre: a.naturalezaNombre || '',
            tarifaInfo: a.tarifaInfo || '',
            valorActo: Number(a.valorActo || 0),
            baseDeclarada: Number(a.baseDeclarada || 0),
            inmuebleId: a.inmuebleId ? Number(a.inmuebleId) : null,
            matriculaInmobiliaria: a.inmuebleMatricula || a.matriculaInmobiliaria || '',
            avaluoCatastral: Number(a.inmuebleAvaluo || a.avaluoCatastral || 0),
            exencionId: exId,
            exencionNombre: exNombre,
            intervinientes: intervinientesMapped
          };
        });

        this.actosExpediente.set(actosTemp);
      }
    }
  }
}
