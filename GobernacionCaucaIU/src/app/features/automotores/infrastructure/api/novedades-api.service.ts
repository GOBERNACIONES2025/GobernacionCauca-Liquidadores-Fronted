import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../core/services/base-api.service';
import {
  ApiResponse,
  PagedResult,
  NovedadItemDto,
  NovedadDetalleDto,
  NovedadKpisDto,
  RadicarNovedadRequest,
  CambiarEstadoNovedadRequest,
  RadicarTraspasoRequest,
  RadicarTrasladoCirculacionRequest,
  RadicarRematriculaRequest,
  RadicarNovedadResponse
} from '../../domain/interfaces/novedades.interface';

@Injectable({ providedIn: 'root' })
export class NovedadesApiService {
  private api = inject(BaseApiService);
  private readonly endpoint = '/novedades-vehiculo';

  // 1. Obtener lista con filtros
  getNovedades(params: {
    busqueda?: string;
    placa?: string;
    tipoNovedad?: string;
    estado?: string;
    fechaDesde?: string;
    fechaHasta?: string;
    page?: number;
    pageSize?: number;
  } = {}): Observable<ApiResponse<PagedResult<NovedadItemDto>>> {
    const httpParams: Record<string, string | number> = {};
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        httpParams[key] = val;
      }
    });
    return this.api.get<ApiResponse<PagedResult<NovedadItemDto>>>(this.endpoint, { params: httpParams }, 'AUTOMOTORES');
  }

  // 2. Obtener KPIs para tarjetas
  getKpis(): Observable<ApiResponse<NovedadKpisDto>> {
    return this.api.get<ApiResponse<NovedadKpisDto>>(`${this.endpoint}/kpis`, {}, 'AUTOMOTORES');
  }

  // 3. Detalle por ID
  getById(id: number): Observable<ApiResponse<NovedadDetalleDto>> {
    return this.api.get<ApiResponse<NovedadDetalleDto>>(`${this.endpoint}/${id}`, {}, 'AUTOMOTORES');
  }

  // 4. Historial por placa
  getByPlaca(placa: string): Observable<ApiResponse<NovedadItemDto[]>> {
    return this.api.get<ApiResponse<NovedadItemDto[]>>(`${this.endpoint}/placa/${placa}`, {}, 'AUTOMOTORES');
  }

  // 5. Radicar Novedad (endpoint genérico — legacy)
  radicar(payload: RadicarNovedadRequest): Observable<ApiResponse<number>> {
    return this.api.post<ApiResponse<number>>(this.endpoint, payload, {}, 'AUTOMOTORES');
  }

  // ── Endpoints tipados por tipo de novedad (contratos v2) ─────────────────

  /**
   * POST /api/novedades-vehiculo/traspaso
   * Retorna 201 { value: <id_novedad> }
   */
  radicarTraspaso(payload: RadicarTraspasoRequest): Observable<RadicarNovedadResponse> {
    return this.api.post<RadicarNovedadResponse>(`${this.endpoint}/traspaso`, payload, {}, 'AUTOMOTORES');
  }

  /**
   * POST /api/novedades-vehiculo/traslado-circulacion
   * Retorna 201 { value: <id_novedad> }
   */
  radicarTrasladoCirculacion(payload: RadicarTrasladoCirculacionRequest): Observable<RadicarNovedadResponse> {
    return this.api.post<RadicarNovedadResponse>(`${this.endpoint}/traslado-circulacion`, payload, {}, 'AUTOMOTORES');
  }

  /**
   * POST /api/novedades-vehiculo/rematricula
   * Retorna 201 { value: <id_novedad> }
   */
  radicarRematricula(payload: RadicarRematriculaRequest): Observable<RadicarNovedadResponse> {
    return this.api.post<RadicarNovedadResponse>(`${this.endpoint}/rematricula`, payload, {}, 'AUTOMOTORES');
  }

  // 6. Cambiar Estado (Aprobar, Rechazar, En Revisión)
  cambiarEstado(id: number, payload: CambiarEstadoNovedadRequest): Observable<ApiResponse<void>> {
    return this.api.patch<ApiResponse<void>>(`${this.endpoint}/${id}/estado`, payload, {}, 'AUTOMOTORES');
  }

  // 7. Eliminar
  eliminar(id: number): Observable<ApiResponse<void>> {
    return this.api.delete<ApiResponse<void>>(`${this.endpoint}/${id}`, {}, 'AUTOMOTORES');
  }
}
