import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-vehiculo-wizard-historial',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vehiculo-wizard-historial.component.html'
})
export class VehiculoWizardHistorialComponent {
  @Input() fechaMatricula: string = '';
}
