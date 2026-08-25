import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { concatMap, catchError } from 'rxjs/operators';
import { LiquidacionWizardService, ActoTemp, IntervinienteTemp } from '../../../services/liquidacion-wizard.service';
import { TiposActoRegistroFacade } from '../../../../../../application/facades/Registro/tipos-acto-registro.facade';
import { ExencionesFacade } from '../../../../../../application/facades/Exenciones/exenciones.facade';
import { RolesIntervinienteFacade } from '../../../../../../application/facades/Intervinientes/roles-interviniente.facade';
import { SolicitudesLiquidacionFacade } from '../../../../../../application/facades/Radicacion/solicitudes-liquidacion.facade';
import { ToastService } from '../../../../../../../../core/services/toast.service';
import { ActoRegistradoDto, IntervinienteActoDto } from '../../../../../../domain/models/Radicacion/solicitud-wizard.model';

@Component({
  selector: 'app-step-actos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './step-actos.html'
})
export class StepActosComponent {
  wizardService = inject(LiquidacionWizardService);
  
  tiposActoFacade = inject(TiposActoRegistroFacade);
  exencionesFacade = inject(ExencionesFacade);
  rolesIntervinienteFacade = inject(RolesIntervinienteFacade);
  solicitudesFacade = inject(SolicitudesLiquidacionFacade);
  toastService = inject(ToastService);

  get selectedTipoActoDetalle() {
    const id = this.wizardService.actoForm.get('tipoActoRegistroId')?.value;
    if (!id) return null;
    return (this.tiposActoFacade.tiposActoRegistro() as any[]).find((t: any) => t.id === id) || null;
  }

  agregarInterviniente() {
    if (this.wizardService.intervinienteForm.valid) {
      const val = this.wizardService.intervinienteForm.value;
      const rolObj = (this.rolesIntervinienteFacade.rolesInterviniente() as any[]).find((r: any) => r.id === Number(val.rolId));

      const nuevo: IntervinienteTemp = {
        idTemp: Math.random().toString(),
        nombre: val.nombre,
        documento: val.documento,
        rolId: Number(val.rolId),
        rolNombre: rolObj?.nombre || 'Desconocido',
        porcentaje: Number(val.porcentaje)
      };

      this.wizardService.intervinientesActoActual.update(list => [...list, nuevo]);
      this.wizardService.intervinienteForm.reset({
        nombre: '',
        documento: '',
        rolId: null,
        porcentaje: 100
      });
    } else {
      this.wizardService.intervinienteForm.markAllAsTouched();
    }
  }

  eliminarInterviniente(idTemp: string) {
    this.wizardService.intervinientesActoActual.update(list => list.filter(i => i.idTemp !== idTemp));
  }

  guardarActoAlExpediente() {
    if (this.wizardService.actoForm.valid) {
      const val = this.wizardService.actoForm.value;
      const tipoActo = (this.tiposActoFacade.tiposActoRegistro() as any[]).find((t: any) => t.id === Number(val.tipoActoRegistroId));
      const exencion = (this.exencionesFacade.exenciones() as any[]).find((e: any) => e.id === Number(val.exencionId));

      const nuevoActo: ActoTemp = {
        idTemp: Math.random().toString(),
        tipoActoId: Number(val.tipoActoRegistroId),
        tipoActoCodigo: tipoActo?.codigo || '',
        tipoActoNombre: tipoActo?.nombre || '',
        categoriaNombre: tipoActo?.categoriaNaturalezaJuridica?.nombre || '',
        naturalezaNombre: tipoActo?.naturalezaJuridica?.nombre || '',
        tarifaInfo: '',
        valorActo: Number(val.valorActo),
        baseDeclarada: Number(val.baseDeclarada),
        matriculaInmobiliaria: val.matriculaInmobiliaria,
        avaluoCatastral: Number(val.avaluoCatastral),
        exencionId: val.exencionId ? Number(val.exencionId) : null,
        exencionNombre: exencion ? exencion.nombre : null,
        intervinientes: [...this.wizardService.intervinientesActoActual()]
      };

      this.wizardService.actosExpediente.update(list => [...list, nuevoActo]);
      this.wizardService.isAddingActo.set(false);
      this.wizardService.actoForm.reset({
        tipoActoRegistroId: null,
        valorActo: 0,
        baseDeclarada: 0,
        matriculaInmobiliaria: '',
        avaluoCatastral: 0,
        exencionId: null
      });
      this.wizardService.intervinientesActoActual.set([]);
    } else {
      this.wizardService.actoForm.markAllAsTouched();
    }
  }

  eliminarActoDelExpediente(idTemp: string) {
    this.wizardService.actosExpediente.update(list => list.filter(a => a.idTemp !== idTemp));
  }

  abrirFormularioNuevoActo() {
    this.wizardService.isAddingActo.set(true);
    const cNombre = this.wizardService.paso1Form.get('nombre')?.value;
    const cDoc = this.wizardService.paso1Form.get('numeroIdentificacion')?.value;
    const cId = this.wizardService.paso1Form.get('contribuyenteId')?.value;
    const defaultRol = (this.rolesIntervinienteFacade.rolesInterviniente() as any[])[0];
    if (cNombre && defaultRol) {
      this.wizardService.intervinientesActoActual.set([{
        idTemp: Math.random().toString(),
        contribuyenteId: cId ? Number(cId) : null,
        nombre: cNombre,
        documento: cDoc,
        rolId: defaultRol.id,
        rolNombre: defaultRol.nombre,
        porcentaje: 100
      }]);
    }
  }

  continuar() {
    if (this.wizardService.actosExpediente().length === 0) {
      this.toastService.warning('Debe registrar al menos un acto.');
      return;
    }

    const solicitudId = this.wizardService.solicitudId();
    if (!solicitudId) {
      this.toastService.error('No se encontró el ID de la solicitud. Regrese al primer paso.');
      return;
    }

    const actosPayload: ActoRegistradoDto[] = this.wizardService.actosExpediente().map(a => ({
      tipoActoRegistroId: a.tipoActoId,
      inmuebleId: null, // Si aplica
      valorActo: a.valorActo,
      baseDeclarada: a.baseDeclarada,
      observacion: null,
      exencionesIds: a.exencionId ? [a.exencionId] : []
    }));

    const todosIntervinientes = this.wizardService.actosExpediente().flatMap(a => a.intervinientes);
    const intervinientesPayload: IntervinienteActoDto[] = todosIntervinientes.map(i => ({
      contribuyenteId: i.contribuyenteId || null,
      contribuyenteNuevo: i.contribuyenteId ? null : {
        numeroIdentificacion: i.documento,
        nombre: i.nombre
      },
      rolIntervinienteId: i.rolId,
      porcentajeParticipacion: i.porcentaje
    }));

    this.solicitudesFacade.registrarActos(solicitudId, { actos: actosPayload }).pipe(
      concatMap(res => {
        if (res.success) {
          return this.solicitudesFacade.registrarIntervinientes(solicitudId, { intervinientes: intervinientesPayload });
        }
        return throwError(() => new Error('Error al registrar actos'));
      }),
      catchError(err => {
        this.toastService.error('Error al guardar actos e intervinientes. Intente de nuevo.');
        return throwError(() => err);
      })
    ).subscribe({
      next: (res) => {
        if (res.success) {
          this.wizardService.currentStep.set(4);
          this.wizardService.etapaGuardada.set(4);
          this.toastService.success('Actos e intervinientes guardados exitosamente');
        }
      }
    });
  }

  retroceder() {
    this.wizardService.currentStep.set(2);
  }
}
