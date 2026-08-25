import { Injectable, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { 
  NormaListado, 
  NormaDetalle, 
  CrearNormaRequest, 
  ActualizarNormaRequest 
} from '../../../domain/models/Normatividad/norma.model';
import { NormasApiService } from '../../../infrastructure/api/Normatividad/normas-api.service';
import { ApiResponse } from '../../../../../core/shared/models/shared.model';

/**
 * @description
 * Facade (Capa de Aplicación) para la gestión del estado de Normas jurídicas.
 * Expone señales reactivas (Angular Signals) y métodos de orquestación de operaciones para la UI.
 */
@Injectable({
  providedIn: 'root'
})
export class NormasFacade {
  private apiService = inject(NormasApiService);

  // Signals
  readonly normas = signal<NormaListado[]>([]);
  readonly totalNormas = signal<number>(0);
  
  // UI State
  readonly loading = signal<boolean>(false);
  readonly actionLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly selectedNorma = signal<NormaDetalle | null>(null);

  /**
   * Carga la lista paginada de normas con filtro opcional por departamento.
   */
  cargarNormas(departamentoId?: number, pageNumber: number = 1, pageSize: number = 10): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService.obtenerTodos(departamentoId, pageNumber, pageSize).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.normas.set(response.data.items || []);
          this.totalNormas.set(response.data.totalCount);
        } else {
          this.error.set(response.message || 'Error al cargar las normas');
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
   * Selecciona y carga el detalle completo de una norma por su ID.
   */
  seleccionarPorId(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.selectedNorma.set(null);

    this.apiService.obtenerPorId(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.selectedNorma.set(response.data);
        } else {
          this.error.set(response.message || 'Error al cargar detalle de la norma');
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
    this.selectedNorma.set(null);
  }

  /**
   * Registra una nueva norma.
   */
  crear(dto: CrearNormaRequest): Observable<ApiResponse<number>> {
    this.actionLoading.set(true);
    return this.apiService.crear(dto).pipe(
      tap({
        next: () => this.actionLoading.set(false),
        error: () => this.actionLoading.set(false)
      })
    );
  }

  /**
   * Actualiza una norma existente.
   */
  actualizar(id: number, dto: ActualizarNormaRequest): Observable<void> {
    this.actionLoading.set(true);
    return this.apiService.actualizar(id, dto).pipe(
      tap({
        next: () => this.actionLoading.set(false),
        error: () => this.actionLoading.set(false)
      })
    );
  }

  /**
   * Actualiza el estado de una norma a un nuevo estado (ej. Derogada, Inactiva).
   */
  eliminar(id: number, nuevoEstadoNormaId: number): Observable<void> {
    this.actionLoading.set(true);
    return this.apiService.eliminar(id, nuevoEstadoNormaId).pipe(
      tap({
        next: () => {
          this.actionLoading.set(false);
          this.cargarNormas();
        },
        error: () => this.actionLoading.set(false)
      })
    );
  }
}
