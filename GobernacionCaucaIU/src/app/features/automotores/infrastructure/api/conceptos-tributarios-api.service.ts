import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../core/services/base-api.service';
import { ApiResponse, PagedResult } from '../../domain/interfaces/api-response.interface';
import {
  ConceptoTributarioDto,
  CreateConceptoTributarioRequest,
  UpdateConceptoTributarioRequest,
  FiltrosConceptoTributario
} from '../../domain/interfaces/conceptos-tributarios.interface';

@Injectable({
  providedIn: 'root'
})
export class ConceptosTributariosApiService {
  private api = inject(BaseApiService);
  private readonly targetModule = 'AUTOMOTORES';
  private readonly endpoint = 'ConceptosTributarios';

  getConceptosPaged(filtros?: FiltrosConceptoTributario): Observable<any> {
    const params: Record<string, any> = {};
    if (filtros) {
      if (filtros.pageNumber) params['pageNumber'] = filtros.pageNumber;
      if (filtros.pageSize) params['pageSize'] = filtros.pageSize;
      if (filtros.searchTerm && filtros.searchTerm.trim() !== '') params['searchTerm'] = filtros.searchTerm.trim();
      if (filtros.tipoConceptoTributarioId) params['tipoConceptoTributarioId'] = filtros.tipoConceptoTributarioId;
      if (filtros.activo !== undefined && filtros.activo !== null) params['activo'] = filtros.activo;
    }
    return this.api.get<any>(this.endpoint, { params }, this.targetModule);
  }

  getConceptoById(id: number): Observable<ApiResponse<ConceptoTributarioDto>> {
    return this.api.get<ApiResponse<ConceptoTributarioDto>>(`${this.endpoint}/${id}`, {}, this.targetModule);
  }

  crearConcepto(payload: CreateConceptoTributarioRequest): Observable<ApiResponse<number | ConceptoTributarioDto>> {
    return this.api.post<ApiResponse<number | ConceptoTributarioDto>>(this.endpoint, payload, {}, this.targetModule);
  }

  actualizarConcepto(id: number, payload: UpdateConceptoTributarioRequest): Observable<ApiResponse<boolean | ConceptoTributarioDto>> {
    return this.api.put<ApiResponse<boolean | ConceptoTributarioDto>>(`${this.endpoint}/${id}`, payload, {}, this.targetModule);
  }

  eliminarConcepto(id: number): Observable<ApiResponse<boolean>> {
    return this.api.delete<ApiResponse<boolean>>(`${this.endpoint}/${id}`, {}, this.targetModule);
  }

  toggleActivo(id: number, activo: boolean): Observable<ApiResponse<boolean>> {
    return this.api.patch<ApiResponse<boolean>>(`${this.endpoint}/${id}/activo`, { activo }, {}, this.targetModule);
  }
}
