import { Injectable, inject, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LiquidacionSimuladaResponse } from '../../../../domain/models/Liquidacion/liquidacion-simulada.model';

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

  // Estado visual
  currentStep = signal<number>(1);
  
  // Datos fijos/temporales de la sesión
  solicitudId = signal<number | null>(null);
  etapaGuardada = signal<number>(0);
  radicadoGenerado = signal<string>('');
  fechaRadicado = signal<string>(new Date().toISOString().split('T')[0]);
  vigenciaFiscal = signal<number | null>(null);
  
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
    valorActo: [0, [Validators.required, Validators.min(0)]],
    baseDeclarada: [0, [Validators.required, Validators.min(0)]],
    matriculaInmobiliaria: [''],
    avaluoCatastral: [0],
    exencionId: [null as number | null]
  });

  intervinienteForm: FormGroup = this.fb.group({
    nombre: ['', Validators.required],
    documento: ['', Validators.required],
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
  }
  cargarDatosDesdeSolicitud(solicitud: any) {
    this.solicitudId.set(solicitud.solicitudId);
    this.etapaGuardada.set(solicitud.etapaActual);
    this.radicadoGenerado.set(solicitud.numeroRadicado);
    
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

      if (doc.nombreArchivo) {
        this.documentoSoporteNombre.set(doc.nombreArchivo);
      }
      
      // Poblar Actos
      if (doc.actos && doc.actos.length > 0) {
        const actosTemp = doc.actos.map((a: any) => ({
          idTemp: a.id.toString(), // Usamos el ID del backend como ID temporal para mantener la referencia
          tipoActoId: a.tipoActoRegistroId,
          tipoActoCodigo: '', // Se podría buscar del facade si hace falta
          tipoActoNombre: 'Acto Cargado', // Idealmente el backend debería mandar los nombres
          categoriaNombre: '',
          naturalezaNombre: '',
          tarifaInfo: '',
          valorActo: a.valorActo,
          baseDeclarada: a.baseDeclarada,
          matriculaInmobiliaria: '', // El backend usa inmuebleId, habría que adaptarlo si es string o num
          avaluoCatastral: 0,
          exencionId: null, // Asignar si viene en el DTO
          exencionNombre: null,
          intervinientes: a.intervinientes ? a.intervinientes.map((i: any) => ({
            idTemp: i.id.toString(),
            contribuyenteId: i.contribuyente.id,
            nombre: i.contribuyente.nombre,
            documento: i.contribuyente.numeroIdentificacion,
            rolId: i.rolIntervinienteId,
            rolNombre: 'Rol', // Idealmente el backend debe mandar el nombre
            porcentaje: i.porcentajeParticipacion
          })) : []
        }));
        
        this.actosExpediente.set(actosTemp);
      }
    }
  }
}
