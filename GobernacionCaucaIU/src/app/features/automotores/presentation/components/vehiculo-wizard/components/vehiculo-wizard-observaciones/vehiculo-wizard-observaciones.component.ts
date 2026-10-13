import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-vehiculo-wizard-observaciones',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './vehiculo-wizard-observaciones.component.html'
})
export class VehiculoWizardObservacionesComponent {
  @Input({ required: true }) form!: FormGroup;
  @Input() erroresPaso: any[] = [];

  getError(campo: string): string | null {
    return this.erroresPaso.find(e => e.campo === campo)?.mensaje ?? null;
  }

  hasError(campo: string): boolean {
    return this.erroresPaso.some(e => e.campo === campo);
  }
}
