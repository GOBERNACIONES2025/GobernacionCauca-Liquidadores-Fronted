import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { EstampillasFacade } from '../../../../application/facades/estampillas.facade';
import { EstampillasStorageService } from '../../../../infrastructure/storage/storage.service';
import { VigenciaTributaria } from '../../../../domain/models/estampillas.models';
import { EstampillasBadgeComponent } from '../../../components/ui-badge/ui-badge.component';

@Component({
  selector: 'app-vigencias-admin',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    EstampillasBadgeComponent
  ],
  templateUrl: './vigencias-admin.html'
})
export class VigenciasAdminComponent {
  readonly facade = inject(EstampillasFacade);
  readonly storage = inject(EstampillasStorageService);
  private fb = inject(FormBuilder);

  isModalOpen = signal<boolean>(false);
  editingVigencia = signal<VigenciaTributaria | null>(null);

  form: FormGroup = this.fb.group({
    anio: [2027, [Validators.required, Validators.min(2020), Validators.max(2035)]],
    descripcion: ['', [Validators.required]],
    estado: ['FUTURA', [Validators.required]],
    fechaApertura: ['2027-01-01', [Validators.required]],
    fechaCierre: ['']
  });

  abrirModalNuevo(): void {
    this.editingVigencia.set(null);
    const siguienteAnio = new Date().getFullYear() + 1;
    this.form.reset({
      anio: siguienteAnio,
      descripcion: `Vigencia Fiscal y Tributaria ${siguienteAnio} - Departamento del Cauca`,
      estado: 'FUTURA',
      fechaApertura: `${siguienteAnio}-01-01`,
      fechaCierre: ''
    });
    this.isModalOpen.set(true);
  }

  abrirModalEditar(item: VigenciaTributaria): void {
    this.editingVigencia.set(item);
    this.form.patchValue({
      anio: item.anio,
      descripcion: item.descripcion,
      estado: item.estado,
      fechaApertura: item.fechaApertura,
      fechaCierre: item.fechaCierre || ''
    });
    this.isModalOpen.set(true);
  }

  cerrarModal(): void {
    this.isModalOpen.set(false);
    this.editingVigencia.set(null);
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const val = this.form.value;
    const editing = this.editingVigencia();

    const vig: VigenciaTributaria = {
      anio: Number(val.anio),
      descripcion: val.descripcion,
      estado: val.estado,
      fechaApertura: val.fechaApertura,
      fechaCierre: val.fechaCierre || undefined,
      totalLiquidado: editing ? editing.totalLiquidado : 0,
      totalRecaudado: editing ? editing.totalRecaudado : 0
    };

    this.storage.saveVigencia(vig);

    const currentUser = this.storage.getCurrentUser();
    this.storage.registrarAuditoria({
      usuarioNombre: currentUser.nombre,
      usuarioRol: currentUser.rol,
      accion: editing ? 'ACTUALIZACION' : 'CREACION',
      entidadAfectada: 'CONFIGURACION',
      referenciaEntidad: String(vig.anio),
      descripcion: `${editing ? 'Actualización' : 'Apertura'} de la vigencia fiscal ${vig.anio} (${vig.estado})`
    });

    this.cerrarModal();
  }

  toggleCierre(item: VigenciaTributaria): void {
    const nuevoEstado = item.estado === 'ACTIVA' ? 'CERRADA' : 'ACTIVA';
    const updated: VigenciaTributaria = {
      ...item,
      estado: nuevoEstado,
      fechaCierre: nuevoEstado === 'CERRADA' ? new Date().toISOString().substring(0, 10) : undefined
    };
    this.storage.saveVigencia(updated);

    const currentUser = this.storage.getCurrentUser();
    this.storage.registrarAuditoria({
      usuarioNombre: currentUser.nombre,
      usuarioRol: currentUser.rol,
      accion: 'ACTUALIZACION',
      entidadAfectada: 'CONFIGURACION',
      referenciaEntidad: String(item.anio),
      descripcion: `Cambio de estado de vigencia ${item.anio} a ${nuevoEstado}`
    });
  }
}
