import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../core/services/base-api.service';
import { Vehiculo } from '../../domain/models/vehiculo.model';

@Injectable({
  providedIn: 'root',
})
export class VehiculosApiService {
  private api = inject(BaseApiService);

  /**
   * Obtiene un vehiculo por su placa consumiendo la API de Automotores.
   * La Base URL es resuelta dinamicamente por el BaseApiService para 'AUTOMOTORES'.
   */
  obtenerPorPlaca(placa: string): Observable<Vehiculo> {
    // LLamada limpia utilizando el servicio generico del core
    return this.api.get<Vehiculo>(`vehiculos/${placa}`, {}, 'AUTOMOTORES');
  }

  /**
   * Registra un nuevo vehiculo en el sistema
   */
  crearVehiculo(vehiculo: Partial<Vehiculo>): Observable<Vehiculo> {
    return this.api.post<Vehiculo>('vehiculos', vehiculo, {}, 'AUTOMOTORES');
  }
}
