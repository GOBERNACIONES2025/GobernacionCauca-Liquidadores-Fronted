import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormArray, ReactiveFormsModule } from '@angular/forms';

import { SearchableSelectComponent } from '../../../../../../../shared/components/searchable-select/searchable-select';

@Component({
  selector: 'app-vehiculo-wizard-propietario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SearchableSelectComponent],
  templateUrl: './vehiculo-wizard-propietario.component.html'
})
export class VehiculoWizardPropietarioComponent {
  @Input({ required: true }) form!: FormGroup;
  @Input() tiposDocumento: any[] = [];
  @Input() departamentos: any[] = [];
  @Input() ciudades: any[] = [];
  @Input() tiposVinculo: any[] = [];
  @Input() propietarioEncontradoMsgs: Record<number, string | null> = {};
  @Input() buscandoIndex: number | null = null;
  @Input() erroresPaso: any[] = [];
  @Input() selectedFile: File | null = null;
  @Input() subiendoArchivo: boolean = false;
  @Input() archivoSubidoNombre: string | null = null;

  @Output() buscar = new EventEmitter<number>();
  @Output() limpiar = new EventEmitter<number>();
  @Output() agregarCopropietario = new EventEmitter<void>();
  @Output() eliminarCopropietario = new EventEmitter<number>();
  @Output() setResponsablePrincipal = new EventEmitter<number>();
  @Output() asignarRestante = new EventEmitter<number>();
  @Output() fileSelected = new EventEmitter<Event>();
  @Output() uploadDocument = new EventEmitter<void>();

  get propietariosArray(): FormArray {
    return this.form.get('propietarios') as FormArray;
  }

  isNatural(index: number): boolean {
    const pGroup = this.propietariosArray?.at(index);
    return (pGroup?.get('naturalezaJuridicaId')?.value ?? 1) == 1;
  }

  calcularPorcentajeTotal(): number {
    if (!this.propietariosArray) return 0;
    const total = this.propietariosArray.controls.reduce((acc, control) => {
      const val = Number(control.get('porcentajePropiedad')?.value) || 0;
      return acc + val;
    }, 0);
    return Math.round(total * 100) / 100;
  }

  calcularPorcentajeRestante(): number {
    return Math.max(0, Math.round((100 - this.calcularPorcentajeTotal()) * 100) / 100);
  }

  onDocInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const pGroup = this.propietariosArray.at(index);
    const tipo = Number(pGroup?.get('tipoDocumentoId')?.value);
    if ([1, 2, 4, 6].includes(tipo)) {
      const soloDigitos = input.value.replace(/\D/g, '');
      if (input.value !== soloDigitos) {
        input.value = soloDigitos;
        pGroup.get('numeroDocumento')?.setValue(soloDigitos, { emitEvent: false });
      }
    }
  }

  getError(campo: string, index: number = 0): string | null {
    const key = `propietario_${index}_${campo}`;
    return this.erroresPaso.find(e => e.campo === key || e.campo === campo)?.mensaje ?? null;
  }

  hasError(campo: string, index: number = 0): boolean {
    const key = `propietario_${index}_${campo}`;
    return this.erroresPaso.some(e => e.campo === key || e.campo === campo);
  }
}
