import { Injectable, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { EstadoNorma, CrearEstadoNormaRequest, ActualizarEstadoNormaRequest } from '../../../domain/models/Normatividad/estado-norma.model';
import { EstadosNormaApiService } from '../../../infrastructure/api/Normatividad/estados-norma-api.service';
import { ApiResponse } from '../../../../../core/shared/models/shared.model';

/**
 * @description
 * Facade (Capa de Aplicación) para la gestión del estado de Estados de Norma.
 * Expone señales reactivas (Angular Signals) y métodos de orquestación de operaciones para la UI.
 */
@Injectable({
  providedIn: 'root'
})
export class EstadosNormaFacade {
  private apiService = inject(EstadosNormaApiService);

  // Signals
  readonly estadosNorma = signal<EstadoNorma[]>([]);
  readonly totalEstadosNorma = signal<number>(0);
  
  // UI State
  readonly loading = signal<boolean>(false);
  readonly actionLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly selectedEstadoNorma = signal<EstadoNorma | null>(null);

  /**
   * Carga la lista paginada de estados de norma.
   */
  cargarEstadosNorma(pageNumber: number = 1, pageSize: number = 10): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService.obtenerTodos(pageNumber, pageSize).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.estadosNorma.set(response.data.items || []);
          this.totalEstadosNorma.set(response.data.totalCount);
        } else {
          this.error.set(response.message || 'Error al cargar estados de norma');
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
   * Selecciona un estado de norma por su ID.
   */
  seleccionarPorId(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.selectedEstadoNorma.set(null);

    this.apiService.obtenerPorId(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.selectedEstadoNorma.set(response.data);
        } else {
          this.error.set(response.message || 'Error al cargar estado de norma');
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
    this.selectedEstadoNorma.set(null);
  }

  /**
   * Crea un nuevo estado de norma.
   */
  crear(dto: CrearEstadoNormaRequest): Observable<ApiResponse<number>> {
    this.actionLoading.set(true);
    return this.apiService.crear(dto).pipe(
      tap({
        next: () => this.actionLoading.set(false),
        error: () => this.actionLoading.set(false)
      })
    );
  }

  /**
   * Actualiza un estado de norma existente.
   */
  actualizar(id: number, dto: ActualizarEstadoNormaRequest): Observable<void> {
    this.actionLoading.set(true);
    return this.apiService.actualizar(id, dto).pipe(
      tap({
        next: () => this.actionLoading.set(false),
        error: () => this.actionLoading.set(false)
      })
    );
  }

  /**
   * Elimina un estado de norma.
   */
  eliminar(id: number): Observable<void> {
    this.actionLoading.set(true);
    return this.apiService.eliminar(id).pipe(
      tap({
        next: () => {
          this.actionLoading.set(false);
          this.cargarEstadosNorma();
        },
        error: () => this.actionLoading.set(false)
      })
    );
  }
}
