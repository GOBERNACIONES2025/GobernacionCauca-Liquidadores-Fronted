import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { LiquidacionWizardService } from '../../../services/liquidacion-wizard.service';
import { EntidadesRegistroFacade } from '../../../../../../application/facades/Registro/entidades-registro.facade';
import { MunicipiosFacade } from '../../../../../../application/facades/Territorios/municipios.facade';

@Component({
  selector: 'app-step-documento',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './step-documento.html'
})
export class StepDocumentoComponent {
  wizardService = inject(LiquidacionWizardService);
  
  entidadesFacade = inject(EntidadesRegistroFacade);
  municipiosFacade = inject(MunicipiosFacade);

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.wizardService.documentoSoporteFile = file;
    } else {
      this.wizardService.documentoSoporteFile = null;
    }
  }

  continuar() {
    if (!this.wizardService.documentoSoporteFile) {
      // Idealmente mostraríamos un toast o alerta aquí
      alert('Debe adjuntar el documento soporte antes de continuar.');
      return;
    }

    if (this.wizardService.paso2Form.valid) {
      this.wizardService.currentStep.set(3);
    } else {
      this.wizardService.paso2Form.markAllAsTouched();
    }
  }

  retroceder() {
    this.wizardService.currentStep.set(1);
  }
}
