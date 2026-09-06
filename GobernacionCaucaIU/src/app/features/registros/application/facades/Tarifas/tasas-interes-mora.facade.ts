import { Injectable, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import {
  TasaInteresMora,
  CrearTasaInteresMoraRequest,
  ActualizarTasaInteresMoraRequest,
  TasaInteresMoraQueryParams
} from '../../../domain/models/Tarifas/tasa-interes-mora.model';
import { TasasInteresMoraApiService } from '../../../infrastructure/api/Tarifas/tasas-interes-mora-api.service';
import { ApiResponse } from '../../../../../core/shared/models/shared.model';

/**
 * @description
 * Facade (Capa de Aplicación) para la gestión del estado reactivo de Tasas de Interés de Mora.
 * Expone señales (Angular Signals) y métodos de orquestación para la UI.
 */
@Injectable({
  providedIn: 'root'
})
export class TasasInteresMoraFacade {
  private apiService = inject(TasasInteresMoraApiService);

  // Signals reactivos
  readonly tasas = signal<TasaInteresMora[]>([]);
  readonly totalTasas = signal<number>(0);

  // Estados de UI
  readonly loading = signal<boolean>(false);
  readonly actionLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly selectedTasa = signal<TasaInteresMora | null>(null);

  /**
   * Carga la lista paginada de tasas de interés de mora con filtros opcionales.
   */
  cargarTasas(params?: TasaInteresMoraQueryParams): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService.obtenerTodos(params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.tasas.set(response.data.items || []);
          this.totalTasas.set(response.data.totalCount);
        } else {
          this.error.set(response.message || 'Error al cargar tasas de interés de mora');
        }
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(err.message || 'Error de conexión con el servidor');
        this.loading.set(false);
      }
    });
  }

  /**
   * Obtiene y selecciona una tasa de interés de mora por su identificador.
   */
  seleccionarPorId(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.selectedTasa.set(null);

    this.apiService.obtenerPorId(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.selectedTasa.set(response.data);
        } else {
          this.error.set(response.message || 'Error al cargar detalle');
        }
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(err.message || 'Error de conexión con el servidor');
        this.loading.set(false);
      }
    });
  }

  /**
   * Limpia la selección actual.
   */
  limpiarSeleccion(): void {
    this.selectedTasa.set(null);
  }

  /**
   * Registra una nueva tasa de interés de mora.
   */
  crear(dto: CrearTasaInteresMoraRequest): Observable<ApiResponse<number>> {
    this.actionLoading.set(true);
    return this.apiService.crear(dto).pipe(
      tap({
        next: () => this.actionLoading.set(false),
        error: () => this.actionLoading.set(false)
      })
    );
  }

  /**
   * Actualiza una tasa de interés de mora existente.
   */
  actualizar(id: number, dto: ActualizarTasaInteresMoraRequest): Observable<void> {
    this.actionLoading.set(true);
    return this.apiService.actualizar(id, dto).pipe(
      tap({
        next: () => this.actionLoading.set(false),
        error: () => this.actionLoading.set(false)
      })
    );
  }

  /**
   * Elimina lógicamente una tasa de interés de mora.
   */
  eliminar(id: number): Observable<void> {
    this.actionLoading.set(true);
    return this.apiService.eliminar(id).pipe(
      tap({
        next: () => {
          this.actionLoading.set(false);
          this.cargarTasas();
        },
        error: () => this.actionLoading.set(false)
      })
    );
  }
}
