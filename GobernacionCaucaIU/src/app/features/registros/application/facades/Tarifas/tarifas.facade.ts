import { Injectable, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { 
  Tarifa, 
  CrearTarifaDto, 
  ActualizarTarifaDto, 
  TarifaQueryParams 
} from '../../../domain/models/Tarifas/tarifa.model';
import { TarifasApiService } from '../../../infrastructure/api/Tarifas/tarifas-api.service';
import { ApiResponse } from '../../../../../core/shared/models/shared.model';

/**
 * @description
 * Facade (Capa de Aplicación) para la gestión del estado de Tarifas en Registros.
 * Expone señales reactivas (Angular Signals) y métodos de orquestación de operaciones para la UI.
 */
@Injectable({
  providedIn: 'root'
})
export class TarifasFacade {
  private apiService = inject(TarifasApiService);

  // Signals
  readonly tarifas = signal<Tarifa[]>([]);
  readonly totalTarifas = signal<number>(0);
  
  // UI State
  readonly loading = signal<boolean>(false);
  readonly actionLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly selectedTarifa = signal<Tarifa | null>(null);

  /**
   * Carga la lista paginada de tarifas con filtros opcionales.
   */
  cargarTarifas(params?: TarifaQueryParams): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService.obtenerTodos(params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.tarifas.set(response.data.items || []);
          this.totalTarifas.set(response.data.totalCount);
        } else {
          this.error.set(response.message || 'Error al cargar tarifas');
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
   * Selecciona una tarifa por su ID.
   */
  seleccionarPorId(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.selectedTarifa.set(null);

    this.apiService.obtenerPorId(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.selectedTarifa.set(response.data);
        } else {
          this.error.set(response.message || 'Error al cargar tarifa');
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
    this.selectedTarifa.set(null);
  }

  /**
   * Registra una nueva tarifa.
   */
  crear(dto: CrearTarifaDto): Observable<ApiResponse<number>> {
    this.actionLoading.set(true);
    return this.apiService.crear(dto).pipe(
      tap({
        next: () => this.actionLoading.set(false),
        error: () => this.actionLoading.set(false)
      })
    );
  }

  /**
   * Actualiza una tarifa existente.
   */
  actualizar(id: number, dto: ActualizarTarifaDto): Observable<void> {
    this.actionLoading.set(true);
    return this.apiService.actualizar(id, dto).pipe(
      tap({
        next: () => this.actionLoading.set(false),
        error: () => this.actionLoading.set(false)
      })
    );
  }

  /**
   * Elimina lógicamente una tarifa.
   */
  eliminar(id: number): Observable<void> {
    this.actionLoading.set(true);
    return this.apiService.eliminar(id).pipe(
      tap({
        next: () => {
          this.actionLoading.set(false);
          this.cargarTarifas();
        },
        error: () => this.actionLoading.set(false)
      })
    );
  }
}
