import { Injectable, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { 
  TipoPersona, 
  CrearTipoPersonaRequest, 
  ActualizarTipoPersonaRequest 
} from '../../../domain/models/Contribuyentes/tipo-persona.model';
import { TiposPersonaApiService } from '../../../infrastructure/api/Contribuyentes/tipos-persona-api.service';
import { ApiResponse } from '../../../../../core/shared/models/shared.model';

/**
 * @description
 * Facade (Capa de Aplicación) para la gestión del estado de Tipos de Persona.
 * Expone señales reactivas (Angular Signals) y métodos de orquestación de operaciones para la UI.
 */
@Injectable({
  providedIn: 'root'
})
export class TiposPersonaFacade {
  private apiService = inject(TiposPersonaApiService);

  // Signals
  readonly tiposPersona = signal<TipoPersona[]>([]);
  readonly totalTiposPersona = signal<number>(0);
  
  // UI State
  readonly loading = signal<boolean>(false);
  readonly actionLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly selectedTipoPersona = signal<TipoPersona | null>(null);

  /**
   * Carga la lista paginada de tipos de persona.
   */
  cargarTiposPersona(pageNumber: number = 1, pageSize: number = 10, search?: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService.obtenerTodos(pageNumber, pageSize, search).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.tiposPersona.set(response.data.items || []);
          this.totalTiposPersona.set(response.data.totalCount);
        } else {
          this.error.set(response.message || 'Error al cargar tipos de persona');
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
   * Selecciona un tipo de persona por su ID.
   */
  seleccionarPorId(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.selectedTipoPersona.set(null);

    this.apiService.obtenerPorId(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.selectedTipoPersona.set(response.data);
        } else {
          this.error.set(response.message || 'Error al cargar tipo de persona');
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
    this.selectedTipoPersona.set(null);
  }

  /**
   * Crea un nuevo tipo de persona.
   */
  crear(dto: CrearTipoPersonaRequest): Observable<ApiResponse<number>> {
    this.actionLoading.set(true);
    return this.apiService.crear(dto).pipe(
      tap({
        next: () => this.actionLoading.set(false),
        error: () => this.actionLoading.set(false)
      })
    );
  }

  /**
   * Actualiza un tipo de persona existente.
   */
  actualizar(id: number, dto: ActualizarTipoPersonaRequest): Observable<void> {
    this.actionLoading.set(true);
    return this.apiService.actualizar(id, dto).pipe(
      tap({
        next: () => this.actionLoading.set(false),
        error: () => this.actionLoading.set(false)
      })
    );
  }

  /**
   * Elimina un tipo de persona.
   */
  eliminar(id: number): Observable<void> {
    this.actionLoading.set(true);
    return this.apiService.eliminar(id).pipe(
      tap({
        next: () => {
          this.actionLoading.set(false);
          this.cargarTiposPersona();
        },
        error: () => this.actionLoading.set(false)
      })
    );
  }
}
