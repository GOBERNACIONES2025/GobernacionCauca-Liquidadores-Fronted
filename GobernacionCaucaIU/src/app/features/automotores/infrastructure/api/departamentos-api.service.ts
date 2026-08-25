import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../core/services/base-api.service';
import { ApiResponse } from '../../domain/interfaces/api-response.interface';
import { DepartamentoDto, CiudadDto } from '../../domain/interfaces/geografico.interface';

@Injectable({
  providedIn: 'root',
})
export class DepartamentosApiService {
  private api = inject(BaseApiService);

  getDepartamentos(): Observable<ApiResponse<DepartamentoDto[]> | DepartamentoDto[]> {
    return this.api.get<any>('/departamentos', {}, 'AUTOMOTORES');
  }

  getCiudadesByDepartamento(departamentoId: number): Observable<ApiResponse<CiudadDto[]> | CiudadDto[]> {
    return this.api.get<any>(`/departamentos/${departamentoId}/ciudades`, {}, 'AUTOMOTORES');
  }
}
