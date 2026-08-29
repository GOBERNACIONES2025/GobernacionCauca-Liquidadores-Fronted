import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { concatMap, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { LiquidacionWizardService } from '../../../services/liquidacion-wizard.service';
import { ContribuyentesFacade } from '../../../../../../application/facades/Contribuyentes/contribuyentes.facade';
import { TiposPersonaFacade } from '../../../../../../application/facades/Contribuyentes/tipos-persona.facade';
import { TiposIdentificacionFacade } from '../../../../../../application/facades/Contribuyentes/tipos-identificacion.facade';
import { RolesIntervinienteFacade } from '../../../../../../application/facades/Intervinientes/roles-interviniente.facade';
import { SolicitudesLiquidacionFacade } from '../../../../../../application/facades/Radicacion/solicitudes-liquidacion.facade';
import { GeneracionLiquidacionFacade } from '../../../../../../application/facades/Liquidacion/generacion-liquidacion.facade';
import { ContribuyentesApiService } from '../../../../../../infrastructure/api/Contribuyentes/contribuyentes-api.service';
import { ToastService } from '../../../../../../../../core/services/toast.service';
import { IntervinienteActoDto } from '../../../../../../domain/models/Radicacion/solicitud-wizard.model';
import { SimularLiquidacionDto } from '../../../../../../domain/models/Liquidacion/generacion-liquidacion.model';

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
  generacionFacade = inject(GeneracionLiquidacionFacade);
  contribuyentesApi = inject(ContribuyentesApiService);
  toastService = inject(ToastService);

  busquedaRealizada = false;
  buscandoContribuyente = signal<boolean>(false);
  isSimulating = signal<boolean>(false);

  ngOnInit() {
    this.tiposPersonaFacade.cargarTiposPersona();
    this.tiposIdentificacionFacade.cargarTiposIdentificacion();
    this.rolesIntervinienteFacade.cargarRolesInterviniente(1, 100);

    // Auto-seleccionar el primer acto si existe y no hay selección activa
    const actos = this.wizardService.actosExpediente();
    if (actos.length > 0 && !this.wizardService.actoSeleccionadoId()) {
      this.seleccionarActo(actos[0].idTemp);
    }
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
    this.buscandoContribuyente.set(true);

    this.contribuyentesApi.obtenerTodos(1, 10, numDoc).pipe(
      finalize(() => this.buscandoContribuyente.set(false))
    ).subscribe({
      next: (res: any) => {
        const raw = res?.data;
        const items: any[] = Array.isArray(raw) ? raw : (raw?.items || []);
        const cleanDoc = numDoc.trim().toLowerCase();
        const encontrado = items.find((c: any) => 
          String(c.numeroIdentificacion || c.numeroDocumento || c.documento || c.identificacion || '').trim().toLowerCase() === cleanDoc
        );

        if (encontrado) {
          const contribNormalizado = {
            id: encontrado.id,
            nombre: encontrado.nombre || encontrado.nombreCompleto || encontrado.razonSocial,
            numeroIdentificacion: encontrado.numeroIdentificacion || encontrado.numeroDocumento || numDoc,
            tipoPersonaId: encontrado.tipoPersonaId ?? encontrado.tipoPersona?.id,
            tipoIdentificacionId: encontrado.tipoIdentificacionId ?? encontrado.tipoIdentificacion?.id,
            email: encontrado.email,
            telefono: encontrado.telefono,
            direccion: encontrado.direccion
          };
          this.wizardService.creandoNuevoInterviniente.set(false);
          this.wizardService.intervinienteSeleccionado.set(contribNormalizado);
          this.toastService.success(`Contribuyente encontrado: ${contribNormalizado.nombre}`);
          return;
        }
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
        this.toastService.info('Contribuyente no registrado. Diligencie los datos para crearlo.');
      },
      error: () => {
        this.toastService.error('Error al consultar el contribuyente en el servidor.');
      }
    });
  }

  crearYAsignarContribuyente() {
    if (this.wizardService.intervinienteNuevoForm.valid) {
      const formValue = this.wizardService.intervinienteNuevoForm.value;
      this.contribuyentesFacade.crear(formValue).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            const nuevoContrib = { ...formValue, id: res.data };
            this.wizardService.intervinienteSeleccionado.set(nuevoContrib);
            this.wizardService.creandoNuevoInterviniente.set(false);
            this.toastService.success('Contribuyente creado exitosamente. Ahora seleccione el rol y porcentaje.');
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
      
      if (!contrib || !actoIdSeleccionado) {
        this.toastService.warning('Seleccione un acto y un contribuyente válido.');
        return;
      }

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
          if (String(acto.idTemp) === String(actoIdSeleccionado)) {
            const listActual = acto.intervinientes || [];
            // Prevenir duplicados del mismo contribuyente en el mismo acto
            const existe = listActual.some(i => i.contribuyenteId === contrib.id || i.documento === contrib.numeroIdentificacion);
            if (existe) {
              this.toastService.warning('Este contribuyente ya es interviniente en este acto.');
              return acto;
            }
            return { ...acto, intervinientes: [...listActual, nuevoInterviniente] };
          }
          return acto;
        })
      );

      this.resetearBusqueda();
      this.toastService.success('Interviniente asignado al acto.');
    } else {
      this.wizardService.intervinienteAsignarForm.markAllAsTouched();
    }
  }

  eliminarInterviniente(actoId: string, intvIdTemp: string) {
    this.wizardService.actosExpediente.update(actos => 
      actos.map(acto => {
        if (String(acto.idTemp) === String(actoId)) {
          const listActual = acto.intervinientes || [];
          return { ...acto, intervinientes: listActual.filter(i => String(i.idTemp) !== String(intvIdTemp)) };
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
    // Si ya está liquidada / solo lectura, simplemente pasar al paso 5
    if (this.wizardService.esSoloLectura()) {
      this.wizardService.currentStep.set(5);
      return;
    }

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

    this.isSimulating.set(true);

    // 1. Guardar Intervinientes
    this.solicitudesFacade.registrarIntervinientes(solicitudId, { intervinientes: todosIntervinientes }).pipe(
      // 2. Completar Solicitud (Estado 2: EN_REVISION, EtapaActual: 4)
      concatMap(resIntv => {
        if (!resIntv.success) {
          throw new Error(resIntv.message || 'Error al guardar los intervinientes');
        }
        return this.solicitudesFacade.completarSolicitud(solicitudId);
      }),
      // 3. Simular Liquidación
      concatMap(resComp => {
        const form1 = this.wizardService.paso1Form.value;
        const payloadSimulacion: SimularLiquidacionDto = {
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
        return this.generacionFacade.simularLiquidacion(payloadSimulacion);
      }),
      finalize(() => this.isSimulating.set(false))
    ).subscribe({
      next: (simRes) => {
        if (simRes && simRes.success && simRes.data) {
          this.wizardService.liquidacionSimulada.set(simRes.data);
          this.wizardService.estadoSolicitudId.set(2);
          this.wizardService.estadoSolicitudNombre.set('En Revisión');
          this.wizardService.etapaGuardada.set(4);
          this.wizardService.currentStep.set(5);
          this.toastService.success('Liquidación calculada exitosamente.');
        } else {
          this.toastService.error(simRes?.message || 'Error al calcular la liquidación');
        }
      },
      error: (err) => {
        const msg = err?.error?.message || err?.error?.detail || err?.message || 'Error al calcular la liquidación';
        this.toastService.error(msg);
      }
    });
  }

  retroceder() {
    this.wizardService.currentStep.set(3);
  }
}
