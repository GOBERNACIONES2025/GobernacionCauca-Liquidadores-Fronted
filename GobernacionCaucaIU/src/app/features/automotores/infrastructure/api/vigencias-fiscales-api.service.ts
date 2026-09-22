import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../core/services/base-api.service';
import { ApiResponse, PagedResult } from '../../domain/interfaces/api-response.interface';
import {
  VigenciaFiscalDto,
  CreateVigenciaFiscalRequest,
  UpdateVigenciaFiscalRequest,
  FiltrosVigenciaFiscal
} from '../../domain/interfaces/vigencia-fiscal.interface';

@Injectable({
  providedIn: 'root'
})
export class VigenciasFiscalesApiService {
  private api = inject(BaseApiService);
  private readonly targetModule = 'AUTOMOTORES';
  private readonly endpoint = 'VigenciasFiscales';

  /**
   * Obtiene la lista paginada de vigencias fiscales con filtros opcionales.
   */
  getVigenciasPaged(filtros?: FiltrosVigenciaFiscal): Observable<ApiResponse<PagedResult<VigenciaFiscalDto>> | ApiResponse<VigenciaFiscalDto[]> | VigenciaFiscalDto[]> {
    const params: Record<string, any> = {};

    if (filtros) {
      if (filtros.pageNumber) params['pageNumber'] = filtros.pageNumber;
      if (filtros.pageSize) params['pageSize'] = filtros.pageSize;
      if (filtros.searchTerm && filtros.searchTerm.trim() !== '') params['searchTerm'] = filtros.searchTerm.trim();
      if (filtros.anio) params['anio'] = filtros.anio;
      if (filtros.activa !== undefined && filtros.activa !== null) params['activa'] = filtros.activa;
    }

    return this.api.get<any>(this.endpoint, { params }, this.targetModule);
  }

  /**
   * Obtiene la vigencia fiscal activa configurada en el sistema.
   */
  getVigenciaActiva(): Observable<ApiResponse<VigenciaFiscalDto>> {
    return this.api.get<ApiResponse<VigenciaFiscalDto>>(`${this.endpoint}/activa`, {}, this.targetModule);
  }

  /**
   * Obtiene los detalles de una vigencia fiscal por su año.
   */
  getVigenciaByAnio(anio: number): Observable<ApiResponse<VigenciaFiscalDto>> {
    return this.api.get<ApiResponse<VigenciaFiscalDto>>(`${this.endpoint}/anio/${anio}`, {}, this.targetModule);
  }

  /**
   * Obtiene los detalles de una vigencia fiscal por su ID.
   */
  getVigenciaById(id: number): Observable<ApiResponse<VigenciaFiscalDto>> {
    return this.api.get<ApiResponse<VigenciaFiscalDto>>(`${this.endpoint}/${id}`, {}, this.targetModule);
  }

  /**
   * Registra una nueva vigencia fiscal en el sistema.
   */
  crearVigencia(payload: CreateVigenciaFiscalRequest): Observable<ApiResponse<number | VigenciaFiscalDto>> {
    return this.api.post<ApiResponse<number | VigenciaFiscalDto>>(this.endpoint, payload, {}, this.targetModule);
  }

  /**
   * Actualiza una vigencia fiscal existente.
   */
  actualizarVigencia(id: number, payload: UpdateVigenciaFiscalRequest): Observable<ApiResponse<boolean | VigenciaFiscalDto>> {
    return this.api.put<ApiResponse<boolean | VigenciaFiscalDto>>(`${this.endpoint}/${id}`, payload, {}, this.targetModule);
  }

  /**
   * Cambia el estado activo/inactivo de una vigencia fiscal.
   */
  toggleActiva(id: number, activa: boolean): Observable<ApiResponse<boolean>> {
    return this.api.patch<ApiResponse<boolean>>(`${this.endpoint}/${id}/activa`, { activa }, {}, this.targetModule);
  }

  /**
   * Elimina físicamente una vigencia fiscal si no posee dependencias activas.
   */
  eliminarVigencia(id: number): Observable<ApiResponse<boolean>> {
    return this.api.delete<ApiResponse<boolean>>(`${this.endpoint}/${id}`, {}, this.targetModule);
  }
}
