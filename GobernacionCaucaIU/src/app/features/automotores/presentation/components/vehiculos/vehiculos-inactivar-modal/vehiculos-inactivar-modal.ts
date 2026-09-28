import { Component, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VehiculosFacade } from '../../../../application/facades/vehiculos.facade';

@Component({
  selector: 'app-vehiculos-inactivar-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vehiculos-inactivar-modal.html'
})
export class VehiculosInactivarModalComponent {
  readonly facade = inject(VehiculosFacade);

  @Output() cerrar = new EventEmitter<void>();
  @Output() confirmar = new EventEmitter<void>();
}
