import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LiquidacionLicores } from '../../../domain/models/licores.models';
import { formatCurrencyCop } from '../../../domain/calculator/licores-tax-calculator';

@Component({
  selector: 'app-auditoria-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auditoria-modal.component.html',
})
export class AuditoriaModalComponent {
  @Input({ required: true }) liquidacion!: LiquidacionLicores;
  @Input() esFuncionario = false;
  @Output() aprobar = new EventEmitter<{ id: string; observacion: string }>();
  @Output() requerir = new EventEmitter<{ id: string; motivo: string }>();
  @Output() rechazar = new EventEmitter<{ id: string; motivo: string }>();
  @Output() cerrar = new EventEmitter<void>();

  modoAccion = signal<'DETALLE' | 'REQUERIR' | 'RECHAZAR' | 'APROBAR'>('DETALLE');
  observacionTexto = '';

  formatMoney(val: number): string {
    return formatCurrencyCop(val);
  }

  iniciarAprobacion(): void {
    this.observacionTexto = 'Liquidación y declaración de embarque revisada conforme a Ley 1816 de 2016 y valores DANE. Se autoriza la emisión de la liquidación oficial para recaudo.';
    this.modoAccion.set('APROBAR');
  }

  iniciarRequerimiento(): void {
    this.observacionTexto = '';
    this.modoAccion.set('REQUERIR');
  }

  iniciarRechazo(): void {
    this.observacionTexto = '';
    this.modoAccion.set('RECHAZAR');
  }

  cancelarAccion(): void {
    this.modoAccion.set('DETALLE');
    this.observacionTexto = '';
  }

  confirmarAprobar(): void {
    this.aprobar.emit({
      id: this.liquidacion.id,
      observacion: this.observacionTexto,
    });
  }

  confirmarRequerir(): void {
    if (!this.observacionTexto.trim()) return;
    this.requerir.emit({
      id: this.liquidacion.id,
      motivo: this.observacionTexto,
    });
  }

  confirmarRechazar(): void {
    if (!this.observacionTexto.trim()) return;
    this.rechazar.emit({
      id: this.liquidacion.id,
      motivo: this.observacionTexto,
    });
  }
}
