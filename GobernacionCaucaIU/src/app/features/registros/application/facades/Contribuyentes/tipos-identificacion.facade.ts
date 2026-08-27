import { Injectable, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { 
  TipoIdentificacion, 
  CrearTipoIdentificacionRequest, 
  ActualizarTipoIdentificacionRequest 
} from '../../../domain/models/Contribuyentes/tipo-identificacion.model';
import { TiposIdentificacionApiService } from '../../../infrastructure/api/Contribuyentes/tipos-identificacion-api.service';
import { ApiResponse } from '../../../../../core/shared/models/shared.model';

/**
 * @description
 * Facade (Capa de Aplicación) para la gestión del estado de Tipos de Identificación.
 * Expone señales reactivas (Angular Signals) y métodos de orquestación de operaciones para la UI.
 */
@Injectable({
  providedIn: 'root'
})
export class TiposIdentificacionFacade {
  private apiService = inject(TiposIdentificacionApiService);

  // Signals
  readonly tiposIdentificacion = signal<TipoIdentificacion[]>([]);
  readonly totalTiposIdentificacion = signal<number>(0);
  
  // UI State
  readonly loading = signal<boolean>(false);
  readonly actionLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly selectedTipoIdentificacion = signal<TipoIdentificacion | null>(null);

  /**
   * Carga la lista paginada de tipos de identificación.
   */
  cargarTiposIdentificacion(pageNumber: number = 1, pageSize: number = 10, search?: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService.obtenerTodos(pageNumber, pageSize, search).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.tiposIdentificacion.set(response.data.items || []);
          this.totalTiposIdentificacion.set(response.data.totalCount);
        } else {
          this.error.set(response.message || 'Error al cargar tipos de identificación');
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
   * Selecciona un tipo de identificación por su ID.
   */
  seleccionarPorId(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.selectedTipoIdentificacion.set(null);

    this.apiService.obtenerPorId(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.selectedTipoIdentificacion.set(response.data);
        } else {
          this.error.set(response.message || 'Error al cargar tipo de identificación');
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
    this.selectedTipoIdentificacion.set(null);
  }

  /**
   * Crea un nuevo tipo de identificación.
   */
  crear(dto: CrearTipoIdentificacionRequest): Observable<ApiResponse<number>> {
    this.actionLoading.set(true);
    return this.apiService.crear(dto).pipe(
      tap({
        next: () => this.actionLoading.set(false),
        error: () => this.actionLoading.set(false)
      })
    );
  }

  /**
   * Actualiza un tipo de identificación existente.
   */
  actualizar(id: number, dto: ActualizarTipoIdentificacionRequest): Observable<void> {
    this.actionLoading.set(true);
    return this.apiService.actualizar(id, dto).pipe(
      tap({
        next: () => this.actionLoading.set(false),
        error: () => this.actionLoading.set(false)
      })
    );
  }

  /**
   * Elimina un tipo de identificación.
   */
  eliminar(id: number): Observable<void> {
    this.actionLoading.set(true);
    return this.apiService.eliminar(id).pipe(
      tap({
        next: () => {
          this.actionLoading.set(false);
          this.cargarTiposIdentificacion();
        },
        error: () => this.actionLoading.set(false)
      })
    );
  }
}
