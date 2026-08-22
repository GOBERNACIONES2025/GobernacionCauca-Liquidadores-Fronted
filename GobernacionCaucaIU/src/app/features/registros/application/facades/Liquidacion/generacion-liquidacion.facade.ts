import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { GeneracionLiquidacionApiService } from '../../../infrastructure/api/Liquidacion/generacion-liquidacion-api.service';
import { GenerarLiquidacionDto } from '../../../domain/models/Liquidacion/generacion-liquidacion.model';
import { LiquidacionSimuladaResponse } from '../../../domain/models/Liquidacion/liquidacion-simulada.model';
import { ApiResponse } from '../../../../../core/shared/models/shared.model';

@Injectable({
  providedIn: 'root'
})
export class GeneracionLiquidacionFacade {
  private apiService = inject(GeneracionLiquidacionApiService);
  
  public actionLoading = signal<boolean>(false);

  /**
   * Ejecuta la simulación de liquidación y retorna el observable para manejarlo en el componente.
   */
  simularLiquidacion(command: GenerarLiquidacionDto): Observable<ApiResponse<LiquidacionSimuladaResponse>> {
    this.actionLoading.set(true);
    return this.apiService.simularLiquidacion(command).pipe(
      finalize(() => this.actionLoading.set(false))
    );
  }

  /**
   * Ejecuta la generación oficial de la liquidación adjuntando el documento soporte.
   */
  generarLiquidacion(file: File, command: GenerarLiquidacionDto): Observable<ApiResponse<number>> {
    this.actionLoading.set(true);
    return this.apiService.generarLiquidacion(file, command).pipe(
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
}
