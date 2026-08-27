import { Injectable, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { 
  EstadoPago, 
  CrearEstadoPagoRequest, 
  ActualizarEstadoPagoRequest 
} from '../../../domain/models/Pagos/estado-pago.model';
import { EstadosPagoApiService } from '../../../infrastructure/api/Pagos/estados-pago-api.service';
import { ApiResponse } from '../../../../../core/shared/models/shared.model';

/**
 * @description
 * Facade (Capa de Aplicación) para la gestión del estado de Estados de Pago.
 * Expone señales reactivas (Angular Signals) y métodos de orquestación de operaciones para la UI.
 */
@Injectable({
  providedIn: 'root'
})
export class EstadosPagoFacade {
  private apiService = inject(EstadosPagoApiService);

  // Signals
  readonly estadosPago = signal<EstadoPago[]>([]);
  readonly totalEstadosPago = signal<number>(0);
  
  // UI State
  readonly loading = signal<boolean>(false);
  readonly actionLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly selectedEstadoPago = signal<EstadoPago | null>(null);

  /**
   * Carga la lista paginada de estados de pago.
   */
  cargarEstadosPago(pageNumber: number = 1, pageSize: number = 10, search?: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService.obtenerTodos(pageNumber, pageSize, search).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.estadosPago.set(response.data.items || []);
          this.totalEstadosPago.set(response.data.totalCount);
        } else {
          this.error.set(response.message || 'Error al cargar estados de pago');
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
   * Selecciona un estado de pago por su ID.
   */
  seleccionarPorId(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.selectedEstadoPago.set(null);

    this.apiService.obtenerPorId(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.selectedEstadoPago.set(response.data);
        } else {
          this.error.set(response.message || 'Error al cargar estado de pago');
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
    this.selectedEstadoPago.set(null);
  }

  /**
   * Crea un nuevo estado de pago.
   */
  crear(dto: CrearEstadoPagoRequest): Observable<ApiResponse<number>> {
    this.actionLoading.set(true);
    return this.apiService.crear(dto).pipe(
      tap({
        next: () => this.actionLoading.set(false),
        error: () => this.actionLoading.set(false)
      })
    );
  }

  /**
   * Actualiza un estado de pago existente.
   */
  actualizar(id: number, dto: ActualizarEstadoPagoRequest): Observable<void> {
    this.actionLoading.set(true);
    return this.apiService.actualizar(id, dto).pipe(
      tap({
        next: () => this.actionLoading.set(false),
        error: () => this.actionLoading.set(false)
      })
    );
  }

  /**
   * Elimina un estado de pago.
   */
  eliminar(id: number): Observable<void> {
    this.actionLoading.set(true);
    return this.apiService.eliminar(id).pipe(
      tap({
        next: () => {
          this.actionLoading.set(false);
          this.cargarEstadosPago();
        },
        error: () => this.actionLoading.set(false)
      })
    );
  }
}
