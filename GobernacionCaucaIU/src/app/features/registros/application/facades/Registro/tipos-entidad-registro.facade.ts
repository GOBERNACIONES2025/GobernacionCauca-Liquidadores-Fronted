import { Injectable, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { TipoEntidadRegistro, CrearTipoEntidadRegistroRequest, ActualizarTipoEntidadRegistroRequest } from '../../../domain/models/Registro/tipo-entidad-registro.model';
import { TiposEntidadRegistroApiService } from '../../../infrastructure/api/Registro/tipos-entidad-registro-api.service';
import { ApiResponse } from '../../../../../core/shared/models/shared.model';

/**
 * @description
 * Facade (Capa de Aplicación) para la gestión del estado de Tipos de Entidad de Registro.
 * Expone señales reactivas (Angular Signals) y métodos de orquestación de operaciones para la UI.
 */
@Injectable({
  providedIn: 'root'
})
export class TiposEntidadRegistroFacade {
  private apiService = inject(TiposEntidadRegistroApiService);

  // Signals
  readonly tiposEntidadRegistro = signal<TipoEntidadRegistro[]>([]);
  readonly totalTiposEntidadRegistro = signal<number>(0);
  
  // UI State
  readonly loading = signal<boolean>(false);
  readonly actionLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly selectedTipoEntidadRegistro = signal<TipoEntidadRegistro | null>(null);

  /**
   * Carga la lista paginada de tipos de entidad de registro.
   */
  cargarTiposEntidadRegistro(pageNumber: number = 1, pageSize: number = 10, search?: string, activo?: boolean): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService.obtenerTodos(pageNumber, pageSize, search, activo).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.tiposEntidadRegistro.set(response.data.items || []);
          this.totalTiposEntidadRegistro.set(response.data.totalCount);
        } else {
          this.error.set(response.message || 'Error al cargar tipos de entidad de registro');
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
   * Selecciona un tipo de entidad de registro por su ID.
   */
  seleccionarPorId(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.selectedTipoEntidadRegistro.set(null);

    this.apiService.obtenerPorId(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.selectedTipoEntidadRegistro.set(response.data);
        } else {
          this.error.set(response.message || 'Error al cargar tipo de entidad de registro');
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
    this.selectedTipoEntidadRegistro.set(null);
  }

  /**
   * Crea un nuevo tipo de entidad de registro.
   */
  crear(dto: CrearTipoEntidadRegistroRequest): Observable<ApiResponse<number>> {
    this.actionLoading.set(true);
    return this.apiService.crear(dto).pipe(
      tap({
        next: () => this.actionLoading.set(false),
        error: () => this.actionLoading.set(false)
      })
    );
  }

  /**
   * Actualiza un tipo de entidad de registro existente.
   */
  actualizar(id: number, dto: ActualizarTipoEntidadRegistroRequest): Observable<void> {
    this.actionLoading.set(true);
    return this.apiService.actualizar(id, dto).pipe(
      tap({
        next: () => this.actionLoading.set(false),
        error: () => this.actionLoading.set(false)
      })
    );
  }

  /**
   * Elimina un tipo de entidad de registro.
   */
  eliminar(id: number): Observable<void> {
    this.actionLoading.set(true);
    return this.apiService.eliminar(id).pipe(
      tap({
        next: () => {
          this.actionLoading.set(false);
          this.cargarTiposEntidadRegistro();
        },
        error: () => this.actionLoading.set(false)
      })
    );
  }
}
