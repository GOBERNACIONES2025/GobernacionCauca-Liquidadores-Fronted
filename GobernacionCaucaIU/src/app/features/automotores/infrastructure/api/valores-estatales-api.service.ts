import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../core/services/base-api.service';
import { ApiResponse, PagedResult } from '../../../../core/shared/models/shared.model';
import {
  UvtHistoricoDto,
  CreateUvtHistoricoRequest,
  UpdateUvtHistoricoRequest,
  TasasInteresDto,
  CreateTasaInteresRequest,
  UpdateTasaInteresRequest,
  SalarioMinimoDto,
  CreateSalarioMinimoRequest,
  UpdateSalarioMinimoRequest,
} from '../../domain/interfaces/valores-estatales.interface';

@Injectable({
  providedIn: 'root',
})
export class ValoresEstatalesApiService {
  private api = inject(BaseApiService);
  private readonly targetModule = 'AUTOMOTORES';

  // =========================================================================
  // 1. UVT HISTÓRICO (/api/UvtHistorico)
  // =========================================================================
  public getUvtPaged(params?: any): Observable<ApiResponse<PagedResult<UvtHistoricoDto>>> {
    return this.api.get<ApiResponse<PagedResult<UvtHistoricoDto>>>('UvtHistorico', { params }, this.targetModule);
  }

  public getUvtById(id: number): Observable<ApiResponse<UvtHistoricoDto>> {
    return this.api.get<ApiResponse<UvtHistoricoDto>>(`UvtHistorico/${id}`, {}, this.targetModule);
  }

  public crearUvt(payload: CreateUvtHistoricoRequest): Observable<ApiResponse<number>> {
    return this.api.post<ApiResponse<number>>('UvtHistorico', payload, {}, this.targetModule);
  }

  public actualizarUvt(id: number, payload: UpdateUvtHistoricoRequest): Observable<ApiResponse<boolean>> {
    return this.api.put<ApiResponse<boolean>>(`UvtHistorico/${id}`, payload, {}, this.targetModule);
  }

  public eliminarUvt(id: number): Observable<ApiResponse<boolean>> {
    return this.api.delete<ApiResponse<boolean>>(`UvtHistorico/${id}`, {}, this.targetModule);
  }

  // =========================================================================
  // 2. TASAS DE INTERÉS (/api/TasasInteres)
  // =========================================================================
  public getTasasPaged(params?: any): Observable<ApiResponse<PagedResult<TasasInteresDto>>> {
    return this.api.get<ApiResponse<PagedResult<TasasInteresDto>>>('TasasInteres', { params }, this.targetModule);
  }

  public getTasaById(id: number): Observable<ApiResponse<TasasInteresDto>> {
    return this.api.get<ApiResponse<TasasInteresDto>>(`TasasInteres/${id}`, {}, this.targetModule);
  }

  public crearTasa(payload: CreateTasaInteresRequest): Observable<ApiResponse<number>> {
    return this.api.post<ApiResponse<number>>('TasasInteres', payload, {}, this.targetModule);
  }

  public actualizarTasa(id: number, payload: UpdateTasaInteresRequest): Observable<ApiResponse<boolean>> {
    return this.api.put<ApiResponse<boolean>>(`TasasInteres/${id}`, payload, {}, this.targetModule);
  }

  public eliminarTasa(id: number): Observable<ApiResponse<boolean>> {
    return this.api.delete<ApiResponse<boolean>>(`TasasInteres/${id}`, {}, this.targetModule);
  }

  // =========================================================================
  // 3. SALARIO MÍNIMO (/api/SalarioMinimo)
  // =========================================================================
  public getSalariosPaged(params?: any): Observable<ApiResponse<PagedResult<SalarioMinimoDto>>> {
    return this.api.get<ApiResponse<PagedResult<SalarioMinimoDto>>>('SalarioMinimo', { params }, this.targetModule);
  }

  public getSalarioById(id: number): Observable<ApiResponse<SalarioMinimoDto>> {
    return this.api.get<ApiResponse<SalarioMinimoDto>>(`SalarioMinimo/${id}`, {}, this.targetModule);
  }

  public crearSalario(payload: CreateSalarioMinimoRequest): Observable<ApiResponse<number>> {
    return this.api.post<ApiResponse<number>>('SalarioMinimo', payload, {}, this.targetModule);
  }

  public actualizarSalario(id: number, payload: UpdateSalarioMinimoRequest): Observable<ApiResponse<boolean>> {
    return this.api.put<ApiResponse<boolean>>(`SalarioMinimo/${id}`, payload, {}, this.targetModule);
  }

  public eliminarSalario(id: number): Observable<ApiResponse<boolean>> {
    return this.api.delete<ApiResponse<boolean>>(`SalarioMinimo/${id}`, {}, this.targetModule);
  }
}
