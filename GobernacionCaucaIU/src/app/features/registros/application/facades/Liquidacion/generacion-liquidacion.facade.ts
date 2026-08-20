import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { GenerarLiquidacionDto } from '../../../domain/models/Liquidacion/generacion-liquidacion.model';
import { GeneracionLiquidacionApiService } from '../../../infrastructure/api/Liquidacion/generacion-liquidacion-api.service';
import { ApiResponse } from '../../../../../core/shared/models/shared.model';

/**
 * @description
 * Facade (Capa de Aplicación) para orquestar la generación de liquidación de impuesto de registro.
 * Maneja el estado reactivo del proceso de liquidación para el asistente (Wizard).
 */
@Injectable({
  providedIn: 'root'
})
export class GeneracionLiquidacionFacade {
  private apiService = inject(GeneracionLiquidacionApiService);

  // Signals
  readonly generando = signal<boolean>(false);
  readonly ultimoIdLiquidacion = signal<number | null>(null);
  readonly error = signal<string | null>(null);

  /**
   * Genera una liquidación completa en el sistema.
   * 
   * @param {GenerarLiquidacionDto} command - Datos del formulario/wizard.
   * @returns {Observable<ApiResponse<number>>} Observable con la respuesta y el ID generado.
   */
  generar(command: GenerarLiquidacionDto): Observable<ApiResponse<number>> {
    this.generando.set(true);
    this.error.set(null);

    return this.apiService.generarLiquidacion(command).pipe(
      tap({
        next: (response) => {
          this.generando.set(false);
          if (response.success && response.data) {
            this.ultimoIdLiquidacion.set(response.data);
          } else {
            this.error.set(response.message || 'Error al generar la liquidación');
          }
        },
        error: (err) => {
          this.generando.set(false);
          this.error.set(err.error?.detail || err.message || 'Error al procesar la liquidación');
        }
      })
    );
  }

  /**
   * Limpia el estado actual de la liquidación.
   */
  reset(): void {
    this.generando.set(false);
    this.ultimoIdLiquidacion.set(null);
    this.error.set(null);
  }
}
