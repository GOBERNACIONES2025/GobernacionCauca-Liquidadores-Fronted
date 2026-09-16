import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeclaracionSobretasa } from '../../../domain/models/sobretasa-gasolina.models';
import { SobretasaService } from '../../../application/sobretasa.service';
import { formatMoneyCop } from '../../../domain/calculator/sobretasa-tax-calculator';

@Component({
  selector: 'app-pse-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pse-modal.html',
})
export class PseModalComponent {
  private sobretasaService = inject(SobretasaService);

  @Input() declaracion!: DeclaracionSobretasa;
  @Output() cerrar = new EventEmitter<void>();
  @Output() pagoCompletado = new EventEmitter<void>();

  bancos = [
    'Bancolombia S.A.',
    'Banco de Bogotá',
    'Davivienda',
    'BBVA Colombia',
    'Banco de Occidente',
    'Banco Popular',
    'Banco AV Villas',
    'Scotiabank Colpatria',
  ];

  bancoSeleccionado = 'Bancolombia S.A.';
  tipoPersona: 'JURIDICA' | 'NATURAL' = 'JURIDICA';
  emailPagador = 'tesoreria@distribuidor.com';
  nombrePagador = '';

  procesando = false;
  resultadoPago: { exito: boolean; ref: string; cus: string } | null = null;

  ngOnInit(): void {
    if (this.declaracion) {
      this.nombrePagador = this.declaracion.mayorista.razonSocial;
      this.emailPagador = this.declaracion.mayorista.email;
    }
  }

  procesarPago(): void {
    this.procesando = true;
    setTimeout(() => {
      const res = this.sobretasaService.pagarPse(this.declaracion.id, this.bancoSeleccionado);
      this.resultadoPago = res;
      this.procesando = false;
      this.pagoCompletado.emit();
    }, 1200);
  }

  formatCop(val: number): string {
    return formatMoneyCop(val);
  }
}
