import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LiquidacionWizardService } from '../../../services/liquidacion-wizard.service';
import { GeneracionLiquidacionFacade } from '../../../../../../application/facades/Liquidacion/generacion-liquidacion.facade';
import { SolicitudesLiquidacionFacade } from '../../../../../../application/facades/Radicacion/solicitudes-liquidacion.facade';
import { ToastService } from '../../../../../../../../core/services/toast.service';
import { concatMap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-step-liquidacion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './step-liquidacion.html'
})
export class StepLiquidacionComponent implements OnInit {
  wizardService = inject(LiquidacionWizardService);
  generacionFacade = inject(GeneracionLiquidacionFacade);
  solicitudesFacade = inject(SolicitudesLiquidacionFacade);
  toast = inject(ToastService);
  router = inject(Router);

  isGenerating = signal<boolean>(false);
  isSimulating = signal<boolean>(false);
  isCompleting = signal<boolean>(false);

  ngOnInit() {
    this.completarYSimular();
  }

  private completarYSimular() {
    const solicitudId = this.wizardService.solicitudId();
    if (!solicitudId) {
      this.toast.error('No se encontró la solicitud.');
      return;
    }

    this.isCompleting.set(true);
    // Primero completamos la solicitud (marca etapa 5 y valida)
    this.solicitudesFacade.completarSolicitud(solicitudId).pipe(
      concatMap(res => {
        if (res.success) {
          this.wizardService.etapaGuardada.set(5);
          this.isSimulating.set(true);
          // Luego simulamos para mostrar los totales
          return this.generacionFacade.simularLiquidacion({ solicitudId });
        } else {
          this.toast.error(res.message || 'Error al completar la solicitud');
          return of(null);
        }
      })
    ).subscribe({
      next: (simRes) => {
        if (simRes && simRes.success && simRes.data) {
          this.wizardService.liquidacionSimulada.set(simRes.data);
        } else if (simRes && !simRes.success) {
          this.toast.error(simRes.message || 'Error al simular la liquidación');
        }
        this.isCompleting.set(false);
        this.isSimulating.set(false);
      },
      error: (err) => {
        this.toast.error('Error del servidor en el proceso');
        this.isCompleting.set(false);
        this.isSimulating.set(false);
      }
    });
  }

  retroceder() {
    this.wizardService.currentStep.set(3);
  }

  generarLiquidacionOficial() {
    const solicitudId = this.wizardService.solicitudId();
    if (!solicitudId) {
      this.toast.error('No hay solicitud para liquidar.');
      return;
    }

    this.isGenerating.set(true);
    this.generacionFacade.generarLiquidacion({ solicitudId }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.wizardService.liquidacionGeneradaExitosa.set(true);
          this.wizardService.idLiquidacionFinal.set(res.data);
          this.toast.success(`¡Liquidación generada con radicado ${this.wizardService.radicadoGenerado()}!`);
          
          // En lugar de navegar, mantenemos al usuario en el componente para que pueda descargar el PDF
          // this.router.navigate(['/liquidaciones']);
        } else {
          this.toast.error(res.message || 'Error al generar liquidación');
        }
        this.isGenerating.set(false);
      },
      error: (err) => {
        this.toast.error('Error de servidor al generar liquidación oficial');
        this.isGenerating.set(false);
      }
    });
  }

  descargarLiquidacion() {
    const id = this.wizardService.idLiquidacionFinal();
    if (!id) return;
    
    this.isGenerating.set(true);
    this.generacionFacade.descargarPdf(id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Liquidacion_${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        this.toast.success('Descarga iniciada');
        this.isGenerating.set(false);
      },
      error: () => {
        this.toast.error('Error al descargar el PDF');
        this.isGenerating.set(false);
      }
    });
  }

  irABandeja() {
    this.router.navigate(['/registros/liquidaciones']);
  }
}
