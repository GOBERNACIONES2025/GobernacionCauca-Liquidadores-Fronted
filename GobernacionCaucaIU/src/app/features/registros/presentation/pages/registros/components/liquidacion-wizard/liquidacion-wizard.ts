import { Component, inject, Output, EventEmitter, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { LiquidacionWizardService } from '../../services/liquidacion-wizard.service';
import { StepRadicacionComponent } from '../wizard-steps/step-radicacion/step-radicacion';
import { StepDocumentoComponent } from '../wizard-steps/step-documento/step-documento';
import { StepActosComponent } from '../wizard-steps/step-actos/step-actos';
import { StepIntervinientesComponent } from '../wizard-steps/step-intervinientes/step-intervinientes';
import { StepLiquidacionComponent } from '../wizard-steps/step-liquidacion/step-liquidacion';
// Facades
import { TiposPersonaFacade } from '../../../../../application/facades/Contribuyentes/tipos-persona.facade';
import { TiposIdentificacionFacade } from '../../../../../application/facades/Contribuyentes/tipos-identificacion.facade';
import { ContribuyentesFacade } from '../../../../../application/facades/Contribuyentes/contribuyentes.facade';
import { EntidadesRegistroFacade } from '../../../../../application/facades/Registro/entidades-registro.facade';
import { TiposEntidadRegistroFacade } from '../../../../../application/facades/Registro/tipos-entidad-registro.facade';
import { CategoriasActoFacade } from '../../../../../application/facades/Registro/categorias-acto.facade';
import { MunicipiosFacade } from '../../../../../application/facades/Territorios/municipios.facade';
import { DepartamentosFacade } from '../../../../../application/facades/Territorios/departamentos.facade';
import { TiposActoRegistroFacade } from '../../../../../application/facades/Registro/tipos-acto-registro.facade';
import { ExencionesFacade } from '../../../../../application/facades/Exenciones/exenciones.facade';
import { RolesIntervinienteFacade } from '../../../../../application/facades/Intervinientes/roles-interviniente.facade';
import { SolicitudesLiquidacionFacade } from '../../../../../application/facades/Radicacion/solicitudes-liquidacion.facade';
import { ToastService } from '../../../../../../../core/services/toast.service';

@Component({
  selector: 'app-liquidacion-wizard',
  standalone: true,
  imports: [
    CommonModule, 
    StepRadicacionComponent, 
    StepDocumentoComponent, 
    StepActosComponent, 
    StepIntervinientesComponent,
    StepLiquidacionComponent
  ],
  templateUrl: './liquidacion-wizard.html'
})
export class LiquidacionWizardComponent implements OnInit {
  wizardService = inject(LiquidacionWizardService);
  route = inject(ActivatedRoute);
  router = inject(Router);
  solicitudesFacade = inject(SolicitudesLiquidacionFacade);
  toast = inject(ToastService);
  
  // Inyectar facades para precargar los catálogos
  tpFacade = inject(TiposPersonaFacade);
  tiFacade = inject(TiposIdentificacionFacade);
  cFacade = inject(ContribuyentesFacade);
  erFacade = inject(EntidadesRegistroFacade);
  teFacade = inject(TiposEntidadRegistroFacade);
  caFacade = inject(CategoriasActoFacade);
  mFacade = inject(MunicipiosFacade);
  dFacade = inject(DepartamentosFacade);
  taFacade = inject(TiposActoRegistroFacade);
  exFacade = inject(ExencionesFacade);
  riFacade = inject(RolesIntervinienteFacade);
  
  @Output() cancel = new EventEmitter<void>();

  isLoading = signal<boolean>(false);

  ngOnInit() {
    this.precargarCatalogos();
    
    // Capturar query params (modo reliquidación y metadatos)
    this.route.queryParamMap.subscribe(qParams => {
      const modo = qParams.get('modo');
      if (modo === 'reliquidacion') {
        this.wizardService.modoReliquidacion.set(true);
        this.wizardService.tipoTramite.set('Reliquidacion');
        this.wizardService.liquidacionGeneradaExitosa.set(false);

        const liqId = qParams.get('liquidacionId');
        if (liqId) this.wizardService.reliquidacionLiquidacionId.set(Number(liqId));

        const causalId = qParams.get('causalId');
        if (causalId) this.wizardService.reliquidacionCausalId.set(Number(causalId));

        const motivo = qParams.get('motivo');
        if (motivo) this.wizardService.reliquidacionMotivo.set(motivo);

        const doc = qParams.get('doc');
        if (doc) {
          this.wizardService.reliquidacionDoc.set(doc);
          this.wizardService.paso2Form.patchValue({ numeroDocumento: doc });
        }

        const fechaDoc = qParams.get('fechaDoc');
        if (fechaDoc) {
          this.wizardService.reliquidacionFechaDoc.set(fechaDoc);
          this.wizardService.paso2Form.patchValue({ fechaDocumento: fechaDoc });
        }

        const archivoNombre = qParams.get('archivoNombre');
        if (archivoNombre) {
          this.wizardService.documentoSoporteNombre.set(archivoNombre);
        }
      }
    });

    // Verificar si hay un ID en la ruta
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.cargarSolicitud(Number(id));
      } else {
        this.wizardService.resetWizard();
      }
    });
  }

  private precargarCatalogos() {
    this.tpFacade.cargarTiposPersona(1, 100);
    this.tiFacade.cargarTiposIdentificacion(1, 100);
    this.cFacade.cargarContribuyentes(1, 100);
    this.erFacade.cargarEntidadesRegistro(1, 100);
    this.teFacade.cargarTiposEntidadRegistro(1, 100);
    this.caFacade.cargarCategoriasActo(1, 100);
    this.mFacade.cargarMunicipios(1, 100);
    this.dFacade.cargarDepartamentos(1, 100);
    this.taFacade.cargarTiposActoRegistro(1, 100);
    this.exFacade.cargarExenciones(1, 100);
    this.riFacade.cargarRolesInterviniente(1, 100);
  }

  private cargarSolicitud(id: number) {
    this.isLoading.set(true);
    this.solicitudesFacade.obtenerSolicitudPorId(id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.wizardService.cargarDatosDesdeSolicitud(res.data);
        } else {
          this.toast.error(res.message || 'Error al cargar la solicitud');
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.toast.error('Error de red al cargar la solicitud');
        this.isLoading.set(false);
      }
    });
  }

  showCancelModal = signal<boolean>(false);

  steps = [
    { id: 1, name: 'Radicación' },
    { id: 2, name: 'Documento' },
    { id: 3, name: 'Actos' },
    { id: 4, name: 'Intervinientes' },
    { id: 5, name: 'Liquidación' }
  ];

  isCompleted(stepId: number): boolean {
    return this.wizardService.etapaGuardada() >= stepId || this.wizardService.currentStep() > stepId;
  }

  setStep(stepId: number) {
    if (this.wizardService.modoReliquidacion()) {
      this.wizardService.currentStep.set(stepId);
      return;
    }

    const isLectura = this.wizardService.esSoloLectura();
    const isTramiteNormal = this.wizardService.tipoTramite() === 'Liquidacion';
    if (isLectura && isTramiteNormal && stepId !== 5) {
      return;
    }

    // Solo permitir navegar a pasos ya completados o al inmediatamente siguiente
    if (stepId <= this.wizardService.etapaGuardada() + 1) {
      this.wizardService.currentStep.set(stepId);
    }
  }

  onHeaderBack() {
    if (this.wizardService.currentStep() > 1) {
      this.wizardService.currentStep.update(s => s - 1);
    } else {
      this.abrirModalCancelacion();
    }
  }

  onHeaderClose() {
    this.abrirModalCancelacion();
  }

  abrirModalCancelacion() {
    // Si no se ha modificado nada crítico o ya está guardado, salir directo
    const isDirty = this.wizardService.paso1Form.dirty || this.wizardService.paso2Form.dirty;
    if (isDirty) {
      this.showCancelModal.set(true);
    } else {
      this.goBack();
    }
  }

  cerrarModalCancelacion() {
    this.showCancelModal.set(false);
  }

  confirmarCancelacion() {
    this.showCancelModal.set(false);
    this.wizardService.resetWizard();
    this.goBack();
  }

  goBack() {
    if (this.cancel.observed) {
      this.cancel.emit();
    } else {
      this.router.navigate(['/registros/entidades/solicitudes']);
    }
  }
}
