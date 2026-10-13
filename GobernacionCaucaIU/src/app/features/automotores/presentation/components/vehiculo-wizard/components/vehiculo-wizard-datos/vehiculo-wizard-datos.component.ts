import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SearchableSelectComponent } from '../../../../../../../shared/components/searchable-select/searchable-select';

@Component({
  selector: 'app-vehiculo-wizard-datos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SearchableSelectComponent],
  templateUrl: './vehiculo-wizard-datos.component.html'
})
export class VehiculoWizardDatosComponent {
  @Input({ required: true }) form!: FormGroup;
  @Input() tiposVehiculo: any[] = [];
  @Input() marcasDisponibles: any[] = [];
  @Input() lineasDisponibles: any[] = [];
  @Input() combustibles: any[] = [];
  @Input() serviciosVehiculo: any[] = [];
  @Input() estadosMatricula: any[] = [];
  @Input() organismosTransito: any[] = [];
  @Input() erroresPaso: any[] = [];

  mostrarInfoImportante: boolean = false;

  toggleInfoImportante(): void {
    this.mostrarInfoImportante = !this.mostrarInfoImportante;
  }

  getError(campo: string): string | null {
    return this.erroresPaso.find(e => e.campo === campo)?.mensaje ?? null;
  }

  hasError(campo: string): boolean {
    return this.erroresPaso.some(e => e.campo === campo);
  }
}
