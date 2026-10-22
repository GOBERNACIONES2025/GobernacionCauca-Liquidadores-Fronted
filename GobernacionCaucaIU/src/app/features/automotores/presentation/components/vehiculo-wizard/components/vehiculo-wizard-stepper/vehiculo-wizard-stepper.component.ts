import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-vehiculo-wizard-stepper',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vehiculo-wizard-stepper.component.html'
})
export class VehiculoWizardStepperComponent {
  @Input() currentStep: number = 1;
  @Input() totalSteps: number = 3;
  @Input() isNuevo: boolean = true;
}
