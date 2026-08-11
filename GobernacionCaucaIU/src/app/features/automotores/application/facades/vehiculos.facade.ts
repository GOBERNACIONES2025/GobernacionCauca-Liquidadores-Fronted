import { inject, Injectable, signal } from '@angular/core';
import { VehiculosApiService } from '../../infrastructure/api/vehiculos-api.service';
import { Vehiculo } from '../../domain/models/vehiculo.model';

@Injectable({
  providedIn: 'root',
})
export class VehiculosFacade {
  private api = inject(VehiculosApiService);

  readonly vehiculo = signal<Vehiculo | null>(null);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  buscarPropietario(dni: string){
    this.loading.set(true);
    this.error.set(null);

    this.api.obtenerPropietarios(dni).subscribe({
      next: (data) => {
        console.log(data);
        this.vehiculo.set(data);
        this.loading.set(false);
      },
      error: (err) => {
          this.error.set('No se encontró el vehículo con la placa especificada.');
          this.loading.set(false);
        },
    });
  }
}
