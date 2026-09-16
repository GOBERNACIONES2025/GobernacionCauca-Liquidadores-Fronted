import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LiquidacionLicores } from '../../../domain/models/licores.models';
import { formatCurrencyCop } from '../../../domain/calculator/licores-tax-calculator';

@Component({
  selector: 'app-pse-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pse-modal.component.html',
})
export class PseModalComponent {
  @Input({ required: true }) liquidacion!: LiquidacionLicores;
  @Output() pagoExitoso = new EventEmitter<{
    metodo: 'PSE';
    banco: string;
    referencia: string;
    codigoTransaccionPse: string;
  }>();
  @Output() cerrar = new EventEmitter<void>();

  bancos = [
    'Bancolombia S.A.',
    'Banco de Bogotá',
    'Davivienda',
    'BBVA Colombia',
    'Banco de Occidente',
    'Banco Agrario de Colombia',
    'Banco Popular',
    'Scotiabank Colpatria',
    'Banco Itaú',
    'Nequi',
    'Daviplata',
  ];

  bancoSeleccionado = 'Bancolombia S.A.';
  tipoPersona = 'JURIDICA';
  tipoCuenta = 'CORRIENTE';
  emailContribuyente = 'tributario@fla.com.co';
  nitOcedula = '890900123-1';

  procesando = signal<boolean>(false);
  pasoActual = signal<'FORMULARIO' | 'PROCESANDO' | 'APROBADO'>('FORMULARIO');
  codigoCusGenerado = signal<string>('');

  formatMoney(val: number): string {
    return formatCurrencyCop(val);
  }

  simularPago(): void {
    this.procesando.set(true);
    this.pasoActual.set('PROCESANDO');

    const cus = `CUS-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    this.codigoCusGenerado.set(cus);

    setTimeout(() => {
      this.procesando.set(false);
      this.pasoActual.set('APROBADO');

      setTimeout(() => {
        this.pagoExitoso.emit({
          metodo: 'PSE',
          banco: this.bancoSeleccionado,
          referencia: `PSE-${this.liquidacion.numeroRadicado}`,
          codigoTransaccionPse: cus,
        });
      }, 1000);
    }, 1800);
  }
}
