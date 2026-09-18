import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../core/services/base-api.service';
import { ApiResponse, PagedResult } from '../../domain/interfaces/api-response.interface';
import {
  ExencionTributariaDto,
  CreateExencionTributariaRequest,
  UpdateExencionTributariaRequest,
  FiltrosExencionTributaria
} from '../../domain/interfaces/exenciones-tributarias.interface';

@Injectable({
  providedIn: 'root'
})
export class ExencionesTributariasApiService {
  private api = inject(BaseApiService);
  private readonly targetModule = 'AUTOMOTORES';
  private readonly endpoint = 'ExencionesTributarias';

  /**
   * Obtiene la lista paginada de exenciones tributarias con filtros opcionales.
   */
  getExencionesPaged(filtros?: FiltrosExencionTributaria): Observable<ApiResponse<PagedResult<ExencionTributariaDto>> | ApiResponse<ExencionTributariaDto[]> | ExencionTributariaDto[]> {
    const params: Record<string, any> = {};

    if (filtros) {
      if (filtros.pageNumber) params['pageNumber'] = filtros.pageNumber;
      if (filtros.pageSize) params['pageSize'] = filtros.pageSize;
      if (filtros.search && filtros.search.trim() !== '') params['search'] = filtros.search.trim();
      if (filtros.vigenciaFiscalId) params['vigenciaFiscalId'] = filtros.vigenciaFiscalId;
      if (filtros.departamentoId) params['departamentoId'] = filtros.departamentoId;
      if (filtros.normaTributariaId) params['normaTributariaId'] = filtros.normaTributariaId;
      if (filtros.ambito && filtros.ambito !== 'TODOS') params['ambito'] = filtros.ambito;
      if (filtros.tipoBeneficio && filtros.tipoBeneficio !== 'TODOS') params['tipoBeneficio'] = filtros.tipoBeneficio;
      if (filtros.activa !== undefined && filtros.activa !== null) params['activa'] = filtros.activa;
    }

    return this.api.get<any>(this.endpoint, { params }, this.targetModule);
  }

  /**
   * Obtiene los detalles de una exención tributaria por su ID.
   */
  getExencionById(id: number): Observable<ApiResponse<ExencionTributariaDto>> {
    return this.api.get<ApiResponse<ExencionTributariaDto>>(`${this.endpoint}/${id}`, {}, this.targetModule);
  }

  /**
   * Registra una nueva exención tributaria en el sistema.
   * El código debe ser único dentro de la misma vigencia fiscal y departamento.
   */
  crearExencion(payload: CreateExencionTributariaRequest): Observable<ApiResponse<number | ExencionTributariaDto>> {
    return this.api.post<ApiResponse<number | ExencionTributariaDto>>(this.endpoint, payload, {}, this.targetModule);
  }

  /**
   * Actualiza una exención tributaria existente.
   */
  actualizarExencion(id: number, payload: UpdateExencionTributariaRequest): Observable<ApiResponse<boolean | ExencionTributariaDto>> {
    return this.api.put<ApiResponse<boolean | ExencionTributariaDto>>(`${this.endpoint}/${id}`, payload, {}, this.targetModule);
  }

  /**
   * Elimina físicamente una exención tributaria del sistema.
   */
  eliminarExencion(id: number): Observable<ApiResponse<boolean>> {
    return this.api.delete<ApiResponse<boolean>>(`${this.endpoint}/${id}`, {}, this.targetModule);
  }

  /**
   * Cambia el estado (Activa / Inactiva) de una exención tributaria sin modificar sus demás campos.
   */
  toggleActiva(id: number, activa: boolean): Observable<ApiResponse<boolean>> {
    return this.api.patch<ApiResponse<boolean>>(`${this.endpoint}/${id}/activa`, { activa }, {}, this.targetModule);
  }
}
