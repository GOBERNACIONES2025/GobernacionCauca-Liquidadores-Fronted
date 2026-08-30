import { Component, inject, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { LiquidacionWizardService } from '../../../services/liquidacion-wizard.service';
import { EntidadesRegistroFacade } from '../../../../../../application/facades/Registro/entidades-registro.facade';
import { MunicipiosFacade } from '../../../../../../application/facades/Territorios/municipios.facade';
import { SolicitudesLiquidacionFacade } from '../../../../../../application/facades/Radicacion/solicitudes-liquidacion.facade';
import { ToastService } from '../../../../../../../../core/services/toast.service';
import { RegistrarDocumentoDto } from '../../../../../../domain/models/Radicacion/solicitud-wizard.model';
import { TiposEntidadRegistroFacade } from '../../../../../../application/facades/Registro/tipos-entidad-registro.facade';
import { CategoriasActoFacade } from '../../../../../../application/facades/Registro/categorias-acto.facade';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-step-documento',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './step-documento.html'
})
export class StepDocumentoComponent implements OnInit {
  wizardService = inject(LiquidacionWizardService);
  destroyRef = inject(DestroyRef);
  
  entidadesFacade = inject(EntidadesRegistroFacade);
  tiposEntidadFacade = inject(TiposEntidadRegistroFacade);
  categoriasActoFacade = inject(CategoriasActoFacade);
  municipiosFacade = inject(MunicipiosFacade);
  solicitudesFacade = inject(SolicitudesLiquidacionFacade);
  toastService = inject(ToastService);

  ngOnInit() {
    this.tiposEntidadFacade.cargarTiposEntidadRegistro(1, 100);
    this.categoriasActoFacade.cargarCategoriasActo(1, 100);

    const tipoEntidadCtrl = this.wizardService.paso2Form.get('tipoEntidadRegistroId');
    const municipioCtrl = this.wizardService.paso2Form.get('municipioJurisdiccionId');
    const categoriaCtrl = this.wizardService.paso2Form.get('categoriaActoId');
    const entidadCtrl = this.wizardService.paso2Form.get('entidadRegistroId');

    if (tipoEntidadCtrl && municipioCtrl && categoriaCtrl && entidadCtrl) {
      // 1. Cuando Tipo Entidad cambia: Habilitar Municipio y Categoría
      tipoEntidadCtrl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(val => {
        if (val) {
          municipioCtrl.enable({emitEvent: false});
          categoriaCtrl.enable({emitEvent: false});
        } else {
          municipioCtrl.disable({emitEvent: false});
          categoriaCtrl.disable({emitEvent: false});
          municipioCtrl.setValue(null);
          categoriaCtrl.setValue(null);
        }
      });

      // 2. Entidades de Registro (Filtro por Tipo Entidad y Municipio)
      combineLatest([
        tipoEntidadCtrl.valueChanges,
        municipioCtrl.valueChanges
      ]).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(([tipoEntidadId, municipioId]) => {
        if (tipoEntidadId && municipioId) {
          entidadCtrl.enable({emitEvent: false});
          this.entidadesFacade.cargarEntidadesRegistro(1, 100, Number(tipoEntidadId), undefined, Number(municipioId));
        } else {
          entidadCtrl.disable({emitEvent: false});
          entidadCtrl.setValue(null);
          this.entidadesFacade.entidadesRegistro.set([]);
        }
      });
      
      // Emitir valores iniciales por si vienen precargados
      if (tipoEntidadCtrl.value) tipoEntidadCtrl.updateValueAndValidity();
      if (tipoEntidadCtrl.value && municipioCtrl.value) municipioCtrl.updateValueAndValidity();
    }
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.wizardService.documentoSoporteFile = file;
    } else {
      this.wizardService.documentoSoporteFile = null;
    }
  }

  continuar() {
    if (this.wizardService.esSoloLectura()) {
      this.wizardService.currentStep.set(3);
      return;
    }

    const tieneArchivoPrevio = !!this.wizardService.documentoSoporteNombre();
    const tieneArchivoNuevo = !!this.wizardService.documentoSoporteFile;

    // Si ya está guardada esta etapa (>=2), no subieron archivo nuevo y no cambiaron campos del form: navegar sin guardar.
    if (this.wizardService.etapaGuardada() >= 2 && !this.wizardService.documentoSoporteFile && !this.wizardService.paso2Form.dirty) {
      this.wizardService.currentStep.set(3);
      return;
    }

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
