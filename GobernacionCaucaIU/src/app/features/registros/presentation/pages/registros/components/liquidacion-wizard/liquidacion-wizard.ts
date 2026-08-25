import { Component, inject, Output, EventEmitter, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { LiquidacionWizardService } from '../../services/liquidacion-wizard.service';
import { StepRadicacionComponent } from '../wizard-steps/step-radicacion/step-radicacion';
import { StepDocumentoComponent } from '../wizard-steps/step-documento/step-documento';
import { StepActosComponent } from '../wizard-steps/step-actos/step-actos';
import { StepLiquidacionComponent } from '../wizard-steps/step-liquidacion/step-liquidacion';
import { StepPagoComponent } from '../wizard-steps/step-pago/step-pago';

// Facades
import { TiposPersonaFacade } from '../../../../../application/facades/Contribuyentes/tipos-persona.facade';
import { TiposIdentificacionFacade } from '../../../../../application/facades/Contribuyentes/tipos-identificacion.facade';
import { ContribuyentesFacade } from '../../../../../application/facades/Contribuyentes/contribuyentes.facade';
import { EntidadesRegistroFacade } from '../../../../../application/facades/Registro/entidades-registro.facade';
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
    StepLiquidacionComponent, 
    StepPagoComponent
  ],
  templateUrl: './liquidacion-wizard.html'
})
export class LiquidacionWizardComponent implements OnInit {
  wizardService = inject(LiquidacionWizardService);
  route = inject(ActivatedRoute);
  solicitudesFacade = inject(SolicitudesLiquidacionFacade);
  toast = inject(ToastService);
  
  // Inyectar facades para precargar los catálogos
  tpFacade = inject(TiposPersonaFacade);
  tiFacade = inject(TiposIdentificacionFacade);
  cFacade = inject(ContribuyentesFacade);
  erFacade = inject(EntidadesRegistroFacade);
  mFacade = inject(MunicipiosFacade);
  dFacade = inject(DepartamentosFacade);
  taFacade = inject(TiposActoRegistroFacade);
  exFacade = inject(ExencionesFacade);
  riFacade = inject(RolesIntervinienteFacade);
  
  @Output() cancel = new EventEmitter<void>();

  isLoading = signal<boolean>(false);

  ngOnInit() {
    this.precargarCatalogos();
    
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

  steps = [
    { id: 1, name: 'Radicación' },
    { id: 2, name: 'Documento' },
    { id: 3, name: 'Actos' },
    { id: 4, name: 'Liquidación' },
    { id: 5, name: 'Pago' },
    { id: 6, name: 'Historial' }
  ];

  isCompleted(stepId: number): boolean {
    return this.wizardService.etapaGuardada() >= stepId || this.wizardService.currentStep() > stepId;
  }

  setStep(stepId: number) {
    // Solo permitir navegar a pasos ya completados o al inmediatamente siguiente
    if (stepId <= this.wizardService.etapaGuardada() + 1) {
      this.wizardService.currentStep.set(stepId);
    }
  }

  goBack() {
    this.cancel.emit();
  }
}
