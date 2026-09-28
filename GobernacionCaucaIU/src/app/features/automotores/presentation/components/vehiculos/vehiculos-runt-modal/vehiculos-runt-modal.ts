import { Component, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VehiculosFacade } from '../../../../application/facades/vehiculos.facade';

@Component({
  selector: 'app-vehiculos-runt-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vehiculos-runt-modal.html'
})
export class VehiculosRuntModalComponent {
  readonly facade = inject(VehiculosFacade);

  @Output() cerrar = new EventEmitter<void>();
  @Output() consultar = new EventEmitter<void>();
}
