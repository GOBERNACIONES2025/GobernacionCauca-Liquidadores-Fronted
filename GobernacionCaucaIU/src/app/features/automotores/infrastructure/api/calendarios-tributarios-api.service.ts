import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../core/services/base-api.service';
import { ApiResponse, PagedResult } from '../../domain/interfaces/api-response.interface';
import {
  CalendarioTributarioDto,
  CreateCalendarioTributarioRequest,
  UpdateCalendarioTributarioRequest,
  FiltrosCalendarioTributario
} from '../../domain/interfaces/calendarios-tributarios.interface';

@Injectable({
  providedIn: 'root'
})
export class CalendariosTributariosApiService {
  private api = inject(BaseApiService);
  private readonly targetModule = 'AUTOMOTORES';
  private readonly endpoint = 'CalendariosTributarios';

  /**
   * Obtiene la lista paginada de calendarios tributarios con filtros opcionales.
   */
  getCalendariosPaged(filtros?: FiltrosCalendarioTributario): Observable<ApiResponse<PagedResult<CalendarioTributarioDto>> | ApiResponse<CalendarioTributarioDto[]> | CalendarioTributarioDto[]> {
    const params: Record<string, any> = {};

    if (filtros) {
      if (filtros.pageNumber) params['pageNumber'] = filtros.pageNumber;
      if (filtros.pageSize) params['pageSize'] = filtros.pageSize;
      if (filtros.searchTerm && filtros.searchTerm.trim() !== '') params['searchTerm'] = filtros.searchTerm.trim();
      if (filtros.vigenciaFiscalId) params['vigenciaFiscalId'] = filtros.vigenciaFiscalId;
      if (filtros.normaTributariaId) params['normaTributariaId'] = filtros.normaTributariaId;
      if (filtros.codigoImpuesto && filtros.codigoImpuesto.trim() !== '') params['codigoImpuesto'] = filtros.codigoImpuesto.trim();
      if (filtros.activo !== undefined && filtros.activo !== null) params['activo'] = filtros.activo;
      if (filtros.sortColumn) params['sortColumn'] = filtros.sortColumn;
      if (filtros.sortDescending !== undefined) params['sortDescending'] = filtros.sortDescending;
    }

    return this.api.get<any>(this.endpoint, { params }, this.targetModule);
  }

  /**
   * Obtiene los detalles de un calendario tributario por su ID.
   */
  getCalendarioById(id: number): Observable<ApiResponse<CalendarioTributarioDto>> {
    return this.api.get<ApiResponse<CalendarioTributarioDto>>(`${this.endpoint}/${id}`, {}, this.targetModule);
  }

  /**
   * Registra un nuevo calendario tributario.
   */
  crearCalendario(payload: CreateCalendarioTributarioRequest): Observable<ApiResponse<number | CalendarioTributarioDto>> {
    return this.api.post<ApiResponse<number | CalendarioTributarioDto>>(this.endpoint, payload, {}, this.targetModule);
  }

  /**
   * Actualiza un calendario tributario existente.
   */
  actualizarCalendario(id: number, payload: UpdateCalendarioTributarioRequest): Observable<ApiResponse<boolean | CalendarioTributarioDto>> {
    return this.api.put<ApiResponse<boolean | CalendarioTributarioDto>>(`${this.endpoint}/${id}`, payload, {}, this.targetModule);
  }

  /**
   * Elimina físicamente un calendario tributario del sistema.
   */
  eliminarCalendario(id: number): Observable<ApiResponse<boolean>> {
    return this.api.delete<ApiResponse<boolean>>(`${this.endpoint}/${id}`, {}, this.targetModule);
  }

  /**
   * Cambia el estado (Activo / Inactivo) de un calendario tributario.
   */
  toggleActivo(id: number, activo: boolean): Observable<ApiResponse<boolean>> {
    return this.api.patch<ApiResponse<boolean>>(`${this.endpoint}/${id}/activo`, { activo }, {}, this.targetModule);
  }
}
