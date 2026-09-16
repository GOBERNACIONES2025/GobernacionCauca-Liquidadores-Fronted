import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InformacionTransporte, ItemLote, LiquidacionLicores, ProductoLicor } from '../../../domain/models/licores.models';
import { formatCurrencyCop } from '../../../domain/calculator/licores-tax-calculator';

@Component({
  selector: 'app-subsanar-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './subsanar-modal.component.html',
})
export class SubsanarModalComponent implements OnInit {
  @Input({ required: true }) liquidacion!: LiquidacionLicores;
  @Input({ required: true }) catalogo: ProductoLicor[] = [];
  @Output() subsanar = new EventEmitter<{
    id: string;
    motivo: string;
    items: { producto: ProductoLicor; cantidad: number }[];
    transporte: InformacionTransporte;
  }>();
  @Output() cerrar = new EventEmitter<void>();

  motivoSubsanacion = '';
  transporteCopia!: InformacionTransporte;
  itemsEditables: { producto: ProductoLicor; cantidad: number }[] = [];

  ngOnInit(): void {
    this.transporteCopia = JSON.parse(JSON.stringify(this.liquidacion.transporte));
    this.itemsEditables = this.liquidacion.items.map((it: ItemLote) => ({
      producto: it.producto,
      cantidad: it.cantidad,
    }));
  }

  formatMoney(val: number): string {
    return formatCurrencyCop(val);
  }

  cambiarCantidad(idx: number, delta: number): void {
    const nueva = this.itemsEditables[idx].cantidad + delta;
    if (nueva >= 1) {
      this.itemsEditables[idx].cantidad = nueva;
    }
  }

  guardarYReenviar(): void {
    if (!this.motivoSubsanacion.trim()) return;

    this.subsanar.emit({
      id: this.liquidacion.id,
      motivo: this.motivoSubsanacion,
      items: this.itemsEditables,
      transporte: this.transporteCopia,
    });
  }
}
