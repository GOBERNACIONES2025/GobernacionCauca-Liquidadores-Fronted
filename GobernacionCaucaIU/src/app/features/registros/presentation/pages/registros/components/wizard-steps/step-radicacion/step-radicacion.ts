import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError, forkJoin } from 'rxjs';
import { concatMap, catchError } from 'rxjs/operators';
import { LiquidacionWizardService } from '../../../services/liquidacion-wizard.service';
import { ContribuyentesFacade } from '../../../../../../application/facades/Contribuyentes/contribuyentes.facade';
import { TiposPersonaFacade } from '../../../../../../application/facades/Contribuyentes/tipos-persona.facade';
import { TiposIdentificacionFacade } from '../../../../../../application/facades/Contribuyentes/tipos-identificacion.facade';
import { DepartamentosFacade } from '../../../../../../application/facades/Territorios/departamentos.facade';
import { VigenciasFacade } from '../../../../../../application/facades/Normatividad/vigencias.facade';
import { SolicitudesLiquidacionFacade } from '../../../../../../application/facades/Radicacion/solicitudes-liquidacion.facade';
import { ContribuyentesApiService } from '../../../../../../infrastructure/api/Contribuyentes/contribuyentes-api.service';
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
  contribuyentesApi = inject(ContribuyentesApiService);
  toastService = inject(ToastService);
  
  modoCreacion = false;
  busquedaRealizada = false;
  buscandoContribuyente = false;

  ngOnInit() {
    this.vigenciasFacade.cargarVigencias(1, 100);
    this.tiposPersonaFacade.cargarTiposPersona();
    this.tiposIdentificacionFacade.cargarTiposIdentificacion();
    this.deptFacade.cargarDepartamentos(1, 100);
  }

  buscarContribuyente() {
    const numDoc = this.wizardService.paso1Form.get('numeroIdentificacion')?.value?.trim();
    if (!numDoc) return;

    this.busquedaRealizada = true;
    this.buscandoContribuyente = true;

    this.contribuyentesApi.obtenerTodos(1, 10, numDoc).subscribe({
      next: (res: any) => {
        this.buscandoContribuyente = false;
        const raw = res?.data;
        const items: any[] = Array.isArray(raw) ? raw : (raw?.items || []);
        
        const cleanDoc = numDoc.trim().toLowerCase();
        const encontrado = items.find((c: any) => 
          String(c.numeroIdentificacion || c.numeroDocumento || c.documento || c.identificacion || '').trim().toLowerCase() === cleanDoc
        );

        if (encontrado) {
          this.modoCreacion = false;
          this.wizardService.paso1Form.patchValue({
            contribuyenteId: encontrado.id,
            tipoPersonaId: encontrado.tipoPersonaId ?? encontrado.tipoPersona?.id,
            tipoIdentificacionId: encontrado.tipoIdentificacionId ?? encontrado.tipoIdentificacion?.id,
            numeroIdentificacion: encontrado.numeroIdentificacion || numDoc,
            nombre: encontrado.nombre || encontrado.nombreCompleto || encontrado.razonSocial,
            email: encontrado.email,
            telefono: encontrado.telefono,
            direccion: encontrado.direccion
          });
          this.wizardService.paso1Form.markAsDirty();
          this.toastService.success(`Contribuyente encontrado: ${encontrado.nombre || cleanDoc}`);
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
          this.wizardService.paso1Form.markAsDirty();
          this.toastService.info('Contribuyente no registrado. Diligencie los campos para crearlo.');
        }
      },
      error: () => {
        this.buscandoContribuyente = false;
        this.toastService.error('Error al consultar el contribuyente.');
      }
    });
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
    this.wizardService.paso1Form.markAsDirty();
  }

  onNumeroIdentificacionChange() {
    const currentId = this.wizardService.paso1Form.get('contribuyenteId')?.value;
    if (currentId) {
      this.wizardService.paso1Form.patchValue({ contribuyenteId: null });
      this.busquedaRealizada = false;
      this.modoCreacion = true;
      this.wizardService.paso1Form.markAsDirty();
    }
  }

  limpiarBusquedaContribuyente() {
    this.busquedaRealizada = false;
    this.modoCreacion = false;
    this.wizardService.paso1Form.patchValue({
      contribuyenteId: null,
      numeroIdentificacion: '',
      tipoPersonaId: null,
      tipoIdentificacionId: null,
      nombre: '',
      email: '',
      telefono: '',
      direccion: ''
    });
    this.wizardService.paso1Form.markAsDirty();
  }

  continuar() {
    if (this.wizardService.esSoloLectura()) {
      this.wizardService.currentStep.set(2);
      return;
    }

    if (this.wizardService.etapaGuardada() >= 1 && !this.wizardService.paso1Form.dirty) {
      this.wizardService.currentStep.set(2);
      return;
    }

    if (this.wizardService.paso1Form.valid) {
      const formValue = this.wizardService.paso1Form.value;
      
      const crearDto = {
        numeroRadicado: formValue.numeroRadicado,
        vigenciaId: formValue.vigenciaFiscal,
        departamentoId: formValue.departamentoId,
        fechaRadicacion: formValue.fechaRadicado,
        observacion: formValue.observacionRadicacion || ''
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

      // Si ya hay solicitudId, actualizamos contribuyente y radicado
      if (this.wizardService.solicitudId()) {
        const id = this.wizardService.solicitudId()!;
        const radicadoDto = {
          numeroRadicado: formValue.numeroRadicado,
          vigenciaId: formValue.vigenciaFiscal,
          departamentoId: formValue.departamentoId,
          fechaRadicacion: formValue.fechaRadicado,
          observacion: formValue.observacionRadicacion || ''
        };

        this.solicitudesFacade.actualizarRadicado(id, radicadoDto).pipe(
          concatMap(() => this.solicitudesFacade.registrarContribuyente(id, contribuyenteDto))
        ).subscribe({
          next: () => {
            this.wizardService.currentStep.set(2);
            this.wizardService.etapaGuardada.set(Math.max(this.wizardService.etapaGuardada(), 1));
            this.wizardService.vigenciaFiscal.set(formValue.vigenciaFiscal);
            this.toastService.success('Datos actualizados correctamente');
          },
          error: (err) => {
            if (err?.error?.status === 409 || err?.status === 409) {
              this.toastService.error('El registro fue modificado. Por favor recarga e intenta de nuevo.');
            } else {
              this.toastService.error('Error al actualizar los datos');
            }
          }
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
            this.wizardService.vigenciaFiscal.set(formValue.vigenciaFiscal);
            this.toastService.success('Radicación y contribuyente guardados');
          }
        }
      });

    } else {
      this.wizardService.paso1Form.markAllAsTouched();
    }
  }
}
