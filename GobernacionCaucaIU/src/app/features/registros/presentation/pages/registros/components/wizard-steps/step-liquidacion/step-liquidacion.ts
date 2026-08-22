import { Component, inject, OnInit, signal } from '@angular/core';
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

  isGenerating = signal<boolean>(false);
  isSimulating = signal<boolean>(false);

  ngOnInit() {
    this.simularLiquidacion();
  }

  private simularLiquidacion() {
    const dto = this.buildGenerarLiquidacionDto();
    this.isSimulating.set(true);
    this.generacionFacade.simularLiquidacion(dto).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.wizardService.liquidacionSimulada.set(res.data);
        } else {
          this.toast.error(res.message || 'Error al simular la liquidación');
        }
        this.isSimulating.set(false);
      },
      error: (err) => {
        this.toast.error('Error del servidor al simular liquidación');
        this.isSimulating.set(false);
      }
    });
  }

  private buildGenerarLiquidacionDto() {
    const p1 = this.wizardService.paso1Form.value;
    const p2 = this.wizardService.paso2Form.value;
    const actosTemp = this.wizardService.actosExpediente();

    return {
      contribuyente: {
        id: p1.contribuyenteId ? Number(p1.contribuyenteId) : null,
        tipoPersonaId: Number(p1.tipoPersonaId),
        tipoIdentificacionId: Number(p1.tipoIdentificacionId),
        numeroIdentificacion: p1.numeroIdentificacion,
        nombre: p1.nombre,
        email: p1.email,
        telefono: p1.telefono,
        direccion: p1.direccion
      },
      radicacion: {
        numeroRadicado: p1.numeroRadicado,
        fechaRadicacion: p1.fechaRadicado,
        vigenciaId: Number(p1.vigenciaFiscal),
        departamentoId: Number(p1.departamentoId),
        observacion: p1.observacionRadicacion
      },
      documento: {
        numeroDocumento: p2.numeroDocumento,
        fechaDocumento: p2.fechaDocumento,
        entidadRegistroId: Number(p2.entidadRegistroId),
        municipioJurisdiccionId: Number(p2.municipioJurisdiccionId),
        descripcion: p2.descripcionDocumento
      },
      actos: actosTemp.map(a => ({
        tipoActoRegistroId: a.tipoActoId,
        inmuebleId: null,
        valorActo: a.valorActo,
        baseDeclarada: a.baseDeclarada,
        exencionesIds: a.exencionId ? [a.exencionId] : [],
        intervinientes: a.intervinientes.map(i => {
          const isMain = i.documento === p1.numeroIdentificacion;
          const cId = i.contribuyenteId || (isMain ? p1.contribuyenteId : null);

          return {
            contribuyenteId: cId ? Number(cId) : null,
            contribuyenteNuevo: cId ? null : {
              id: null,
              tipoPersonaId: isMain ? Number(p1.tipoPersonaId) : 1,
              tipoIdentificacionId: isMain ? Number(p1.tipoIdentificacionId) : 1,
              numeroIdentificacion: i.documento,
              nombre: i.nombre,
              direccion: isMain ? p1.direccion : '',
              telefono: isMain ? p1.telefono : '',
              email: isMain ? p1.email : ''
            },
            rolIntervinienteId: i.rolId,
            porcentajeParticipacion: i.porcentaje
          };
        })
      }))
    };
  }

  retroceder() {
    this.wizardService.currentStep.set(3);
  }

  generarLiquidacionOficial() {
    if (!this.wizardService.documentoSoporteFile) {
      this.toast.error('El documento de soporte es requerido.');
      return;
    }

    this.isGenerating.set(true);
    const dto = this.buildGenerarLiquidacionDto();

    this.generacionFacade.generarLiquidacion(this.wizardService.documentoSoporteFile, dto).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.wizardService.liquidacionGeneradaExitosa.set(true);
          this.wizardService.idLiquidacionFinal.set(res.data);
          this.toast.success(`¡Liquidación generada con radicado ${this.wizardService.radicadoGenerado()}!`);
          this.wizardService.currentStep.set(5);
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
}
