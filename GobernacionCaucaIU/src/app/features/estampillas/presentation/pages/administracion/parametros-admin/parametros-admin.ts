import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { ConfiguracionFacade } from '../../../../application/facades/configuracion.facade';
import { EstampillasStorageService } from '../../../../infrastructure/storage/storage.service';
import { ToastService } from '../../../../../../core/services/toast.service';
import { RolUsuario, UsuarioMock, ExencionEstampilla } from '../../../../domain/models/estampillas.models';

@Component({
  selector: 'app-parametros-admin',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './parametros-admin.html'
})
export class ParametrosAdminComponent {
  readonly configFacade = inject(ConfiguracionFacade);
  readonly storage = inject(EstampillasStorageService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  isResetModalOpen = signal<boolean>(false);
  isExencionModalOpen = signal<boolean>(false);
  activeTab = signal<'GENERAL' | 'EXENCIONES' | 'USUARIOS' | 'AUDITORIA'>('GENERAL');

  // Formulario de parámetros de la entidad territorial
  generalForm: FormGroup = this.fb.group({
    entidadNombre: ['Gobernación del Departamento del Cauca', [Validators.required]],
    nit: ['891580016-2', [Validators.required]],
    departamento: ['Cauca', [Validators.required]],
    ciudadSede: ['Popayán', [Validators.required]],
    direccion: ['Calle 4 Carrera 7 Esquina, Centro Histórico', [Validators.required]],
    telefono: ['(602) 8242100 - 8242101', [Validators.required]],
    correoInstitucional: ['rentas@cauca.gov.co', [Validators.required, Validators.email]],
    nombreSecretario: ['Dra. Laura Cristina Mosquera', [Validators.required]],
    cargoSecretario: ['Secretaria de Hacienda Departamental', [Validators.required]],
    nombreRevisor: ['Dr. Carlos Andrés Ordóñez Paz', [Validators.required]],
    cargoRevisor: ['Profesional Especializado Grupo de Rentas', [Validators.required]],
    smmlv: [1423500, [Validators.required, Validators.min(0)]],
    uvt: [49799, [Validators.required, Validators.min(0)]],
    tasaInteresMoraAnual: [23.4, [Validators.required, Validators.min(0)]]
  });

  // Formulario para nueva exención
  exencionForm: FormGroup = this.fb.group({
    codigo: ['', [Validators.required]],
    nombre: ['', [Validators.required]],
    porcentajeExencion: [100, [Validators.required, Validators.min(1), Validators.max(100)]],
    fundamentoLegal: ['', [Validators.required]],
    descripcion: ['', [Validators.required]],
    aplicaA: ['TODAS'],
    activa: [true]
  });

  get exenciones(): ExencionEstampilla[] {
    this.storage.dataVersion();
    return this.storage.getExenciones();
  }

  guardarParametrosGenerales(): void {
    if (this.generalForm.invalid) {
      this.generalForm.markAllAsTouched();
      return;
    }

    const currentUser = this.storage.getCurrentUser();
    this.storage.registrarAuditoria({
      usuarioNombre: currentUser.nombre,
      usuarioRol: currentUser.rol,
      accion: 'ACTUALIZACION',
      entidadAfectada: 'CONFIGURACION',
      referenciaEntidad: 'PARAMETROS_GENERALES',
      descripcion: 'Actualización de parámetros territoriales, SMMLV, UVT y autoridades firmantes.'
    });

    this.toast.success('Parámetros institucionales actualizados correctamente.');
  }

  cambiarRol(rol: RolUsuario): void {
    this.configFacade.cambiarRol(rol);
  }

  abrirModalExencion(): void {
    this.exencionForm.reset({
      codigo: `EX-${Date.now().toString().slice(-4)}`,
      nombre: '',
      porcentajeExencion: 100,
      fundamentoLegal: 'Ley 80 de 1993 / Ordenanza Departamental',
      descripcion: '',
      aplicaA: 'TODAS',
      activa: true
    });
    this.isExencionModalOpen.set(true);
  }

  cerrarModalExencion(): void {
    this.isExencionModalOpen.set(false);
  }

  guardarExencion(): void {
    if (this.exencionForm.invalid) {
      this.exencionForm.markAllAsTouched();
      return;
    }

    const val = this.exencionForm.value;
    const ex: ExencionEstampilla = {
      id: `EX-${Date.now()}`,
      codigo: val.codigo,
      nombre: val.nombre,
      porcentajeAplicable: Number(val.porcentajeExencion),
      fundamentoLegal: val.fundamentoLegal,
      descripcion: val.descripcion,
      aplicaA: (val.aplicaA || 'TODAS') as 'TODAS' | 'CULTURA' | 'HOSPITAL' | 'UNIVERSIDAD' | 'ADULTO_MAYOR' | 'DEPORTE',
      estado: val.activa ? 'ACTIVA' : 'INACTIVA'
    };

    this.configFacade.guardarExencion(ex);
    this.cerrarModalExencion();
  }

  abrirModalReset(): void {
    this.isResetModalOpen.set(true);
  }

  cerrarModalReset(): void {
    this.isResetModalOpen.set(false);
  }

  ejecutarResetDemo(): void {
    this.configFacade.reiniciarDatosDemo();
    this.cerrarModalReset();
  }
}
