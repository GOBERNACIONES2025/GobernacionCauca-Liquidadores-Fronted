import { Injectable, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { 
  Exencion, 
  CrearExencionRequest, 
  ActualizarExencionRequest 
} from '../../../domain/models/Exenciones/exencion.model';
import { ExencionesApiService } from '../../../infrastructure/api/Exenciones/exenciones-api.service';
import { ApiResponse } from '../../../../../core/shared/models/shared.model';

/**
 * @description
 * Facade (Capa de Aplicación) para la gestión del estado de Exenciones.
 * Orquesta la lógica de negocio y expone señales reactivas a los componentes.
 */
@Injectable({
  providedIn: 'root'
})
export class ExencionesFacade {
  private apiService = inject(ExencionesApiService);

  // Estado reactivo (Signals)
  readonly exenciones = signal<Exencion[]>([]);
  readonly totalExenciones = signal<number>(0);
  
  // Estado de UI
  readonly loading = signal<boolean>(false);
  readonly actionLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly selectedExencion = signal<Exencion | null>(null);

  /**
   * Carga la lista paginada de exenciones.
   */
  cargarExenciones(
    pageNumber: number = 1, 
    pageSize: number = 10, 
    departamentoId?: number, 
    terminoBusqueda?: string
  ): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService.obtenerTodos({ pageNumber, pageSize, departamentoId, searchTerm: terminoBusqueda }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.exenciones.set(response.data.items || []);
          this.totalExenciones.set(response.data.totalCount);
        } else {
          this.error.set(response.message || 'Error al cargar las exenciones');
        }
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(err.message || 'Error de conexión con el servidor');
        this.loading.set(false);
      }
    });
  }

  /**
   * Selecciona y carga los detalles de una exención por ID.
   */
  seleccionarPorId(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.selectedExencion.set(null);

    this.apiService.obtenerPorId(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.selectedExencion.set(response.data);
        } else {
          this.error.set(response.message || 'Error al cargar la exención');
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
    this.selectedExencion.set(null);
  }

  /**
   * Crea una nueva exención.
   */
  crear(dto: CrearExencionRequest): Observable<ApiResponse<number>> {
    this.actionLoading.set(true);
    return this.apiService.crear(dto).pipe(
      tap({
        next: () => this.actionLoading.set(false),
        error: () => this.actionLoading.set(false)
      })
    );
  }

  /**
   * Actualiza una exención existente.
   */
  actualizar(id: number, dto: ActualizarExencionRequest): Observable<void> {
    this.actionLoading.set(true);
    return this.apiService.actualizar(id, dto).pipe(
      tap({
        next: () => this.actionLoading.set(false),
        error: () => this.actionLoading.set(false)
      })
    );
  }

  /**
   * Elimina lógicamente una exención.
   */
  eliminar(id: number): Observable<void> {
    this.actionLoading.set(true);
    return this.apiService.eliminar(id).pipe(
      tap({
        next: () => {
          this.actionLoading.set(false);
          this.cargarExenciones();
        },
        error: () => this.actionLoading.set(false)
      })
    );
  }
}
