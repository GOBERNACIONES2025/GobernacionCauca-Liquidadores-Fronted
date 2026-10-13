import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VehiculoKpis } from '../../../../domain/models/vehiculo.model';

@Component({
  selector: 'app-vehiculos-kpi-cards',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vehiculos-kpi-cards.component.html'
})
export class VehiculosKpiCardsComponent {
  @Input() kpis!: VehiculoKpis;
  @Input() totalVehiculos: number = 0;
  @Input() filtroEstado: string = 'Todos';
  @Input() countActivos: number = 0;
  @Input() countInactivos: number = 0;

  @Output() filtrarPorEstado = new EventEmitter<string>();
  @Output() abrirPendientes = new EventEmitter<void>();

  onFiltrar(estado: string): void {
    if (this.filtroEstado === estado) {
      this.filtrarPorEstado.emit('Todos');
    } else {
      this.filtrarPorEstado.emit(estado);
    }
  }
}
