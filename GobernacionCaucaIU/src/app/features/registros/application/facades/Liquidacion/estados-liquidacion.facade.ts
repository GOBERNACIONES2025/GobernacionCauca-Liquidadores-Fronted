import { Injectable, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { 
  EstadoLiquidacion, 
  CrearEstadoLiquidacionRequest, 
  ActualizarEstadoLiquidacionRequest 
} from '../../../domain/models/Liquidacion/estado-liquidacion.model';
import { EstadosLiquidacionApiService } from '../../../infrastructure/api/Liquidacion/estados-liquidacion-api.service';
import { ApiResponse } from '../../../../../core/shared/models/shared.model';

/**
 * @description
 * Facade (Capa de Aplicación) para la gestión del estado de Estados de Liquidación.
 * Expone señales reactivas (Angular Signals) y métodos de orquestación de operaciones para la UI.
 */
@Injectable({
  providedIn: 'root'
})
export class EstadosLiquidacionFacade {
  private apiService = inject(EstadosLiquidacionApiService);

  // Signals
  readonly estadosLiquidacion = signal<EstadoLiquidacion[]>([]);
  readonly totalEstadosLiquidacion = signal<number>(0);
  
  // UI State
  readonly loading = signal<boolean>(false);
  readonly actionLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly selectedEstadoLiquidacion = signal<EstadoLiquidacion | null>(null);

  /**
   * Carga la lista paginada de estados de liquidación.
   */
  cargarEstadosLiquidacion(pageNumber: number = 1, pageSize: number = 10, search?: string, activo?: boolean): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService.obtenerTodos(pageNumber, pageSize, search, activo).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.estadosLiquidacion.set(response.data.items || []);
          this.totalEstadosLiquidacion.set(response.data.totalCount);
        } else {
          this.error.set(response.message || 'Error al cargar estados de liquidación');
        }
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(err.message || 'Error de conexión');
        this.loading.set(false);
      }
    });
  }

  /**
   * Selecciona un estado de liquidación por su ID.
   */
  seleccionarPorId(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.selectedEstadoLiquidacion.set(null);

    this.apiService.obtenerPorId(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.selectedEstadoLiquidacion.set(response.data);
        } else {
          this.error.set(response.message || 'Error al cargar estado de liquidación');
        }
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(err.message || 'Error de conexión');
        this.loading.set(false);
      }
    });
  }

  /**
   * Limpia la selección actual.
   */
  limpiarSeleccion(): void {
    this.selectedEstadoLiquidacion.set(null);
  }

  /**
   * Crea un nuevo estado de liquidación.
   */
  crear(dto: CrearEstadoLiquidacionRequest): Observable<ApiResponse<number>> {
    this.actionLoading.set(true);
    return this.apiService.crear(dto).pipe(
      tap({
        next: () => this.actionLoading.set(false),
        error: () => this.actionLoading.set(false)
      })
    );
  }

  /**
   * Actualiza un estado de liquidación existente.
   */
  actualizar(id: number, dto: ActualizarEstadoLiquidacionRequest): Observable<void> {
    this.actionLoading.set(true);
    return this.apiService.actualizar(id, dto).pipe(
      tap({
        next: () => this.actionLoading.set(false),
        error: () => this.actionLoading.set(false)
      })
    );
  }

  /**
   * Elimina un estado de liquidación.
   */
  eliminar(id: number): Observable<void> {
    this.actionLoading.set(true);
    return this.apiService.eliminar(id).pipe(
      tap({
        next: () => {
          this.actionLoading.set(false);
          this.cargarEstadosLiquidacion();
        },
        error: () => this.actionLoading.set(false)
      })
    );
  }
}
