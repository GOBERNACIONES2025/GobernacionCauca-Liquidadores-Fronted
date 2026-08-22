import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { LiquidacionWizardService, ActoTemp, IntervinienteTemp } from '../../../services/liquidacion-wizard.service';
import { TiposActoRegistroFacade } from '../../../../../../application/facades/Registro/tipos-acto-registro.facade';
import { ExencionesFacade } from '../../../../../../application/facades/Exenciones/exenciones.facade';
import { RolesIntervinienteFacade } from '../../../../../../application/facades/Intervinientes/roles-interviniente.facade';

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
    if (this.wizardService.actosExpediente().length > 0) {
      this.wizardService.currentStep.set(4);
    }
  }

  retroceder() {
    this.wizardService.currentStep.set(2);
  }
}
