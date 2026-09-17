import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { EstampillasFacade } from '../../../../application/facades/estampillas.facade';
import { EstampillasStorageService } from '../../../../infrastructure/storage/storage.service';
import { TarifaEstampilla } from '../../../../domain/models/estampillas.models';
import { EstampillasBadgeComponent } from '../../../components/ui-badge/ui-badge.component';

@Component({
  selector: 'app-tarifas-admin',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    EstampillasBadgeComponent
  ],
  templateUrl: './tarifas-admin.html'
})
export class TarifasAdminComponent {
  readonly facade = inject(EstampillasFacade);
  readonly storage = inject(EstampillasStorageService);
  private fb = inject(FormBuilder);

  filtroEstampilla = 'TODAS';
  filtroVigencia = 0;
  filtroEstado = 'TODOS';

  isModalOpen = signal<boolean>(false);
  editingTarifa = signal<TarifaEstampilla | null>(null);

  form: FormGroup = this.fb.group({
    estampillaId: ['', [Validators.required]],
    vigencia: [2026, [Validators.required]],
    porcentajeTarifa: [1.0, [Validators.required, Validators.min(0.01), Validators.max(100)]],
    fechaInicioVigencia: ['2026-01-01', [Validators.required]],
    fechaFinVigencia: ['2026-12-31'],
    estado: ['ACTIVA', [Validators.required]],
    observaciones: ['']
  });

  readonly tarifasFiltradas = computed(() => {
    this.storage.dataVersion();
    const list = this.storage.getTarifas();
    const est = this.filtroEstampilla;
    const vig = Number(this.filtroVigencia);
    const estado = this.filtroEstado;

    return list.filter(t => {
      const matchEst = est === 'TODAS' || t.estampillaId === est;
      const matchVig = vig === 0 || t.vigencia === vig;
      const matchEstado = estado === 'TODOS' || t.estado === estado;
      return matchEst && matchVig && matchEstado;
    });
  });

  abrirModalNuevo(): void {
    this.editingTarifa.set(null);
    const primeraEst = this.facade.estampillas()[0];
    this.form.reset({
      estampillaId: primeraEst ? primeraEst.id : '',
      vigencia: 2026,
      porcentajeTarifa: primeraEst ? primeraEst.tarifaPorcentaje : 1.5,
      fechaInicioVigencia: '2026-01-01',
      fechaFinVigencia: '2026-12-31',
      estado: 'ACTIVA',
      observaciones: 'Aprobada por Ordenanza Departamental de Presupuesto y Rentas'
    });
    this.isModalOpen.set(true);
  }

  abrirModalEditar(item: TarifaEstampilla): void {
    this.editingTarifa.set(item);
    this.form.patchValue({
      estampillaId: item.estampillaId,
      vigencia: item.vigencia,
      porcentajeTarifa: item.porcentajeTarifa,
      fechaInicioVigencia: item.fechaInicioVigencia,
      fechaFinVigencia: item.fechaFinVigencia || '',
      estado: item.estado,
      observaciones: item.observaciones || ''
    });
    this.isModalOpen.set(true);
  }

  cerrarModal(): void {
    this.isModalOpen.set(false);
    this.editingTarifa.set(null);
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const val = this.form.value;
    const est = this.facade.obtenerPorId(val.estampillaId);
    const editing = this.editingTarifa();
    const id = editing?.id || `TAR-${Date.now()}`;

    const nuevaTarifa: TarifaEstampilla = {
      id,
      estampillaId: val.estampillaId,
      estampillaNombre: est ? est.nombre : 'Estampilla Departamental',
      vigencia: Number(val.vigencia),
      porcentajeTarifa: Number(val.porcentajeTarifa),
      fechaInicioVigencia: val.fechaInicioVigencia,
      fechaFinVigencia: val.fechaFinVigencia || undefined,
      estado: val.estado,
      observaciones: val.observaciones
    };

    const list = this.storage.getTarifas();
    const idx = list.findIndex(t => t.id === id);
    if (idx >= 0) {
      list[idx] = nuevaTarifa;
    } else {
      list.unshift(nuevaTarifa);
    }
    this.storage.saveTarifas(list);

    // Si está activa y es de la vigencia actual, actualizar también en el catálogo de estampillas
    if (val.estado === 'ACTIVA' && est && est.vigencia === nuevaTarifa.vigencia) {
      est.tarifaPorcentaje = nuevaTarifa.porcentajeTarifa;
      this.storage.saveEstampilla(est);
    }

    const currentUser = this.storage.getCurrentUser();
    this.storage.registrarAuditoria({
      usuarioNombre: currentUser.nombre,
      usuarioRol: currentUser.rol,
      accion: editing ? 'ACTUALIZACION' : 'CREACION',
      entidadAfectada: 'ESTAMPILLA',
      referenciaEntidad: nuevaTarifa.id,
      descripcion: `${editing ? 'Actualización' : 'Definición'} de tarifa ${nuevaTarifa.porcentajeTarifa}% para ${nuevaTarifa.estampillaNombre} (${nuevaTarifa.vigencia})`
    });

    this.cerrarModal();
  }
}
