import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { GeneracionLiquidacionApiService } from '../../../infrastructure/api/Liquidacion/generacion-liquidacion-api.service';
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

  listarLiquidaciones(pageNumber: number = 1, pageSize: number = 10, search?: string): Observable<ApiResponse<PagedResult<LiquidacionListadoDto>>> {
    this.actionLoading.set(true);
    return this.apiService.listarLiquidaciones(pageNumber, pageSize, search).pipe(
      finalize(() => this.actionLoading.set(false))
    );
  }

  /**
   * Ejecuta la simulación de liquidación y retorna el observable para manejarlo en el componente.
   */
  simularLiquidacion(solicitudId: number): Observable<ApiResponse<LiquidacionSimuladaResponse>> {
    this.actionLoading.set(true);
    return this.apiService.simularLiquidacion(solicitudId).pipe(
      finalize(() => this.actionLoading.set(false))
    );
  }

  /**
   * Ejecuta la generación oficial de la liquidación basada en la solicitud completada.
   */
  generarLiquidacion(command: GenerarLiquidacionDto): Observable<ApiResponse<number>> {
    this.actionLoading.set(true);
    return this.apiService.generarLiquidacion(command).pipe(
      finalize(() => this.actionLoading.set(false))
    );
  }

  /**
   * Descarga el PDF de la liquidación oficial generada.
   */
  descargarPdf(id: number): Observable<Blob> {
    this.actionLoading.set(true);
    return this.apiService.descargarPdf(id).pipe(
      finalize(() => this.actionLoading.set(false))
    );
  }

  /**
   * Anula una liquidación oficial generada.
   */
  anularLiquidacion(id: number, motivo: string): Observable<ApiResponse<boolean>> {
    this.actionLoading.set(true);
    return this.apiService.anularLiquidacion(id, motivo).pipe(
      finalize(() => this.actionLoading.set(false))
    );
  }

  /**
   * Reliquida una liquidación oficial, anulando la actual y reaperturando la solicitud.
   */
  reliquidarLiquidacion(id: number, motivo: string): Observable<ApiResponse<number>> {
    this.actionLoading.set(true);
    return this.apiService.reliquidarLiquidacion(id, motivo).pipe(
      finalize(() => this.actionLoading.set(false))
    );
  }
}
