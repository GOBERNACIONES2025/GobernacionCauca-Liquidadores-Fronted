import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LiquidacionLicores } from '../../../domain/models/licores.models';
import { formatCurrencyCop } from '../../../domain/calculator/licores-tax-calculator';

@Component({
  selector: 'app-asobancario-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './asobancario-modal.component.html',
})
export class AsobancarioModalComponent {
  @Input({ required: true }) liquidacion!: LiquidacionLicores;
  @Output() pagoRegistrado = new EventEmitter<{
    metodo: 'ASOBANCARIO_VENTANILLA';
    banco: string;
    referencia: string;
  }>();
  @Output() cerrar = new EventEmitter<void>();

  bancoRecaudador = 'Banco Agrario de Colombia (Convenio 4402)';
  numeroTransaccionBancaria = `REC-${Math.floor(10000000 + Math.random() * 90000000)}`;
  fechaRecaudo = new Date().toISOString().slice(0, 10);
  procesando = signal<boolean>(false);

  formatMoney(val: number): string {
    return formatCurrencyCop(val);
  }

  confirmarRelacionamiento(): void {
    this.procesando.set(true);
    setTimeout(() => {
      this.procesando.set(false);
      this.pagoRegistrado.emit({
        metodo: 'ASOBANCARIO_VENTANILLA',
        banco: this.bancoRecaudador,
        referencia: this.numeroTransaccionBancaria,
      });
    }, 1200);
  }
}
