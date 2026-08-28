import { Injectable, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { 
  Vigencia, 
  CrearVigenciaRequest, 
  ActualizarVigenciaRequest 
} from '../../../domain/models/Normatividad/vigencia.model';
import { VigenciasApiService } from '../../../infrastructure/api/Normatividad/vigencias-api.service';
import { ApiResponse } from '../../../../../core/shared/models/shared.model';

/**
 * @description
 * Facade (Capa de Aplicación) para la gestión del estado de Vigencias.
 * Expone señales reactivas (Angular Signals) y métodos de orquestación de operaciones para la UI.
 */
@Injectable({
  providedIn: 'root'
})
export class VigenciasFacade {
  private apiService = inject(VigenciasApiService);

  // Signals
  readonly vigencias = signal<Vigencia[]>([]);
  readonly totalVigencias = signal<number>(0);
  
  // UI State
  readonly loading = signal<boolean>(false);
  readonly actionLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly selectedVigencia = signal<Vigencia | null>(null);

  /**
   * Carga la lista paginada de vigencias.
   */
  cargarVigencias(pageNumber: number = 1, pageSize: number = 10, search?: string, activo?: boolean): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService.obtenerTodos(pageNumber, pageSize, search, activo).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.vigencias.set(response.data.items || []);
          this.totalVigencias.set(response.data.totalCount);
        } else {
          this.error.set(response.message || 'Error al cargar vigencias');
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
   * Selecciona una vigencia por su ID.
   */
  seleccionarPorId(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.selectedVigencia.set(null);

    this.apiService.obtenerPorId(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.selectedVigencia.set(response.data);
        } else {
          this.error.set(response.message || 'Error al cargar vigencia');
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
    this.selectedVigencia.set(null);
  }

  /**
   * Crea una nueva vigencia.
   */
  crear(dto: CrearVigenciaRequest): Observable<ApiResponse<number>> {
    this.actionLoading.set(true);
    return this.apiService.crear(dto).pipe(
      tap({
        next: () => this.actionLoading.set(false),
        error: () => this.actionLoading.set(false)
      })
    );
  }

  /**
   * Actualiza una vigencia existente.
   */
  actualizar(id: number, dto: ActualizarVigenciaRequest): Observable<void> {
    this.actionLoading.set(true);
    return this.apiService.actualizar(id, dto).pipe(
      tap({
        next: () => this.actionLoading.set(false),
        error: () => this.actionLoading.set(false)
      })
    );
  }

  /**
   * Elimina una vigencia.
   */
  eliminar(id: number): Observable<void> {
    this.actionLoading.set(true);
    return this.apiService.eliminar(id).pipe(
      tap({
        next: () => {
          this.actionLoading.set(false);
          this.cargarVigencias();
        },
        error: () => this.actionLoading.set(false)
      })
    );
  }
}
