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
  @Input() countsPorEstado: Record<string, number> = {};

  @Output() filtrarPorEstado = new EventEmitter<string>();
  @Output() abrirPendientes = new EventEmitter<void>();

  onFiltrar(estado: string): void {
    if (this.filtroEstado.toUpperCase() === estado.toUpperCase()) {
      this.filtrarPorEstado.emit('Todos');
    } else {
      this.filtrarPorEstado.emit(estado);
    }
  }

  isEstadoActivo(estado: string): boolean {
    return this.filtroEstado.toUpperCase() === estado.toUpperCase();
  }

  getCount(estado: string): number {
    return this.countsPorEstado?.[estado] ?? 0;
  }

  get totalVehiculosRegistrados(): number {
    const sum = Object.values(this.countsPorEstado || {}).reduce((acc, val) => acc + (val || 0), 0);
    if (sum > 0) return sum;
    return this.totalVehiculos > 0 ? this.totalVehiculos : (this.kpis?.totalVehiculos ?? 0);
  }
}
