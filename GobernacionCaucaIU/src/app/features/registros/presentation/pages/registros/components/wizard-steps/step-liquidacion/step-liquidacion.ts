import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LiquidacionWizardService } from '../../../services/liquidacion-wizard.service';
import { GeneracionLiquidacionFacade } from '../../../../../../application/facades/Liquidacion/generacion-liquidacion.facade';
import { ToastService } from '../../../../../../../../core/services/toast.service';

@Component({
  selector: 'app-step-liquidacion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './step-liquidacion.html'
})
export class StepLiquidacionComponent implements OnInit {
  wizardService = inject(LiquidacionWizardService);
  generacionFacade = inject(GeneracionLiquidacionFacade);
  toast = inject(ToastService);

  isGenerating = false;

  ngOnInit() {
    this.wizardService.calcularResumenEstimado();
  }

  retroceder() {
    this.wizardService.currentStep.set(3);
  }

  generarLiquidacionOficial() {
    this.isGenerating = true;
    
    // Simular llamada al backend y luego avanzar al paso 5 (Pago)
    setTimeout(() => {
      this.wizardService.liquidacionGeneradaExitosa.set(true);
      this.wizardService.idLiquidacionFinal.set(Math.floor(1000 + Math.random() * 9000));
      this.toast.success(`¡Liquidación generada con radicado ${this.wizardService.radicadoGenerado()}!`);
      this.isGenerating = false;
      this.wizardService.currentStep.set(5);
    }, 1500);
  }
}
