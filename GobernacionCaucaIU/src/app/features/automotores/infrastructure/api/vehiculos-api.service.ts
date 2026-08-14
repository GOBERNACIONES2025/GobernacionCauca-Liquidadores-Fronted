import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../core/services/base-api.service';
import { Vehiculo } from '../../domain/models/vehiculo.model';

@Injectable({
  providedIn: 'root',
})
export class VehiculosApiService {
  private api = inject(BaseApiService);

  obtenerPropietarios(dni:string): Observable<Vehiculo> {
    return this.api.get<Vehiculo>(`/Propietarios`,{}, 'AUTOMOTORES')
  }


}
