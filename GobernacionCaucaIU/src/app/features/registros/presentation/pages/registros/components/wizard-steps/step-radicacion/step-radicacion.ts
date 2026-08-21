import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { LiquidacionWizardService } from '../../../services/liquidacion-wizard.service';
import { ContribuyentesFacade } from '../../../../../../application/facades/Contribuyentes/contribuyentes.facade';
import { TiposPersonaFacade } from '../../../../../../application/facades/Contribuyentes/tipos-persona.facade';
import { TiposIdentificacionFacade } from '../../../../../../application/facades/Contribuyentes/tipos-identificacion.facade';
import { DepartamentosFacade } from '../../../../../../application/facades/Territorios/departamentos.facade';

@Component({
  selector: 'app-step-radicacion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './step-radicacion.html'
})
export class StepRadicacionComponent {
  wizardService = inject(LiquidacionWizardService);
  
  contribuyentesFacade = inject(ContribuyentesFacade);
  tiposPersonaFacade = inject(TiposPersonaFacade);
  tiposIdentificacionFacade = inject(TiposIdentificacionFacade);
  deptFacade = inject(DepartamentosFacade);
  
  // Nuevo estado para la creación
  modoCreacion = false;
  busquedaRealizada = false;

  buscarContribuyente() {
    const numDoc = this.wizardService.paso1Form.get('numeroIdentificacion')?.value?.trim();
    if (!numDoc) return;

    this.busquedaRealizada = true;
    const encontrado = (this.contribuyentesFacade.contribuyentes() as any[]).find((c: any) => c.numeroIdentificacion === numDoc);
    
    if (encontrado) {
      this.modoCreacion = false;
      this.wizardService.paso1Form.patchValue({
        contribuyenteId: encontrado.id,
        tipoPersonaId: encontrado.tipoPersonaId,
        tipoIdentificacionId: encontrado.tipoIdentificacionId,
        nombre: encontrado.nombre,
        email: encontrado.email,
        telefono: encontrado.telefono,
        direccion: encontrado.direccion
      });
    } else {
      // Si no se encuentra, habilitamos el modo creación y reseteamos campos pero mantenemos el número
      this.modoCreacion = true;
      this.wizardService.paso1Form.patchValue({
        contribuyenteId: null,
        tipoPersonaId: (this.tiposPersonaFacade.tiposPersona() as any[])[0]?.id || null,
        tipoIdentificacionId: (this.tiposIdentificacionFacade.tiposIdentificacion() as any[])[0]?.id || null,
        nombre: '',
        email: '',
        telefono: '',
        direccion: ''
      });
    }
  }

  habilitarCreacionManual() {
    this.busquedaRealizada = true;
    this.modoCreacion = true;
    this.wizardService.paso1Form.patchValue({
      contribuyenteId: null,
      nombre: '',
      email: '',
      telefono: '',
      direccion: ''
    });
  }

  continuar() {
    if (this.wizardService.paso1Form.valid) {
      this.wizardService.currentStep.set(2);
    } else {
      this.wizardService.paso1Form.markAllAsTouched();
    }
  }
}
