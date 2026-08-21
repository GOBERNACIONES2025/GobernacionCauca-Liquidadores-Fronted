import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LiquidacionWizardService } from '../../../services/liquidacion-wizard.service';

@Component({
  selector: 'app-step-pago',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './step-pago.html'
})
export class StepPagoComponent {
  wizardService = inject(LiquidacionWizardService);

  get todayDate(): string {
    return new Date().toISOString().split('T')[0];
  }
  
  get vencimientoDate(): string {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  }

  finalizar() {
    // Terminar y volver a la lista (reset)
    this.wizardService.resetWizard();
    // Aquí el componente padre (registros.ts) debe cambiar viewMode a 'list'
    // Para simplificar, recargamos o emitimos evento en el padre
    window.location.reload(); // Solo para demo, en la vida real emitiríamos evento
  }
}
