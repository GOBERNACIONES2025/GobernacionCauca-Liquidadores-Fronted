import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LicoresService } from '../../../application/licores.service';
import { formatCurrencyCop, TARIFAS_ICL_2026 } from '../../../domain/calculator/licores-tax-calculator';

@Component({
  selector: 'app-licores-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './licores-configuracion.html',
})
export class LicoresConfiguracionComponent {
  readonly licoresService = inject(LicoresService);
  readonly tarifas = TARIFAS_ICL_2026;

  mensajeExito = signal<string | null>(null);

  formatMoney(val: number): string {
    return formatCurrencyCop(val);
  }

  restablecerSeed(): void {
    if (confirm('¿Desea restablecer todos los datos de prueba a los valores iniciales semilla de la Gobernación del Cauca?')) {
      this.licoresService.restablecerValoresIniciales();
      this.mensajeExito.set('Base de datos y catálogo restablecidos a los valores semilla iniciales.');
      setTimeout(() => this.mensajeExito.set(null), 5000);
    }
  }
}
