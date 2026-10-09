import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConceptosTributariosFacade } from '../../../../../application/facades/conceptos-tributarios.facade';
import { ConceptoTributarioDto } from '../../../../../domain/interfaces/conceptos-tributarios.interface';
import { ToastService } from '../../../../../../../core/services/toast.service';

@Component({
  selector: 'app-conceptos-tributarios',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './conceptos-tributarios.html'
})
export class ConceptosTributariosPage implements OnInit {
  public facade = inject(ConceptosTributariosFacade);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  form!: FormGroup;

  readonly isSlideOverOpen = signal<boolean>(false);
  readonly isEditMode = signal<boolean>(false);
  readonly selectedItem = signal<ConceptoTributarioDto | null>(null);
  readonly itemParaEliminar = signal<ConceptoTributarioDto | null>(null);

  ngOnInit(): void {
    this.form = this.fb.group({
      id: [0],
      tipoConceptoTributarioId: [1, [Validators.required, Validators.min(1)]],
      codigo: ['', [Validators.required, Validators.maxLength(50)]],
      nombre: ['', [Validators.required, Validators.maxLength(250)]],
      activo: [true]
    });
  }

  onSearch(term: string): void {
    this.facade.searchTerm.set(term);
    this.facade.pageNumber.set(1);
    this.facade.cargarConceptos();
  }

  onFilterTipo(tipo: any): void {
    this.facade.tipoConceptoFiltro.set(tipo === 'TODOS' ? 'TODOS' : Number(tipo));
    this.facade.pageNumber.set(1);
    this.facade.cargarConceptos();
  }

  onFilterEstado(estado: 'TODOS' | 'ACTIVOS' | 'INACTIVOS'): void {
    this.facade.estadoFiltro.set(estado);
    this.facade.pageNumber.set(1);
    this.facade.cargarConceptos();
  }

  onPageChange(page: number): void {
    this.facade.pageNumber.set(page);
    this.facade.cargarConceptos();
  }

  abrirCrear(): void {
    this.isEditMode.set(false);
    this.selectedItem.set(null);
    this.form.reset({
      id: 0,
      tipoConceptoTributarioId: 1,
      codigo: '',
      nombre: '',
      activo: true
    });
    this.isSlideOverOpen.set(true);
  }

  abrirEditar(item: ConceptoTributarioDto): void {
    this.isEditMode.set(true);
    this.selectedItem.set(item);
    this.form.reset({
      id: item.id,
      tipoConceptoTributarioId: item.tipoConceptoTributarioId ?? 1,
      codigo: item.codigo,
      nombre: item.nombre,
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
      this.toast.warning('Complete todos los campos obligatorios.');
      return;
    }

    const val = this.form.value;
    const basePayload = {
      tipoConceptoTributarioId: Number(val.tipoConceptoTributarioId),
      codigo: (val.codigo || '').toUpperCase().trim(),
      nombre: (val.nombre || '').trim(),
      activo: Boolean(val.activo ?? true)
    };

    if (this.isEditMode()) {
      const payload = {
        id: Number(val.id),
        ...basePayload,
        rowVersion: this.selectedItem()?.rowVersion
      };

      this.facade.actualizarConcepto(payload.id, payload).subscribe(ok => {
        if (ok) {
          this.toast.success('Concepto tributario actualizado exitosamente.');
          this.cerrarSlideOver();
        } else {
          this.toast.error('Error al actualizar el concepto tributario.');
        }
      });
    } else {
      this.facade.crearConcepto(basePayload).subscribe(ok => {
        if (ok) {
          this.toast.success('Concepto tributario registrado exitosamente.');
          this.cerrarSlideOver();
        } else {
          this.toast.error('Error al registrar el concepto tributario.');
        }
      });
    }
  }

  toggleActivo(item: ConceptoTributarioDto): void {
    const estado = !item.activo ? 'activado' : 'desactivado';
    this.facade.toggleActivo(item).subscribe(ok => {
      if (ok) {
        this.toast.success(`Concepto tributario ${estado} correctamente.`);
      } else {
        this.toast.error('No se pudo cambiar el estado del concepto tributario.');
      }
    });
  }

  abrirConfirmarEliminar(item: ConceptoTributarioDto): void {
    this.itemParaEliminar.set(item);
  }

  cerrarConfirmarEliminar(): void {
    this.itemParaEliminar.set(null);
  }

  confirmarEliminacion(): void {
    const item = this.itemParaEliminar();
    if (!item) return;

    this.facade.eliminarConcepto(item.id).subscribe(ok => {
      if (ok) {
        this.toast.success('Concepto tributario eliminado exitosamente.');
        this.cerrarConfirmarEliminar();
      } else {
        this.toast.error('Error al eliminar el concepto tributario.');
      }
    });
  }
}
