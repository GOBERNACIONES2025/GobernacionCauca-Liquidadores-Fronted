import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-vehiculo-wizard-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vehiculo-wizard-footer.component.html'
})
export class VehiculoWizardFooterComponent {
  @Input() isUltimoPaso: boolean = false;
  @Input() loading: boolean = false;

  @Output() cancelar = new EventEmitter<void>();
  @Output() siguiente = new EventEmitter<void>();
}
