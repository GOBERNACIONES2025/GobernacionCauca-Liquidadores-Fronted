import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeclaracionSobretasa } from '../../../domain/models/sobretasa-gasolina.models';
import {
  formatGalones,
  formatMoneyCop,
  TARIFAS_SOBRETASA_2026,
} from '../../../domain/calculator/sobretasa-tax-calculator';

@Component({
  selector: 'app-formulario-oficial-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './formulario-oficial-modal.html',
})
export class FormularioOficialModalComponent {
  @Input() declaracion!: DeclaracionSobretasa;
  @Output() cerrar = new EventEmitter<void>();

  tarifas = TARIFAS_SOBRETASA_2026;

  formatCop(val: number): string {
    return formatMoneyCop(val);
  }

  formatGal(val: number): string {
    return formatGalones(val);
  }

  imprimir(): void {
    window.print();
  }

  getNombreMes(mes: number): string {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ];
    return meses[mes - 1] || `Mes ${mes}`;
  }
}
