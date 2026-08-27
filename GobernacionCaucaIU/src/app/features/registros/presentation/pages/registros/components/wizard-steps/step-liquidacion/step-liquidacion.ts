import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LiquidacionWizardService } from '../../../services/liquidacion-wizard.service';
import { GeneracionLiquidacionFacade } from '../../../../../../application/facades/Liquidacion/generacion-liquidacion.facade';
import { SolicitudesLiquidacionFacade } from '../../../../../../application/facades/Radicacion/solicitudes-liquidacion.facade';
import { ToastService } from '../../../../../../../../core/services/toast.service';
import { concatMap, finalize } from 'rxjs/operators';
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
    // Si ya tenemos la simulación o ya está generada, no volvemos a simular
    if (!this.wizardService.liquidacionSimulada() && !this.wizardService.liquidacionGeneradaExitosa()) {
      this.cargarSimulacion();
    }
  }

  cargarSimulacion() {
    const solicitudId = this.wizardService.solicitudId();
    if (!solicitudId) return;

    this.isSimulating.set(true);
    const form1 = this.wizardService.paso1Form.value;
    const payloadSimulacion = {
      radicacion: {
        numeroRadicado: form1.numeroRadicado,
        fechaRadicacion: form1.fechaRadicado,
        vigenciaId: form1.vigenciaFiscal,
        departamentoId: form1.departamentoId,
        observacion: form1.observacionRadicacion
      },
      actos: this.wizardService.actosExpediente().map(a => ({
        tipoActoRegistroId: a.tipoActoId,
        valorActo: a.valorActo,
        baseDeclarada: a.baseDeclarada,
        inmuebleId: a.inmuebleId || null,
        exencionesIds: a.exencionId ? [a.exencionId] : [],
        intervinientes: (a.intervinientes || []).map(inv => ({
          contribuyenteId: inv.contribuyenteId,
          rolIntervinienteId: inv.rolId,
          porcentajeParticipacion: inv.porcentaje
        }))
      }))
    };

    this.generacionFacade.simularLiquidacion(payloadSimulacion).pipe(
      finalize(() => this.isSimulating.set(false))
    ).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.wizardService.liquidacionSimulada.set(res.data);
        } else {
          this.toast.error(res.message || 'Error al simular la liquidación');
        }
      },
      error: (err: any) => {
        this.toast.error('Error de servidor al simular liquidación');
      }
    });
  }

  retroceder() {
    this.wizardService.currentStep.set(4);
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
          this.wizardService.estadoSolicitudId.set(4); // 4: LIQUIDADA
          this.wizardService.estadoSolicitudNombre.set('Liquidada');
          this.wizardService.etapaGuardada.set(5);
          this.toast.success(`¡Liquidación oficial generada exitosamente con radicado ${this.wizardService.radicadoGenerado()}!`);
        } else {
          this.toast.error(res.message || 'Error al generar liquidación');
        }
        this.isGenerating.set(false);
      },
      error: (err) => {
        const errorMsg = err?.error?.message || err?.error?.detail || 'Error de servidor al generar liquidación oficial';
        this.toast.error(errorMsg);
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
