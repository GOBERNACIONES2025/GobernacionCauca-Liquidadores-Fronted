import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { GeneracionLiquidacionApiService, SolicitarReliquidacionRequest, SolicitarAnulacionRequest } from '../../../infrastructure/api/Liquidacion/generacion-liquidacion-api.service';
import { 
  GenerarLiquidacionDto,
  LiquidacionListadoDto,
  SimularLiquidacionDto
} from '../../../domain/models/Liquidacion/generacion-liquidacion.model';
import { LiquidacionSimuladaResponse } from '../../../domain/models/Liquidacion/liquidacion-simulada.model';
import { ApiResponse } from '../../../../../core/shared/models/shared.model';
import { PagedResult } from '../../../domain/models/Radicacion/solicitud-wizard.model';

@Injectable({
  providedIn: 'root'
})
export class GeneracionLiquidacionFacade {
  private apiService = inject(GeneracionLiquidacionApiService);
  
  public actionLoading = signal<boolean>(false);

  listarLiquidaciones(
    pageNumber: number = 1, 
    pageSize: number = 10, 
    search?: string, 
    estadoId?: number | null
  ): Observable<ApiResponse<PagedResult<LiquidacionListadoDto>>> {
    this.actionLoading.set(true);
    return this.apiService.listarLiquidaciones(pageNumber, pageSize, search, estadoId).pipe(
      finalize(() => this.actionLoading.set(false))
    );
  }

  simularLiquidacion(solicitudId: number): Observable<ApiResponse<LiquidacionSimuladaResponse>> {
    this.actionLoading.set(true);
    return this.apiService.simularLiquidacion(solicitudId).pipe(
      finalize(() => this.actionLoading.set(false))
    );
  }

  generarLiquidacion(command: GenerarLiquidacionDto): Observable<ApiResponse<number>> {
    this.actionLoading.set(true);
    return this.apiService.generarLiquidacion(command).pipe(
      finalize(() => this.actionLoading.set(false))
    );
  }

  descargarPdf(id: number): Observable<Blob> {
    this.actionLoading.set(true);
    return this.apiService.descargarPdf(id).pipe(
      finalize(() => this.actionLoading.set(false))
    );
  }

  anularLiquidacion(id: number, motivo: string): Observable<ApiResponse<boolean>> {
    this.actionLoading.set(true);
    return this.apiService.anularLiquidacion(id, motivo).pipe(
      finalize(() => this.actionLoading.set(false))
    );
  }

  reliquidarLiquidacion(id: number, motivo: string): Observable<ApiResponse<number>> {
    this.actionLoading.set(true);
    return this.apiService.reliquidarLiquidacion(id, motivo).pipe(
      finalize(() => this.actionLoading.set(false))
    );
  }

  solicitarReliquidacion(
    liquidacionId: number, 
    causalOrReq: string | SolicitarReliquidacionRequest, 
    motivo?: string, 
    docAclaratorio?: string
  ): Observable<ApiResponse<number>> {
    this.actionLoading.set(true);
    return this.apiService.solicitarReliquidacion(liquidacionId, causalOrReq as any, motivo, docAclaratorio).pipe(
      finalize(() => this.actionLoading.set(false))
    );
  }

  solicitarAnulacion(
    liquidacionId: number, 
    causalOrReq: string | SolicitarAnulacionRequest, 
    motivo?: string, 
    docSoporte?: string
  ): Observable<ApiResponse<number>> {
    this.actionLoading.set(true);
    return this.apiService.solicitarAnulacion(liquidacionId, causalOrReq as any, motivo, docSoporte).pipe(
      finalize(() => this.actionLoading.set(false))
    );
  }

  listarReliquidacionesPendientes(
    pageNumber: number = 1, 
    pageSize: number = 10, 
    search?: string, 
    entidadRegistroId?: number
  ): Observable<ApiResponse<PagedResult<any>>> {
    this.actionLoading.set(true);
    return this.apiService.listarReliquidacionesPendientes(pageNumber, pageSize, search, entidadRegistroId).pipe(
      finalize(() => this.actionLoading.set(false))
    );
  }

  aprobarReliquidacion(liquidacionId: number, motivo: string): Observable<ApiResponse<number>> {
    this.actionLoading.set(true);
    return this.apiService.aprobarReliquidacion(liquidacionId, motivo).pipe(
      finalize(() => this.actionLoading.set(false))
    );
  }

  rechazarReliquidacion(liquidacionId: number, motivo: string): Observable<ApiResponse<boolean>> {
    this.actionLoading.set(true);
    return this.apiService.rechazarReliquidacion(liquidacionId, motivo).pipe(
      finalize(() => this.actionLoading.set(false))
    );
  }

  listarAnulacionesPendientes(
    pageNumber: number = 1, 
    pageSize: number = 10, 
    search?: string, 
    entidadRegistroId?: number
  ): Observable<ApiResponse<PagedResult<any>>> {
    this.actionLoading.set(true);
    return this.apiService.listarAnulacionesPendientes(pageNumber, pageSize, search, entidadRegistroId).pipe(
      finalize(() => this.actionLoading.set(false))
    );
  }

  aprobarAnulacion(liquidacionId: number, motivo?: string): Observable<ApiResponse<boolean>> {
    this.actionLoading.set(true);
    return this.apiService.aprobarAnulacion(liquidacionId, motivo).pipe(
      finalize(() => this.actionLoading.set(false))
    );
  }

  rechazarAnulacion(liquidacionId: number, motivo: string): Observable<ApiResponse<boolean>> {
    this.actionLoading.set(true);
    return this.apiService.rechazarAnulacion(liquidacionId, motivo).pipe(
      finalize(() => this.actionLoading.set(false))
    );
  }

  obtenerHistorial(liquidacionId: number): Observable<ApiResponse<any>> {
    this.actionLoading.set(true);
    return this.apiService.obtenerHistorial(liquidacionId).pipe(
      finalize(() => this.actionLoading.set(false))
    );
  }
}
