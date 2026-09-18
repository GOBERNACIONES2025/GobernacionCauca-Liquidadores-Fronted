import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../core/services/base-api.service';
import { ApiResponse, PagedResult } from '../../domain/interfaces/api-response.interface';
import {
  TarifaTributariaDto,
  CreateTarifaTributariaRequest,
  UpdateTarifaTributariaRequest,
  FiltrosTarifaTributaria
} from '../../domain/interfaces/tarifas-tributarias.interface';

@Injectable({
  providedIn: 'root'
})
export class TarifasTributariasApiService {
  private api = inject(BaseApiService);
  private readonly targetModule = 'AUTOMOTORES';
  private readonly endpoint = 'TarifasTributarias';

  /**
   * Obtiene la lista paginada de tarifas tributarias con filtros opcionales.
   */
  getTarifasPaged(filtros?: FiltrosTarifaTributaria): Observable<ApiResponse<PagedResult<TarifaTributariaDto>> | ApiResponse<TarifaTributariaDto[]> | TarifaTributariaDto[]> {
    const params: Record<string, any> = {};

    if (filtros) {
      if (filtros.pageNumber) params['pageNumber'] = filtros.pageNumber;
      if (filtros.pageSize) params['pageSize'] = filtros.pageSize;
      if (filtros.search && filtros.search.trim() !== '') params['search'] = filtros.search.trim();
      if (filtros.vigenciaFiscalId) params['vigenciaFiscalId'] = filtros.vigenciaFiscalId;
      if (filtros.departamentoId) params['departamentoId'] = filtros.departamentoId;
      if (filtros.claseVehiculoId) params['claseVehiculoId'] = filtros.claseVehiculoId;
      if (filtros.servicioVehiculoId) params['servicioVehiculoId'] = filtros.servicioVehiculoId;
      if (filtros.combustibleId) params['combustibleId'] = filtros.combustibleId;
      if (filtros.normaTributariaId) params['normaTributariaId'] = filtros.normaTributariaId;
      if (filtros.activa !== undefined && filtros.activa !== null) params['activa'] = filtros.activa;
    }

    return this.api.get<any>(this.endpoint, { params }, this.targetModule);
  }

  /**
   * Obtiene los detalles de una tarifa tributaria por su ID.
   */
  getTarifaById(id: number): Observable<ApiResponse<TarifaTributariaDto>> {
    return this.api.get<ApiResponse<TarifaTributariaDto>>(`${this.endpoint}/${id}`, {}, this.targetModule);
  }

  /**
   * Registra una nueva tarifa tributaria en el sistema.
   */
  crearTarifa(payload: CreateTarifaTributariaRequest): Observable<ApiResponse<number | TarifaTributariaDto>> {
    return this.api.post<ApiResponse<number | TarifaTributariaDto>>(this.endpoint, payload, {}, this.targetModule);
  }

  /**
   * Actualiza una tarifa tributaria existente.
   */
  actualizarTarifa(id: number, payload: UpdateTarifaTributariaRequest): Observable<ApiResponse<boolean | TarifaTributariaDto>> {
    return this.api.put<ApiResponse<boolean | TarifaTributariaDto>>(`${this.endpoint}/${id}`, payload, {}, this.targetModule);
  }

  /**
   * Elimina físicamente una tarifa tributaria del sistema.
   */
  eliminarTarifa(id: number): Observable<ApiResponse<boolean>> {
    return this.api.delete<ApiResponse<boolean>>(`${this.endpoint}/${id}`, {}, this.targetModule);
  }

  /**
   * Cambia el estado (Activa / Inactiva) de una tarifa tributaria sin modificar sus demás campos.
   */
  toggleActiva(id: number, activa: boolean): Observable<ApiResponse<boolean>> {
    return this.api.patch<ApiResponse<boolean>>(`${this.endpoint}/${id}/activa`, { activa }, {}, this.targetModule);
  }
}
