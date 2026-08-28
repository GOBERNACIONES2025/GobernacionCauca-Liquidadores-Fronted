import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../core/services/base-api.service';
import { ApiResponse, PagedResult } from '../../domain/interfaces/api-response.interface';
import { 
  PropietarioDto, 
  PropietarioFiltros, 
  CreatePropietarioRequest, 
  UpdatePropietarioRequest, 
  ExpedienteDto 
} from '../../domain/interfaces/propietario.interface';

@Injectable({
  providedIn: 'root',
})
export class PropietariosApiService {
  private api = inject(BaseApiService);

  getPropietarios(filtros?: PropietarioFiltros): Observable<ApiResponse<PagedResult<PropietarioDto>>> {
    const params: Record<string, string | number | boolean> = {};
    if (filtros?.page) params['page'] = filtros.page;
    if (filtros?.pageSize) params['pageSize'] = filtros.pageSize;
    if (filtros?.buscar) params['buscar'] = filtros.buscar;
    if (filtros?.soloActivos !== undefined) params['soloActivos'] = filtros.soloActivos;

    return this.api.get<ApiResponse<PagedResult<PropietarioDto>>>('/propietarios', { params }, 'AUTOMOTORES');
  }

  getPropietarioById(id: number): Observable<ApiResponse<PropietarioDto>> {
    return this.api.get<ApiResponse<PropietarioDto>>(`/propietarios/${id}`, {}, 'AUTOMOTORES');
  }

  getPropietarioByDocumento(tipo: string | number, numero: string): Observable<ApiResponse<PropietarioDto>> {
    const numLimpio = (numero || '').replace(/[^0-9a-zA-Z]/g, '').trim();
    return this.api.get<ApiResponse<PropietarioDto>>(`/propietarios/documento/${tipo}/${numLimpio}`, {}, 'AUTOMOTORES');
  }

  getExpediente(id: number): Observable<ApiResponse<ExpedienteDto>> {
    return this.api.get<ApiResponse<ExpedienteDto>>(`/propietarios/${id}/expediente`, {}, 'AUTOMOTORES');
  }

  crearPropietario(payload: CreatePropietarioRequest): Observable<ApiResponse<PropietarioDto>> {
    return this.api.post<ApiResponse<PropietarioDto>>('/propietarios', payload, {}, 'AUTOMOTORES');
  }

  actualizarPropietario(id: number, payload: UpdatePropietarioRequest): Observable<ApiResponse<PropietarioDto>> {
    return this.api.put<ApiResponse<PropietarioDto>>(`/propietarios/${id}`, payload, {}, 'AUTOMOTORES');
  }

  desactivarPropietario(id: number): Observable<ApiResponse<any>> {
    return this.api.delete<ApiResponse<any>>(`/propietarios/${id}`, {}, 'AUTOMOTORES');
  }
}
