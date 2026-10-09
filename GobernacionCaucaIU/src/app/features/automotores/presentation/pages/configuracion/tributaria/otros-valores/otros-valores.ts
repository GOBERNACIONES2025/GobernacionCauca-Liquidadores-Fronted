import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { OtrosValoresFacade } from '../../../../../application/facades/otros-valores.facade';
import { OtroValorDto } from '../../../../../domain/interfaces/otros-valores.interface';
import { ToastService } from '../../../../../../../core/services/toast.service';

@Component({
  selector: 'app-otros-valores',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './otros-valores.html'
})
export class OtrosValoresPage implements OnInit {
  public facade = inject(OtrosValoresFacade);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  form!: FormGroup;

  readonly isSlideOverOpen = signal<boolean>(false);
  readonly isEditMode = signal<boolean>(false);
  readonly selectedItem = signal<OtroValorDto | null>(null);
  readonly itemParaEliminar = signal<OtroValorDto | null>(null);

  ngOnInit(): void {
    this.form = this.fb.group({
      id: [0],
      vigenciaFiscalId: [null, [Validators.required]],
      conceptoTributarioId: [null, [Validators.required, Validators.min(1)]],
      valor: [0, [Validators.required, Validators.min(0)]],
      activo: [true]
    });
  }

  onSearch(term: string): void {
    this.facade.searchTerm.set(term);
    this.facade.pageNumber.set(1);
    this.facade.cargar();
  }

  onFilterVigencia(v: any): void {
    this.facade.vigenciaFiltro.set(v === 'TODOS' ? 'TODOS' : Number(v));
    this.facade.pageNumber.set(1);
    this.facade.cargar();
  }

  onFilterConcepto(v: any): void {
    this.facade.conceptoFiltro.set(v === 'TODOS' ? 'TODOS' : Number(v));
    this.facade.pageNumber.set(1);
    this.facade.cargar();
  }

  onFilterEstado(e: 'TODOS' | 'ACTIVOS' | 'INACTIVOS'): void {
    this.facade.estadoFiltro.set(e);
    this.facade.pageNumber.set(1);
    this.facade.cargar();
  }

  onPageChange(page: number): void {
    this.facade.pageNumber.set(page);
    this.facade.cargar();
  }

  abrirCrear(): void {
    this.isEditMode.set(false);
    this.selectedItem.set(null);
    this.form.reset({
      id: 0,
      vigenciaFiscalId: this.facade.vigencias()[0]?.id ?? null,
      conceptoTributarioId: this.facade.conceptos()[0]?.id ?? null,
      valor: 0,
      activo: true
    });
    this.isSlideOverOpen.set(true);
  }

  abrirEditar(item: OtroValorDto): void {
    this.isEditMode.set(true);
    this.selectedItem.set(item);
    this.form.reset({
      id: item.id,
      vigenciaFiscalId: item.vigenciaFiscalId,
      conceptoTributarioId: item.conceptoTributarioId,
      valor: item.valor,
      activo: item.activo
    });
    this.isSlideOverOpen.set(true);
  }

  cerrarSlideOver(): void {
    this.isSlideOverOpen.set(false);
    this.selectedItem.set(null);
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.warning('Complete todos los campos obligatorios. El valor no puede ser negativo.');
      return;
    }

    const val = this.form.value;
    const base = {
      vigenciaFiscalId: Number(val.vigenciaFiscalId),
      conceptoTributarioId: Number(val.conceptoTributarioId),
      valor: Number(val.valor),
      activo: Boolean(val.activo ?? true)
    };

    if (this.isEditMode()) {
      const payload = { id: Number(val.id), ...base, rowVersion: this.selectedItem()?.rowVersion };
      this.facade.actualizar(payload.id, payload).subscribe(ok => {
        if (ok) {
          this.toast.success('Valor actualizado exitosamente.');
          this.cerrarSlideOver();
        } else {
          this.toast.error('Error al actualizar el valor.');
        }
      });
    } else {
      this.facade.crear(base).subscribe(ok => {
        if (ok) {
          this.toast.success('Valor registrado exitosamente.');
          this.cerrarSlideOver();
        } else {
          this.toast.error('Error al registrar el valor.');
        }
      });
    }
  }

  abrirConfirmarEliminar(item: OtroValorDto): void {
    this.itemParaEliminar.set(item);
  }

  cerrarConfirmarEliminar(): void {
    this.itemParaEliminar.set(null);
  }

  confirmarEliminacion(): void {
    const item = this.itemParaEliminar();
    if (!item) return;
    this.facade.eliminar(item.id).subscribe(ok => {
      if (ok) {
        this.toast.success('Valor eliminado exitosamente.');
        this.cerrarConfirmarEliminar();
      } else {
        this.toast.error('Error al eliminar el valor.');
      }
    });
  }
}
