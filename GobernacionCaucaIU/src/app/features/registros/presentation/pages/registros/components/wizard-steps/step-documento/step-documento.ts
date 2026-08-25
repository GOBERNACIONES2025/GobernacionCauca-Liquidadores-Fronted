import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { LiquidacionWizardService } from '../../../services/liquidacion-wizard.service';
import { EntidadesRegistroFacade } from '../../../../../../application/facades/Registro/entidades-registro.facade';
import { MunicipiosFacade } from '../../../../../../application/facades/Territorios/municipios.facade';
import { SolicitudesLiquidacionFacade } from '../../../../../../application/facades/Radicacion/solicitudes-liquidacion.facade';
import { ToastService } from '../../../../../../../../core/services/toast.service';
import { RegistrarDocumentoDto } from '../../../../../../domain/models/Radicacion/solicitud-wizard.model';

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
  solicitudesFacade = inject(SolicitudesLiquidacionFacade);
  toastService = inject(ToastService);

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.wizardService.documentoSoporteFile = file;
    } else {
      this.wizardService.documentoSoporteFile = null;
    }
  }

  continuar() {
    const tieneArchivoPrevio = !!this.wizardService.documentoSoporteNombre();
    const tieneArchivoNuevo = !!this.wizardService.documentoSoporteFile;

    if (!tieneArchivoNuevo && !tieneArchivoPrevio && this.wizardService.etapaGuardada() < 2) {
      this.toastService.warning('Debe adjuntar el documento soporte antes de continuar.');
      return;
    }

    if (this.wizardService.paso2Form.valid) {
      const dto: RegistrarDocumentoDto = {
        numeroDocumento: this.wizardService.paso2Form.value.numeroDocumento,
        fechaDocumento: this.wizardService.paso2Form.value.fechaDocumento,
        entidadRegistroId: Number(this.wizardService.paso2Form.value.entidadRegistroId),
        municipioJurisdiccionId: Number(this.wizardService.paso2Form.value.municipioJurisdiccionId),
        descripcion: this.wizardService.paso2Form.value.descripcionDocumento
      };

      const solicitudId = this.wizardService.solicitudId();
      if (!solicitudId) {
        this.toastService.error('No se encontró el ID de la solicitud. Regrese al primer paso.');
        return;
      }

      this.solicitudesFacade.registrarDocumento(solicitudId, this.wizardService.documentoSoporteFile || null, dto).subscribe({
        next: (res) => {
          console.log('Respuesta exitosa de registrarDocumento:', res);
          if (res && res.success) {
            this.wizardService.currentStep.set(3);
            this.wizardService.etapaGuardada.set(Math.max(this.wizardService.etapaGuardada(), 2));
            this.toastService.success('Documento guardado exitosamente');
          } else {
            this.toastService.error((res as any)?.message || 'Error al guardar el documento');
          }
        },
        error: (err) => {
          console.error('Error del backend:', err);
          let errorMsg = 'Error al guardar el documento';
          if (err?.error?.errors) {
            const validationErrors = Object.values(err.error.errors).flat().join(', ');
            errorMsg = `Validación fallida: ${validationErrors}`;
          } else if (err?.error?.message || err?.error?.title) {
            errorMsg = err.error.message || err.error.title;
          }
          this.toastService.error(errorMsg);
        }
      });
    } else {
      this.toastService.warning('Por favor, complete todos los campos obligatorios del formulario.');
      this.wizardService.paso2Form.markAllAsTouched();
    }
  }

  retroceder() {
    this.wizardService.currentStep.set(1);
  }
}
