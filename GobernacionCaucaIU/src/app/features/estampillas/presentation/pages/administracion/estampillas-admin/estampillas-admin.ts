import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { EstampillasFacade } from '../../../../application/facades/estampillas.facade';
import { EstampillasStorageService } from '../../../../infrastructure/storage/storage.service';
import { Estampilla } from '../../../../domain/models/estampillas.models';
import { EstampillasBadgeComponent } from '../../../components/ui-badge/ui-badge.component';

@Component({
  selector: 'app-estampillas-admin',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    EstampillasBadgeComponent
  ],
  templateUrl: './estampillas-admin.html'
})
export class EstampillasAdminComponent {
  readonly facade = inject(EstampillasFacade);
  readonly storage = inject(EstampillasStorageService);
  private fb = inject(FormBuilder);

  textoBusqueda = '';
  estadoFiltro = 'TODOS';

  isModalOpen = signal<boolean>(false);
  editingEstampilla = signal<Estampilla | null>(null);

  form: FormGroup = this.fb.group({
    codigo: ['', [Validators.required, Validators.minLength(3)]],
    nombre: ['', [Validators.required, Validators.minLength(5)]],
    descripcion: ['', [Validators.required]],
    fundamentoLegal: ['', [Validators.required]],
    tipoBase: ['VALOR_BRUTO_CONTRATO', [Validators.required]],
    tarifaPorcentaje: [1.0, [Validators.required, Validators.min(0.01), Validators.max(100)]],
    vigencia: [2026, [Validators.required]],
    cuentaBancariaRecaudo: ['CTA-CTE Banco Agrario 450-99812-3', [Validators.required]],
    bancoDestino: ['Banco Agrario de Colombia', [Validators.required]],
    requiereExencionValidada: [true],
    estado: ['ACTIVA', [Validators.required]]
  });

  onBuscar(): void {
    this.facade.setFiltroTexto(this.textoBusqueda);
  }

  onFiltrarEstado(): void {
    this.facade.setFiltroEstado(this.estadoFiltro);
  }

  abrirModalNuevo(): void {
    this.editingEstampilla.set(null);
    this.form.reset({
      codigo: `EST-00${this.facade.estampillas().length + 1}`,
      nombre: '',
      descripcion: '',
      fundamentoLegal: 'Ordenanza Departamental No. 0' + (this.facade.estampillas().length + 1) + ' de la Asamblea del Cauca',
      tipoBase: 'VALOR_BRUTO_CONTRATO',
      tarifaPorcentaje: 1.5,
      vigencia: 2026,
      cuentaBancariaRecaudo: 'CTA-CTE Banco Agrario 450-99812-3',
      bancoDestino: 'Banco Agrario de Colombia',
      requiereExencionValidada: true,
      estado: 'ACTIVA'
    });
    this.isModalOpen.set(true);
  }

  abrirModalEditar(item: Estampilla): void {
    this.editingEstampilla.set(item);
    this.form.patchValue({
      codigo: item.codigo,
      nombre: item.nombre,
      descripcion: item.descripcion,
      fundamentoLegal: item.fundamentoLegal,
      tipoBase: item.tipoBase,
      tarifaPorcentaje: item.tarifaPorcentaje,
      vigencia: item.vigencia,
      cuentaBancariaRecaudo: item.cuentaBancariaRecaudo || '',
      bancoDestino: item.bancoDestino || '',
      requiereExencionValidada: item.requiereExencionValidada,
      estado: item.estado
    });
    this.isModalOpen.set(true);
  }

  cerrarModal(): void {
    this.isModalOpen.set(false);
    this.editingEstampilla.set(null);
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const val = this.form.value;
    const editing = this.editingEstampilla();

    this.facade.guardarEstampilla({
      id: editing?.id,
      codigo: val.codigo,
      nombre: val.nombre,
      descripcion: val.descripcion,
      fundamentoLegal: val.fundamentoLegal,
      tipoBase: val.tipoBase,
      tarifaPorcentaje: Number(val.tarifaPorcentaje),
      vigencia: Number(val.vigencia),
      cuentaBancariaRecaudo: val.cuentaBancariaRecaudo,
      bancoDestino: val.bancoDestino,
      requiereExencionValidada: !!val.requiereExencionValidada,
      estado: val.estado
    });

    this.cerrarModal();
  }

  toggleEstado(item: Estampilla): void {
    this.facade.toggleEstadoEstampilla(item.id);
  }

  get sumaTarifasActivas(): number {
    return this.facade.estampillasActivas().reduce((acc, curr) => acc + curr.tarifaPorcentaje, 0);
  }
}
