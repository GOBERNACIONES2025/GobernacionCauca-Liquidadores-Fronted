import { Injectable, inject, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

export interface IntervinienteTemp {
  idTemp: string;
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
  radicadoGenerado = signal<string>('RAD-2025-' + Math.floor(100000 + Math.random() * 900000));
  fechaRadicado = signal<string>(new Date().toISOString().split('T')[0]);
  vigenciaFiscal = signal<number>(2025);
  departamentoNombre = signal<string>('Cundinamarca'); // Se ajustó a Cundinamarca por la imagen
  
  // ===================== FORMULARIOS =====================

  // Paso 1: Radicación & Contribuyente
  paso1Form: FormGroup = this.fb.group({
    contribuyenteId: [null as number | null],
    tipoPersonaId: [1, Validators.required],
    tipoIdentificacionId: [1, Validators.required],
    numeroIdentificacion: ['', Validators.required],
    nombre: ['', Validators.required],
    email: [''],
    telefono: [''],
    direccion: [''],
    
    // Datos de radicación
    numeroRadicado: ['RAD-2025-' + Math.floor(100000 + Math.random() * 900000), Validators.required],
    fechaRadicado: [new Date().toISOString().split('T')[0], Validators.required],
    vigenciaFiscal: [new Date().getFullYear(), [Validators.required, Validators.min(1900)]],
    departamentoId: [1, Validators.required],
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
  resumenCalculo = signal<{
    totalBaseGravable: number;
    totalImpuesto: number;
    totalExencion: number;
    totalPagar: number;
  } | null>(null);

  // MÉTODOS DE UTILIDAD
  
  calcularResumenEstimado() {
    let totalBase = 0;
    let totalImp = 0;
    let totalExen = 0;

    this.actosExpediente().forEach(a => {
      const base = a.baseDeclarada || a.valorActo || 0;
      totalBase += base;
      const imp = Math.round(base * 0.01);
      totalImp += imp;
      if (a.exencionId) {
        totalExen += Math.round(imp * 0.5);
      }
    });

    const totalPagar = Math.max(0, totalImp - totalExen);
    this.resumenCalculo.set({
      totalBaseGravable: totalBase,
      totalImpuesto: totalImp,
      totalExencion: totalExen,
      totalPagar: totalPagar
    });
  }

  resetWizard() {
    this.currentStep.set(1);
    this.radicadoGenerado.set('RAD-2025-' + Math.floor(100000 + Math.random() * 900000));
    
    this.paso1Form.reset({
      contribuyenteId: null,
      tipoPersonaId: 1,
      tipoIdentificacionId: 1,
      numeroIdentificacion: '',
      nombre: '',
      email: '',
      telefono: '',
      direccion: '',
      numeroRadicado: 'RAD-2025-' + Math.floor(100000 + Math.random() * 900000),
      fechaRadicado: new Date().toISOString().split('T')[0],
      vigenciaFiscal: new Date().getFullYear(),
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
    this.resumenCalculo.set(null);
  }
}
