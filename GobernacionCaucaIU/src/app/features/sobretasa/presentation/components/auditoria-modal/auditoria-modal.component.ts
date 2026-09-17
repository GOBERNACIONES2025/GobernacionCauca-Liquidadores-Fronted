import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeclaracionSobretasa } from '../../../domain/models/sobretasa-gasolina.models';
import { formatCurrencyCop } from '../../../domain/calculator/sobretasa-tax-calculator';

@Component({
  selector: 'app-sobretasa-auditoria-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auditoria-modal.component.html',
})
export class SobretasaAuditoriaModalComponent {
  @Input({ required: true }) declaracion!: DeclaracionSobretasa;
  @Input() esFuncionario = false;
  @Output() aprobar = new EventEmitter<{ id: string; observacion: string }>();
  @Output() requerir = new EventEmitter<{ id: string; motivo: string }>();
  @Output() rechazar = new EventEmitter<{ id: string; motivo: string }>();
  @Output() validarSicom = new EventEmitter<string>();
  @Output() pagarPse = new EventEmitter<DeclaracionSobretasa>();
  @Output() pagarAsobancario = new EventEmitter<DeclaracionSobretasa>();
  @Output() subsanar = new EventEmitter<DeclaracionSobretasa>();
  @Output() verFormulario = new EventEmitter<DeclaracionSobretasa>();
  @Output() cerrar = new EventEmitter<void>();

  modoAccion = signal<'DETALLE' | 'REQUERIR' | 'RECHAZAR' | 'APROBAR'>('DETALLE');
  observacionTexto = '';

  formatMoney(val: number): string {
    return formatCurrencyCop(val);
  }

  iniciarAprobacion(): void {
    this.observacionTexto = 'Declaración y liquidación fiscal de Sobretasa revisada conforme a la Ley 2093 de 2021 y validada contra guías SICOM. Se autoriza la habilitación para pago oficial.';
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
      id: this.declaracion.id,
      observacion: this.observacionTexto,
    });
  }

  confirmarRequerir(): void {
    if (!this.observacionTexto.trim()) return;
    this.requerir.emit({
      id: this.declaracion.id,
      motivo: this.observacionTexto,
    });
  }

  confirmarRechazar(): void {
    if (!this.observacionTexto.trim()) return;
    this.rechazar.emit({
      id: this.declaracion.id,
      motivo: this.observacionTexto,
    });
  }
}
