import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LiquidacionLicores } from '../../../domain/models/licores.models';

@Component({
  selector: 'app-legalizar-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './legalizar-modal.component.html',
})
export class LegalizarModalComponent {
  @Input({ required: true }) liquidacion!: LiquidacionLicores;
  @Output() legalizar = new EventEmitter<{ id: string; funcionario: string; acta: string }>();
  @Output() cerrar = new EventEmitter<void>();

  nombreFuncionario = 'Insp. Hernán Caicedo (Puesto de Control Santander de Quilichao)';
  numeroActa = `ACT-LEG-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  observacionPuntoControl = 'Cargamento verificado en punto de control. Precintos de seguridad intactos, coincidencia física de seriales de estampillas y botellas descargadas en bodega autorizada.';

  procesando = signal<boolean>(false);

  confirmarLegalizacion(): void {
    this.procesando.set(true);
    setTimeout(() => {
      this.procesando.set(false);
      this.legalizar.emit({
        id: this.liquidacion.id,
        funcionario: this.nombreFuncionario,
        acta: this.numeroActa,
      });
    }, 1000);
  }
}
