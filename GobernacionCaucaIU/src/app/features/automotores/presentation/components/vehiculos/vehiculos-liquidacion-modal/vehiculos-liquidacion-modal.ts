import { Component, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LiquidacionesFacade } from '../../../../application/facades/liquidaciones.facade';

@Component({
  selector: 'app-vehiculos-liquidacion-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vehiculos-liquidacion-modal.html'
})
export class VehiculosLiquidacionModalComponent {
  readonly liqFacade = inject(LiquidacionesFacade);

  @Output() cerrar = new EventEmitter<void>();
}
