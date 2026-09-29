import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LiquidacionesFacade } from '../../../../application/facades/liquidaciones.facade';

@Component({
  selector: 'app-liquidaciones-simulacion-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './liquidaciones-simulacion-modal.html'
})
export class LiquidacionesSimulacionModalComponent {
  readonly facade = inject(LiquidacionesFacade);
}
