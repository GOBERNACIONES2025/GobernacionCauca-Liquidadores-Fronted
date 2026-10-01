import { Injectable, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { 
  TipoRol, 
  CrearTipoRolRequest, 
  ActualizarTipoRolRequest 
} from '../../../domain/models/Seguridad/tipo-rol.model';
import { TiposRolApiService } from '../../../infrastructure/api/Seguridad/tipos-rol-api.service';
import { ApiResponse } from '../../../../../core/shared/models/shared.model';

/**
 * @description
 * Facade (Capa de Aplicación) para la gestión del estado reactivo del catálogo de Tipos de Rol.
 * Expone señales reactivas (Angular Signals) y métodos de orquestación de operaciones para la UI.
 */
@Injectable({
  providedIn: 'root'
})
export class TiposRolFacade {
  private apiService = inject(TiposRolApiService);

  // Signals
  readonly tiposRol = signal<TipoRol[]>([]);
  readonly totalTiposRol = signal<number>(0);
  
  // UI State
  readonly loading = signal<boolean>(false);
  readonly actionLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly selectedTipoRol = signal<TipoRol | null>(null);

  /**
   * Carga la lista paginada de tipos de rol.
   */
  cargarTiposRol(pageNumber: number = 1, pageSize: number = 10, search?: string, activo?: boolean): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService.obtenerTodos(pageNumber, pageSize, search, activo).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.tiposRol.set(response.data.items || []);
          this.totalTiposRol.set(response.data.totalCount);
        } else {
          this.error.set(response.message || 'Error al cargar los tipos de rol');
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
   * Selecciona un tipo de rol por su ID.
   */
  seleccionarPorId(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.selectedTipoRol.set(null);

    this.apiService.obtenerPorId(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.selectedTipoRol.set(response.data);
        } else {
          this.error.set(response.message || 'Error al cargar el tipo de rol');
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
    this.selectedTipoRol.set(null);
  }

  /**
   * Crea un nuevo tipo de rol.
   */
  crear(dto: CrearTipoRolRequest): Observable<ApiResponse<number>> {
    this.actionLoading.set(true);
    return this.apiService.crear(dto).pipe(
      tap({
        next: () => this.actionLoading.set(false),
        error: () => this.actionLoading.set(false)
      })
    );
  }

  /**
   * Actualiza un tipo de rol existente.
   */
  actualizar(id: number, dto: ActualizarTipoRolRequest): Observable<void> {
    this.actionLoading.set(true);
    return this.apiService.actualizar(id, dto).pipe(
      tap({
        next: () => this.actionLoading.set(false),
        error: () => this.actionLoading.set(false)
      })
    );
  }

  /**
   * Elimina un tipo de rol.
   */
  eliminar(id: number): Observable<void> {
    this.actionLoading.set(true);
    return this.apiService.eliminar(id).pipe(
      tap({
        next: () => {
          this.actionLoading.set(false);
          this.cargarTiposRol();
        },
        error: () => this.actionLoading.set(false)
      })
    );
  }
}
