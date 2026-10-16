import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VehiculoItem } from '../../../../domain/models/vehiculo.model';

@Component({
  selector: 'app-vehiculos-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vehiculos-table.component.html'
})
export class VehiculosTableComponent implements OnChanges {
  @Input() vehiculos: VehiculoItem[] = [];
  @Input() loading: boolean = false;
  @Input() totalRegistros: number = 0;
  @Input() paginaActual: number = 1;
  @Input() totalPaginas: number = 1;
  @Input() filtroTexto: string = '';
  @Input() filtroEstado: string = 'Todos';
  @Input() filtroTipo: string = 'Todos';

  @Output() searchEnter = new EventEmitter<string>();
  @Output() estadoChange = new EventEmitter<string>();
  @Output() tipoChange = new EventEmitter<string>();
  @Output() refrescar = new EventEmitter<void>();
  @Output() seleccionarVehiculo = new EventEmitter<VehiculoItem>();
  @Output() editarVehiculo = new EventEmitter<VehiculoItem>();
  @Output() cambiarPagina = new EventEmitter<number>();

  textoLocal: string = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['filtroTexto']) {
      this.textoLocal = this.filtroTexto || '';
    }
  }

  onSearchEnter(): void {
    this.searchEnter.emit(this.textoLocal.trim());
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
