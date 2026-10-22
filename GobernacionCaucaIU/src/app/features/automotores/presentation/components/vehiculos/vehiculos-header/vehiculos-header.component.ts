import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-vehiculos-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vehiculos-header.component.html'
})
export class VehiculosHeaderComponent implements OnChanges {
  @Input() pendientesCount: number = 0;
  @Input() searchTexto: string = '';

  @Output() searchEnter = new EventEmitter<string>();
  @Output() abrirPendientes = new EventEmitter<void>();
  @Output() abrirRegistro = new EventEmitter<void>();

  textoLocal: string = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['searchTexto']) {
      this.textoLocal = this.searchTexto || '';
    }
  }

  onSearchEnter(): void {
    this.searchEnter.emit(this.textoLocal.trim());
  }
}

