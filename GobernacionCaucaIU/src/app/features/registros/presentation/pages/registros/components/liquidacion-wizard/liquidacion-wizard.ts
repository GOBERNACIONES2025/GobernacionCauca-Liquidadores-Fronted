import { Component, inject, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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

  ngOnInit() {
    // Precargar todos los catálogos necesarios para los combos del wizard (100 registros por defecto)
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

  steps = [
    { id: 1, name: 'Radicación' },
    { id: 2, name: 'Documento' },
    { id: 3, name: 'Actos' },
    { id: 4, name: 'Liquidación' },
    { id: 5, name: 'Pago' },
    { id: 6, name: 'Historial' }
  ];

  isCompleted(stepId: number): boolean {
    // Si estamos en un paso mayor, asumimos que los anteriores están completados
    return this.wizardService.currentStep() > stepId;
  }

  setStep(stepId: number) {
    // Solo permitir navegar a pasos ya completados o al inmediatamente siguiente
    // Por ahora para pruebas, permitimos navegar libremente hasta el step actual + 1
    if (stepId <= this.wizardService.currentStep()) {
      this.wizardService.currentStep.set(stepId);
    }
  }

  goBack() {
    this.cancel.emit();
  }
}
