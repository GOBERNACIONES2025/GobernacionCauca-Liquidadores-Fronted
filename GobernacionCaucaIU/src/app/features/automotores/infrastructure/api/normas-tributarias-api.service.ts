import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../core/services/base-api.service';
import { ApiResponse, PagedResult } from '../../domain/interfaces/api-response.interface';
import {
  NormaTributariaDto,
  CreateNormaTributariaRequest,
  UpdateNormaTributariaRequest,
  FiltrosNormaTributaria
} from '../../domain/interfaces/normas-tributarias.interface';

@Injectable({
  providedIn: 'root'
})
export class NormasTributariasApiService {
  private api = inject(BaseApiService);
  private readonly targetModule = 'AUTOMOTORES';
  private readonly endpoint = 'NormasTributarias';

  /**
   * Obtiene la lista paginada de normas tributarias con filtros opcionales.
   */
  getNormasPaged(filtros?: FiltrosNormaTributaria): Observable<ApiResponse<PagedResult<NormaTributariaDto>> | ApiResponse<NormaTributariaDto[]> | NormaTributariaDto[]> {
    const params: Record<string, any> = {};

    if (filtros) {
      if (filtros.pageNumber) params['pageNumber'] = filtros.pageNumber;
      if (filtros.pageSize) params['pageSize'] = filtros.pageSize;
      if (filtros.search && filtros.search.trim() !== '') params['searchTerm'] = filtros.search.trim();
      if (filtros.tipoNorma && filtros.tipoNorma !== 'TODOS') params['tipoNorma'] = filtros.tipoNorma;
      if (filtros.activa !== undefined && filtros.activa !== null) params['activa'] = filtros.activa;
    }

    return this.api.get<any>(this.endpoint, { params }, this.targetModule);
  }

  /**
   * Obtiene los detalles de una norma tributaria por su ID.
   */
  getNormaById(id: number): Observable<ApiResponse<NormaTributariaDto>> {
    return this.api.get<ApiResponse<NormaTributariaDto>>(`${this.endpoint}/${id}`, {}, this.targetModule);
  }

  /**
   * Registra una nueva norma tributaria en el sistema (con urlFuente ya obtenida de FTP).
   */
  crearNorma(payload: CreateNormaTributariaRequest | FormData): Observable<ApiResponse<number | NormaTributariaDto>> {
    return this.api.post<ApiResponse<number | NormaTributariaDto>>(this.endpoint, payload, {}, this.targetModule);
  }

  /**
   * Actualiza una norma tributaria existente (con urlFuente).
   */
  actualizarNorma(id: number, payload: UpdateNormaTributariaRequest | FormData): Observable<ApiResponse<boolean | NormaTributariaDto>> {
    return this.api.put<ApiResponse<boolean | NormaTributariaDto>>(`${this.endpoint}/${id}`, payload, {}, this.targetModule);
  }

  /**
   * Cambia el estado (Activa / Inactiva) de una norma tributaria (PATCH).
   */
  toggleActiva(id: number, activa: boolean): Observable<ApiResponse<boolean>> {
    return this.api.patch<ApiResponse<boolean>>(`${this.endpoint}/${id}/activa`, { activa }, {}, this.targetModule);
  }

  /**
   * Elimina físicamente una norma tributaria del sistema y su archivo asociado en FTP.
   */
  eliminarNorma(id: number): Observable<ApiResponse<boolean>> {
    return this.api.delete<ApiResponse<boolean>>(`${this.endpoint}/${id}`, {}, this.targetModule);
  }
}
