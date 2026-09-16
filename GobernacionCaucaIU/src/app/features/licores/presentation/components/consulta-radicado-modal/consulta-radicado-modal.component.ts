import { Component, EventEmitter, inject, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LicoresService } from '../../../application/licores.service';
import { LiquidacionLicores } from '../../../domain/models/licores.models';
import { formatCurrencyCop } from '../../../domain/calculator/licores-tax-calculator';

@Component({
  selector: 'app-consulta-radicado-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './consulta-radicado-modal.component.html',
})
export class ConsultaRadicadoModalComponent {
  private licoresService = inject(LicoresService);

  @Output() verTornaguia = new EventEmitter<LiquidacionLicores>();
  @Output() verLiquidacionPdf = new EventEmitter<LiquidacionLicores>();
  @Output() pagarPse = new EventEmitter<LiquidacionLicores>();
  @Output() cerrar = new EventEmitter<void>();

  terminoBusqueda = '';
  resultado = signal<LiquidacionLicores | null | undefined>(undefined);
  buscado = signal<boolean>(false);

  formatMoney(val: number): string {
    return formatCurrencyCop(val);
  }

  buscar(): void {
    if (!this.terminoBusqueda.trim()) return;
    this.buscado.set(true);

    const term = this.terminoBusqueda.trim().toUpperCase();
    let res = this.licoresService.buscarPorRadicado(term);
    if (!res) {
      res = this.licoresService.buscarPorTornaguia(term);
    }
    this.resultado.set(res || null);
  }
}
