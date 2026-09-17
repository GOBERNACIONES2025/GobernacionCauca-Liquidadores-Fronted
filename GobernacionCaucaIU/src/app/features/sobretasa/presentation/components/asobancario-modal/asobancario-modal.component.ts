import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeclaracionSobretasa } from '../../../domain/models/sobretasa-gasolina.models';
import { formatCurrencyCop } from '../../../domain/calculator/sobretasa-tax-calculator';

@Component({
  selector: 'app-sobretasa-asobancario-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './asobancario-modal.component.html',
})
export class SobretasaAsobancarioModalComponent {
  @Input({ required: true }) declaracion!: DeclaracionSobretasa;
  @Output() pagoRegistrado = new EventEmitter<{
    metodo: 'ASOBANCARIO_VENTANILLA';
    banco: string;
    referencia: string;
    fecha: string;
  }>();
  @Output() cerrar = new EventEmitter<void>();

  bancoRecaudador = 'Banco Agrario de Colombia (Convenio 4402 - Sobretasa)';
  numeroTransaccionBancaria = `REC-SOB-${Math.floor(10000000 + Math.random() * 90000000)}`;
  fechaRecaudo = new Date().toISOString().slice(0, 10);
  observacionComprobante = '';
  procesando = signal<boolean>(false);

  bancosDisponibles = [
    'Banco Agrario de Colombia (Convenio 4402 - Sobretasa)',
    'Bancolombia S.A. (Convenio 99201)',
    'Banco de Bogotá (Convenio Rentas Cauca 1280)',
    'Banco Davivienda S.A. (Recaudo Sobretasa)',
    'Banco Popular (Convenio 6021)',
  ];

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
        fecha: this.fechaRecaudo,
      });
    }, 1000);
  }
}
