import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VehiculoItem } from '../../../../domain/models/vehiculo.model';

@Component({
  selector: 'app-vehiculos-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vehiculos-table.component.html'
})
export class VehiculosTableComponent {
  @Input() vehiculos: VehiculoItem[] = [];
  @Input() loading: boolean = false;
  @Input() totalRegistros: number = 0;
  @Input() paginaActual: number = 1;
  @Input() totalPaginas: number = 1;
  @Input() filtroTexto: string = '';
  @Input() filtroEstado: string = 'Todos';
  @Input() filtroTipo: string = 'Todos';

  @Output() searchChange = new EventEmitter<string>();
  @Output() searchEnter = new EventEmitter<string>();
  @Output() estadoChange = new EventEmitter<string>();
  @Output() tipoChange = new EventEmitter<string>();
  @Output() refrescar = new EventEmitter<void>();
  @Output() seleccionarVehiculo = new EventEmitter<VehiculoItem>();
  @Output() editarVehiculo = new EventEmitter<VehiculoItem>();
  @Output() cambiarPagina = new EventEmitter<number>();

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchChange.emit(input.value);
  }

  onSearchEnter(): void {
    this.searchEnter.emit(this.filtroTexto);
  }

  onEstadoChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.estadoChange.emit(select.value);
  }

  onTipoChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.tipoChange.emit(select.value);
  }
}
