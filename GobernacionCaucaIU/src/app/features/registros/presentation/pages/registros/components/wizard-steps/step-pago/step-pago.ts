import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LiquidacionWizardService } from '../../../services/liquidacion-wizard.service';
import { GeneracionLiquidacionFacade } from '../../../../../../application/facades/Liquidacion/generacion-liquidacion.facade';
import { ToastService } from '../../../../../../../../core/services/toast.service';

@Component({
  selector: 'app-step-pago',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './step-pago.html'
})
export class StepPagoComponent {
  wizardService = inject(LiquidacionWizardService);
  facade = inject(GeneracionLiquidacionFacade);
  toast = inject(ToastService);

  get todayDate(): string {
    return new Date().toISOString().split('T')[0];
  }
  
  get vencimientoDate(): string {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  }

  descargarLiquidacionPdf() {
    const id = this.wizardService.idLiquidacionFinal();
    if (!id) return;
    
    this.facade.descargarPdf(id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Liquidacion_${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      },
      error: (err) => {
        this.toast.error('Error al descargar el PDF de la liquidación.');
      }
    });
  }

  finalizar() {
    this.wizardService.resetWizard();
    window.location.reload(); 
  }
}
