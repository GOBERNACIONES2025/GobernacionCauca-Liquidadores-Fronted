import { Component, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VehiculosFacade } from '../../../../application/facades/vehiculos.facade';
import { VehiculoItem } from '../../../../domain/models/vehiculo.model';

@Component({
  selector: 'app-vehiculos-pendientes-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vehiculos-pendientes-modal.html'
})
export class VehiculosPendientesModalComponent {
  readonly facade = inject(VehiculosFacade);

  @Output() cerrar = new EventEmitter<void>();
  @Output() verDetalle = new EventEmitter<VehiculoItem>();
  @Output() cambiarEstado = new EventEmitter<{ id: number; estado: string }>();

  onCambiarEstado(id: number, estado: string): void {
    this.cambiarEstado.emit({ id, estado });
  }
}
