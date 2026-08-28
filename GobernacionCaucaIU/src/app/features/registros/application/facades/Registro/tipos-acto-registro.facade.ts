import { Injectable, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { 
  TipoActoRegistro, 
  CrearTipoActoRegistroRequest, 
  ActualizarTipoActoRegistroRequest 
} from '../../../domain/models/Registro/tipo-acto-registro.model';
import { TiposActoRegistroApiService } from '../../../infrastructure/api/Registro/tipos-acto-registro-api.service';
import { ApiResponse } from '../../../../../core/shared/models/shared.model';

/**
 * @description
 * Facade (Capa de Aplicación) para la gestión del estado de Tipos de Acto de Registro.
 * Expone señales reactivas (Angular Signals) y métodos de orquestación de operaciones para la UI.
 */
@Injectable({
  providedIn: 'root'
})
export class TiposActoRegistroFacade {
  private apiService = inject(TiposActoRegistroApiService);

  // Signals
  readonly tiposActoRegistro = signal<TipoActoRegistro[]>([]);
  readonly totalTiposActoRegistro = signal<number>(0);
  
  // UI State
  readonly loading = signal<boolean>(false);
  readonly actionLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly selectedTipoActoRegistro = signal<TipoActoRegistro | null>(null);

  /**
   * Carga la lista paginada de tipos de acto de registro.
   */
  cargarTiposActoRegistro(pageNumber: number = 1, pageSize: number = 10, search?: string, activo?: boolean): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService.obtenerTodos(pageNumber, pageSize, search, activo).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.tiposActoRegistro.set(response.data.items || []);
          this.totalTiposActoRegistro.set(response.data.totalCount);
        } else {
          this.error.set(response.message || 'Error al cargar tipos de acto de registro');
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
   * Carga los tipos de acto permitidos y activos para una entidad de registro.
   */
  cargarTiposActoPorEntidad(entidadRegistroId: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService.obtenerPorEntidad(entidadRegistroId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.tiposActoRegistro.set(response.data || []);
          this.totalTiposActoRegistro.set(response.data.length);
        } else {
          this.error.set(response.message || 'Error al cargar tipos de acto para la entidad');
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
   * Selecciona un tipo de acto de registro por su ID.
   */
  seleccionarPorId(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.selectedTipoActoRegistro.set(null);

    this.apiService.obtenerPorId(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.selectedTipoActoRegistro.set(response.data);
        } else {
          this.error.set(response.message || 'Error al cargar tipo de acto de registro');
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
    this.selectedTipoActoRegistro.set(null);
  }

  /**
   * Crea un nuevo tipo de acto de registro.
   */
  crear(dto: CrearTipoActoRegistroRequest): Observable<ApiResponse<number>> {
    this.actionLoading.set(true);
    return this.apiService.crear(dto).pipe(
      tap({
        next: () => this.actionLoading.set(false),
        error: () => this.actionLoading.set(false)
      })
    );
  }

  /**
   * Actualiza un tipo de acto de registro existente.
   */
  actualizar(id: number, dto: ActualizarTipoActoRegistroRequest): Observable<void> {
    this.actionLoading.set(true);
    return this.apiService.actualizar(id, dto).pipe(
      tap({
        next: () => this.actionLoading.set(false),
        error: () => this.actionLoading.set(false)
      })
    );
  }

  /**
   * Elimina un tipo de acto de registro.
   */
  eliminar(id: number): Observable<void> {
    this.actionLoading.set(true);
    return this.apiService.eliminar(id).pipe(
      tap({
        next: () => {
          this.actionLoading.set(false);
          this.cargarTiposActoRegistro();
        },
        error: () => this.actionLoading.set(false)
      })
    );
  }
}
