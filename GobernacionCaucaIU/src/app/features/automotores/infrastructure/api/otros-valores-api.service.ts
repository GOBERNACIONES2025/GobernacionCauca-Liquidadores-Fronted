import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../core/services/base-api.service';
import { ApiResponse } from '../../domain/interfaces/api-response.interface';
import {
  OtroValorDto,
  CreateOtroValorRequest,
  UpdateOtroValorRequest,
  FiltrosOtroValor,
  ConceptoTributarioDto
} from '../../domain/interfaces/otros-valores.interface';

@Injectable({
  providedIn: 'root'
})
export class OtrosValoresApiService {
  private api = inject(BaseApiService);
  private readonly targetModule = 'AUTOMOTORES';
  private readonly endpoint = 'OtrosValores';

  getOtrosValoresPaged(filtros?: FiltrosOtroValor): Observable<any> {
    const params: Record<string, any> = {};
    if (filtros) {
      if (filtros.pageNumber) params['pageNumber'] = filtros.pageNumber;
      if (filtros.pageSize) params['pageSize'] = filtros.pageSize;
      if (filtros.searchTerm && filtros.searchTerm.trim() !== '') params['searchTerm'] = filtros.searchTerm.trim();
      if (filtros.vigenciaFiscalId) params['vigenciaFiscalId'] = filtros.vigenciaFiscalId;
      if (filtros.conceptoTributarioId) params['conceptoTributarioId'] = filtros.conceptoTributarioId;
      if (filtros.activo !== undefined && filtros.activo !== null) params['activo'] = filtros.activo;
    }
    return this.api.get<any>(this.endpoint, { params }, this.targetModule);
  }

  getConceptosTributarios(): Observable<any> {
    return this.api.get<any>('ConceptosTributarios', { params: { pageSize: 500 } }, this.targetModule);
  }

  crear(payload: CreateOtroValorRequest): Observable<ApiResponse<number | OtroValorDto>> {
    return this.api.post<ApiResponse<number | OtroValorDto>>(this.endpoint, payload, {}, this.targetModule);
  }

  actualizar(id: number, payload: UpdateOtroValorRequest): Observable<ApiResponse<boolean | OtroValorDto>> {
    return this.api.put<ApiResponse<boolean | OtroValorDto>>(`${this.endpoint}/${id}`, payload, {}, this.targetModule);
  }

  eliminar(id: number): Observable<ApiResponse<boolean>> {
    return this.api.delete<ApiResponse<boolean>>(`${this.endpoint}/${id}`, {}, this.targetModule);
  }
}
