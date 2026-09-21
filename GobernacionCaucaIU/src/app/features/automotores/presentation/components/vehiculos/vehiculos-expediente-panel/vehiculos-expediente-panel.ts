import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VehiculoItem } from '../../../../domain/models/vehiculo.model';
import { VehiculosFacade } from '../../../../application/facades/vehiculos.facade';

@Component({
  selector: 'app-vehiculos-expediente-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vehiculos-expediente-panel.html'
})
export class VehiculosExpedientePanelComponent {
  readonly facade = inject(VehiculosFacade);

  @Input({ required: true }) vehiculo!: VehiculoItem;
  @Output() cerrar = new EventEmitter<void>();
  @Output() editar = new EventEmitter<VehiculoItem>();
  @Output() consultarRunt = new EventEmitter<string>();
  @Output() inactivar = new EventEmitter<VehiculoItem>();
}
