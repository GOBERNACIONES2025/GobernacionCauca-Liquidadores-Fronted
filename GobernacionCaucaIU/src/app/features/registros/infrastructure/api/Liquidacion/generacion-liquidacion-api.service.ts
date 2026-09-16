import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../../core/services/base-api.service';
import { ApiResponse } from '../../../../../core/shared/models/shared.model';
import { 
  GenerarLiquidacionDto, 
  LiquidacionListadoDto,
  SimularLiquidacionDto
} from '../../../domain/models/Liquidacion/generacion-liquidacion.model';
import { LiquidacionSimuladaResponse } from '../../../domain/models/Liquidacion/liquidacion-simulada.model';
import { PagedResult } from '../../../domain/models/Radicacion/solicitud-wizard.model';

@Injectable({
  providedIn: 'root',
})
export class GeneracionLiquidacionApiService {
  private api = inject(BaseApiService);
  private readonly baseUrl = '/Liquidacion';

  listarLiquidaciones(
    pageNumber: number = 1, 
    pageSize: number = 10, 
    search?: string, 
    estadoId?: number | null
  ): Observable<ApiResponse<PagedResult<LiquidacionListadoDto>>> {
    let url = `${this.baseUrl}?PageNumber=${pageNumber}&PageSize=${pageSize}`;
    if (search && search.trim() !== '') {
      url += `&SearchTerm=${encodeURIComponent(search.trim())}`;
    }
    if (estadoId !== undefined && estadoId !== null) {
      url += `&EstadoId=${estadoId}`;
    }
    return this.api.get<ApiResponse<PagedResult<LiquidacionListadoDto>>>(url, {}, 'REGISTROS');
  }

  simularLiquidacion(solicitudId: number): Observable<ApiResponse<LiquidacionSimuladaResponse>> {
    return this.api.post<ApiResponse<LiquidacionSimuladaResponse>>(`${this.baseUrl}/${solicitudId}/simular`, {}, {}, 'REGISTROS');
  }

  generarLiquidacion(command: GenerarLiquidacionDto): Observable<ApiResponse<number>> {
    return this.api.post<ApiResponse<number>>(`${this.baseUrl}/${command.solicitudId}/generar`, {}, {}, 'REGISTROS');
  }

  descargarPdf(id: number): Observable<Blob> {
    return this.api.get<Blob>(`${this.baseUrl}/${id}/pdf`, { responseType: 'blob' }, 'REGISTROS');
  }

  anularLiquidacion(id: number, motivo: string): Observable<ApiResponse<boolean>> {
    return this.api.post<ApiResponse<boolean>>(`${this.baseUrl}/${id}/anular`, { motivoAnulacion: motivo }, {}, 'REGISTROS');
  }

  reliquidarLiquidacion(id: number, motivo: string): Observable<ApiResponse<number>> {
    return this.api.post<ApiResponse<number>>(`${this.baseUrl}/${id}/reliquidar`, { motivoReliquidacion: motivo }, {}, 'REGISTROS');
  }

  solicitarReliquidacion(liquidacionId: number, motivo: string): Observable<ApiResponse<number>> {
    return this.api.post<ApiResponse<number>>(`${this.baseUrl}/${liquidacionId}/solicitar-reliquidacion`, { motivoSolicitud: motivo }, {}, 'REGISTROS');
  }

  listarReliquidacionesPendientes(
    pageNumber: number = 1, 
    pageSize: number = 10, 
    search?: string, 
    entidadRegistroId?: number
  ): Observable<ApiResponse<PagedResult<any>>> {
    let url = `${this.baseUrl}/reliquidaciones-pendientes?PageNumber=${pageNumber}&PageSize=${pageSize}`;
    if (search && search.trim() !== '') {
      url += `&SearchTerm=${encodeURIComponent(search.trim())}`;
    }
    if (entidadRegistroId) {
      url += `&EntidadRegistroId=${entidadRegistroId}`;
    }
    return this.api.get<ApiResponse<PagedResult<any>>>(url, {}, 'REGISTROS');
  }

  aprobarReliquidacion(liquidacionId: number, motivo: string): Observable<ApiResponse<number>> {
    return this.api.post<ApiResponse<number>>(`${this.baseUrl}/${liquidacionId}/aprobar-reliquidacion`, { motivoAprobacion: motivo }, {}, 'REGISTROS');
  }

  rechazarReliquidacion(liquidacionId: number, motivo: string): Observable<ApiResponse<boolean>> {
    return this.api.post<ApiResponse<boolean>>(`${this.baseUrl}/${liquidacionId}/rechazar-reliquidacion`, { motivoRechazo: motivo }, {}, 'REGISTROS');
  }

  obtenerHistorial(liquidacionId: number): Observable<ApiResponse<any>> {
    return this.api.get<ApiResponse<any>>(`${this.baseUrl}/${liquidacionId}/historial`, {}, 'REGISTROS');
  }
}
