import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LiquidacionesFacade } from '../../../../application/facades/liquidaciones.facade';

@Component({
  selector: 'app-liquidaciones-masiva-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './liquidaciones-masiva-modal.html'
})
export class LiquidacionesMasivaModalComponent {
  readonly facade = inject(LiquidacionesFacade);
}
