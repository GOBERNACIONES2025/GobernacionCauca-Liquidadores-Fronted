import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { LiquidacionWizardService } from '../../../services/liquidacion-wizard.service';
import { ContribuyentesFacade } from '../../../../../../application/facades/Contribuyentes/contribuyentes.facade';
import { TiposPersonaFacade } from '../../../../../../application/facades/Contribuyentes/tipos-persona.facade';
import { TiposIdentificacionFacade } from '../../../../../../application/facades/Contribuyentes/tipos-identificacion.facade';
import { RolesIntervinienteFacade } from '../../../../../../application/facades/Intervinientes/roles-interviniente.facade';
import { SolicitudesLiquidacionFacade } from '../../../../../../application/facades/Radicacion/solicitudes-liquidacion.facade';
import { ToastService } from '../../../../../../../../core/services/toast.service';
import { IntervinienteActoDto } from '../../../../../../domain/models/Radicacion/solicitud-wizard.model';

@Component({
  selector: 'app-step-intervinientes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './step-intervinientes.html'
})
export class StepIntervinientesComponent implements OnInit {
  wizardService = inject(LiquidacionWizardService);
  contribuyentesFacade = inject(ContribuyentesFacade);
  tiposPersonaFacade = inject(TiposPersonaFacade);
  tiposIdentificacionFacade = inject(TiposIdentificacionFacade);
  rolesIntervinienteFacade = inject(RolesIntervinienteFacade);
  solicitudesFacade = inject(SolicitudesLiquidacionFacade);
  toastService = inject(ToastService);

  busquedaRealizada = false;

  ngOnInit() {
    this.contribuyentesFacade.cargarContribuyentes(1, 1000); // Cargar bastantes para buscar localmente
    this.tiposPersonaFacade.cargarTiposPersona();
    this.tiposIdentificacionFacade.cargarTiposIdentificacion();
    this.rolesIntervinienteFacade.cargarRolesInterviniente();
  }

  seleccionarActo(actoId: string) {
    this.wizardService.actoSeleccionadoId.set(actoId);
    this.resetearBusqueda();
  }

  buscarContribuyente() {
    if (!this.wizardService.intervinienteBusquedaForm.valid) {
      this.wizardService.intervinienteBusquedaForm.markAllAsTouched();
      return;
    }
    const numDoc = this.wizardService.intervinienteBusquedaForm.get('numeroIdentificacion')?.value?.trim();
    if (!numDoc) return;

    this.busquedaRealizada = true;
    const encontrado = (this.contribuyentesFacade.contribuyentes() as any[]).find((c: any) => c.numeroIdentificacion === numDoc);
    
    if (encontrado) {
      this.wizardService.creandoNuevoInterviniente.set(false);
      this.wizardService.intervinienteSeleccionado.set(encontrado);
    } else {
      this.wizardService.creandoNuevoInterviniente.set(true);
      this.wizardService.intervinienteSeleccionado.set(null);
      this.wizardService.intervinienteNuevoForm.patchValue({
        numeroIdentificacion: numDoc,
        tipoPersonaId: null,
        tipoIdentificacionId: null,
        nombre: '',
        email: '',
        telefono: '',
        direccion: ''
      });
    }
  }

  crearYAsignarContribuyente() {
    if (this.wizardService.intervinienteNuevoForm.valid) {
      const formValue = this.wizardService.intervinienteNuevoForm.value;
      this.contribuyentesFacade.crear(formValue).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            // Se creó el contribuyente
            const nuevoContrib = { ...formValue, id: res.data };
            this.contribuyentesFacade.cargarContribuyentes(1, 1000); // Recargar
            this.wizardService.intervinienteSeleccionado.set(nuevoContrib);
            this.wizardService.creandoNuevoInterviniente.set(false);
            this.toastService.success('Contribuyente creado exitosamente');
          }
        },
        error: () => this.toastService.error('Error al crear el contribuyente')
      });
    } else {
      this.wizardService.intervinienteNuevoForm.markAllAsTouched();
    }
  }

  asignarIntervinienteAlActo() {
    if (this.wizardService.intervinienteAsignarForm.valid) {
      const formValue = this.wizardService.intervinienteAsignarForm.value;
      const contrib = this.wizardService.intervinienteSeleccionado();
      const actoIdSeleccionado = this.wizardService.actoSeleccionadoId();
      
      if (!contrib || !actoIdSeleccionado) return;

      const rolObj = (this.rolesIntervinienteFacade.rolesInterviniente() as any[]).find((r: any) => r.id === Number(formValue.rolId));

      const nuevoInterviniente = {
        idTemp: Math.random().toString(),
        contribuyenteId: contrib.id,
        nombre: contrib.nombre,
        documento: contrib.numeroIdentificacion,
        rolId: Number(formValue.rolId),
        rolNombre: rolObj?.nombre || 'Desconocido',
        porcentaje: Number(formValue.porcentaje)
      };

      // Agregar al acto correspondiente en actosExpediente
      this.wizardService.actosExpediente.update(actos => 
        actos.map(acto => {
          if (acto.idTemp === actoIdSeleccionado) {
            // Prevenir duplicados del mismo contribuyente en el mismo acto
            const existe = acto.intervinientes.some(i => i.contribuyenteId === contrib.id);
            if (existe) {
              this.toastService.warning('Este contribuyente ya es interviniente en este acto.');
              return acto;
            }
            return { ...acto, intervinientes: [...acto.intervinientes, nuevoInterviniente] };
          }
          return acto;
        })
      );

      this.resetearBusqueda();
      this.toastService.success('Interviniente asignado al acto');
    } else {
      this.wizardService.intervinienteAsignarForm.markAllAsTouched();
    }
  }

  eliminarInterviniente(actoId: string, intvIdTemp: string) {
    this.wizardService.actosExpediente.update(actos => 
      actos.map(acto => {
        if (acto.idTemp === actoId) {
          return { ...acto, intervinientes: acto.intervinientes.filter(i => i.idTemp !== intvIdTemp) };
        }
        return acto;
      })
    );
  }

  resetearBusqueda() {
    this.busquedaRealizada = false;
    this.wizardService.intervinienteSeleccionado.set(null);
    this.wizardService.creandoNuevoInterviniente.set(false);
    this.wizardService.intervinienteBusquedaForm.reset();
    this.wizardService.intervinienteNuevoForm.reset();
    this.wizardService.intervinienteAsignarForm.reset({ rolId: null, porcentaje: 100 });
  }

  continuar() {
    // Validar que todos los actos tengan al menos un interviniente
    const actos = this.wizardService.actosExpediente();
    const algunActoSinIntervinientes = actos.some(a => a.intervinientes.length === 0);
    
    if (algunActoSinIntervinientes) {
      this.toastService.warning('Asegúrese de que todos los actos tengan al menos un interviniente asignado.');
      return;
    }

    const solicitudId = this.wizardService.solicitudId();
    if (!solicitudId) {
      this.toastService.error('Solicitud ID no encontrado.');
      return;
    }

    // Aplanar los intervinientes
    const todosIntervinientes = actos.flatMap(acto => 
      acto.intervinientes.map(i => ({
        actoId: Number(acto.idTemp), // El backend envió el id en idTemp durante la recarga!
        contribuyenteId: i.contribuyenteId!,
        rolIntervinienteId: i.rolId,
        porcentajeParticipacion: i.porcentaje
      }))
    );

    this.solicitudesFacade.registrarIntervinientes(solicitudId, { intervinientes: todosIntervinientes })
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.wizardService.currentStep.set(5);
            this.wizardService.etapaGuardada.set(4);
            this.toastService.success('Intervinientes guardados exitosamente');
          }
        },
        error: () => this.toastService.error('Error al guardar los intervinientes')
      });
  }

  retroceder() {
    this.wizardService.currentStep.set(3);
  }
}
