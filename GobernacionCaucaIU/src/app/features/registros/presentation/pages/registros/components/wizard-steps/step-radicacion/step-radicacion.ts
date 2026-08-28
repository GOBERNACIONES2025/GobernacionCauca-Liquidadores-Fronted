import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { concatMap, catchError } from 'rxjs/operators';
import { LiquidacionWizardService } from '../../../services/liquidacion-wizard.service';
import { ContribuyentesFacade } from '../../../../../../application/facades/Contribuyentes/contribuyentes.facade';
import { TiposPersonaFacade } from '../../../../../../application/facades/Contribuyentes/tipos-persona.facade';
import { TiposIdentificacionFacade } from '../../../../../../application/facades/Contribuyentes/tipos-identificacion.facade';
import { DepartamentosFacade } from '../../../../../../application/facades/Territorios/departamentos.facade';
import { VigenciasFacade } from '../../../../../../application/facades/Normatividad/vigencias.facade';
import { SolicitudesLiquidacionFacade } from '../../../../../../application/facades/Radicacion/solicitudes-liquidacion.facade';
import { ToastService } from '../../../../../../../../core/services/toast.service';

@Component({
  selector: 'app-step-radicacion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './step-radicacion.html'
})
export class StepRadicacionComponent implements OnInit {
  wizardService = inject(LiquidacionWizardService);
  
  contribuyentesFacade = inject(ContribuyentesFacade);
  tiposPersonaFacade = inject(TiposPersonaFacade);
  tiposIdentificacionFacade = inject(TiposIdentificacionFacade);
  deptFacade = inject(DepartamentosFacade);
  vigenciasFacade = inject(VigenciasFacade);
  solicitudesFacade = inject(SolicitudesLiquidacionFacade);
  toastService = inject(ToastService);
  
  modoCreacion = false;
  busquedaRealizada = false;

  ngOnInit() {
    this.vigenciasFacade.cargarVigencias(1, 100);
  }

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
      this.modoCreacion = true;
      this.wizardService.paso1Form.patchValue({
        contribuyenteId: null,
        tipoPersonaId: null,
        tipoIdentificacionId: null,
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
    if (this.wizardService.etapaGuardada() >= 1 && !this.wizardService.paso1Form.dirty) {
      this.wizardService.currentStep.set(2);
      return;
    }

    if (this.wizardService.paso1Form.valid) {
      const formValue = this.wizardService.paso1Form.value;
      
      const crearDto = {
        numeroRadicado: formValue.numeroRadicado,
        vigenciaId: formValue.vigenciaFiscal,
        departamentoId: formValue.departamentoId
      };
      
      const contribuyenteDto = {
        contribuyenteId: formValue.contribuyenteId,
        tipoPersonaId: formValue.tipoPersonaId,
        tipoIdentificacionId: formValue.tipoIdentificacionId,
        numeroIdentificacion: formValue.numeroIdentificacion,
        nombre: formValue.nombre,
        email: formValue.email,
        telefono: formValue.telefono,
        direccion: formValue.direccion
      };

      // Si ya hay solicitudId, solo actualizamos el contribuyente
      if (this.wizardService.solicitudId()) {
        this.solicitudesFacade.registrarContribuyente(this.wizardService.solicitudId()!, contribuyenteDto).subscribe({
          next: () => {
            this.wizardService.currentStep.set(2);
            this.wizardService.etapaGuardada.set(1);
          },
          error: (err) => this.toastService.error('Error al actualizar contribuyente')
        });
        return;
      }

      // Si no hay, creamos solicitud y luego registramos contribuyente
      this.solicitudesFacade.crearSolicitud(crearDto).pipe(
        concatMap(response => {
          if (response.success && response.data) {
            const newId = response.data;
            this.wizardService.solicitudId.set(newId);
            return this.solicitudesFacade.registrarContribuyente(newId, contribuyenteDto);
          }
          return throwError(() => new Error('Error al crear la solicitud'));
        }),
        catchError(err => {
          this.toastService.error('Error en el proceso de radicación');
          return throwError(() => err);
        })
      ).subscribe({
        next: (res) => {
          if (res.success) {
            this.wizardService.currentStep.set(2);
            this.wizardService.etapaGuardada.set(1);
            this.toastService.success('Radicación y contribuyente guardados');
          }
        }
      });

    } else {
      this.wizardService.paso1Form.markAllAsTouched();
    }
  }
}
