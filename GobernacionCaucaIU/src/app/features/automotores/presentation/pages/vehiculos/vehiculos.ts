import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VehiculosFacade } from '../../../application/facades/vehiculos.facade';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-vehiculos',
  standalone: true,
  imports: [CommonModule , FormsModule],
  templateUrl: './vehiculos.html',
})
export class Vehiculos {
  readonly fecade_vehiculos = inject(VehiculosFacade);
  readonly dni = signal<string>('');

  onBuscar(): void {
    const dni = this.dni().trim();
    if(dni){
      var d = this.fecade_vehiculos.buscarPropietario(dni);
      console.log(d);
    }
  }
}
