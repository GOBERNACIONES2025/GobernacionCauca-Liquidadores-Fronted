import { Injectable, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { 
  TipoNorma, 
  CrearTipoNormaDto, 
  ActualizarTipoNormaDto 
} from '../../../domain/models/Normatividad/tipo-norma.model';
import { TiposNormaApiService } from '../../../infrastructure/api/Normatividad/tipos-norma-api.service';
import { ApiResponse } from '../../../../../core/shared/models/shared.model';

/**
 * @description
 * Facade (Capa de Aplicación) para la gestión del estado de Tipos de Norma.
 * Expone señales reactivas (Angular Signals) y métodos de orquestación de operaciones para la UI.
 */
@Injectable({
  providedIn: 'root'
})
export class TiposNormaFacade {
  private apiService = inject(TiposNormaApiService);

  // Signals
  readonly tiposNorma = signal<TipoNorma[]>([]);
  readonly totalTiposNorma = signal<number>(0);
  
  // UI State
  readonly loading = signal<boolean>(false);
  readonly actionLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly selectedTipoNorma = signal<TipoNorma | null>(null);

  /**
   * Carga la lista paginada de tipos de norma.
   */
  cargarTiposNorma(pageNumber: number = 1, pageSize: number = 10): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService.obtenerTodos(pageNumber, pageSize).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.tiposNorma.set(response.data.items || []);
          this.totalTiposNorma.set(response.data.totalCount);
        } else {
          this.error.set(response.message || 'Error al cargar tipos de norma');
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
   * Selecciona un tipo de norma por su ID.
   */
  seleccionarPorId(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.selectedTipoNorma.set(null);

    this.apiService.obtenerPorId(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.selectedTipoNorma.set(response.data);
        } else {
          this.error.set(response.message || 'Error al cargar tipo de norma');
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
    this.selectedTipoNorma.set(null);
  }

  /**
   * Crea un nuevo tipo de norma.
   */
  crear(dto: CrearTipoNormaDto): Observable<ApiResponse<number>> {
    this.actionLoading.set(true);
    return this.apiService.crear(dto).pipe(
      tap({
        next: () => this.actionLoading.set(false),
        error: () => this.actionLoading.set(false)
      })
    );
  }

  /**
   * Actualiza un tipo de norma existente.
   */
  actualizar(id: number, dto: ActualizarTipoNormaDto): Observable<void> {
    this.actionLoading.set(true);
    return this.apiService.actualizar(id, dto).pipe(
      tap({
        next: () => this.actionLoading.set(false),
        error: () => this.actionLoading.set(false)
      })
    );
  }

  /**
   * Elimina un tipo de norma.
   */
  eliminar(id: number): Observable<void> {
    this.actionLoading.set(true);
    return this.apiService.eliminar(id).pipe(
      tap({
        next: () => {
          this.actionLoading.set(false);
          this.cargarTiposNorma();
        },
        error: () => this.actionLoading.set(false)
      })
    );
  }
}
