import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-vehiculos-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vehiculos-header.component.html'
})
export class VehiculosHeaderComponent {
  @Input() pendientesCount: number = 0;
  @Input() searchTexto: string = '';

  @Output() searchChange = new EventEmitter<string>();
  @Output() searchEnter = new EventEmitter<string>();
  @Output() abrirPendientes = new EventEmitter<void>();
  @Output() abrirRegistro = new EventEmitter<void>();

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchChange.emit(input.value);
  }

  onSearchEnter(): void {
    this.searchEnter.emit(this.searchTexto);
  }
}
