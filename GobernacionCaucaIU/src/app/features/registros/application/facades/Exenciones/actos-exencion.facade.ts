import { Injectable, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ActoExencion, CrearActoExencionRequest } from '../../../domain/models/Exenciones/acto-exencion.model';
import { ActosExencionApiService } from '../../../infrastructure/api/Exenciones/actos-exencion-api.service';
import { ApiResponse } from '../../../../../core/shared/models/shared.model';

/**
 * @description
 * Facade (Capa de Aplicación) para la gestión de vinculaciones entre Tipos de Acto y Exenciones.
 */
@Injectable({
  providedIn: 'root'
})
export class ActosExencionFacade {
  private apiService = inject(ActosExencionApiService);

  // Estado reactivo (Signals)
  readonly actosExencion = signal<ActoExencion[]>([]);
  readonly totalActosExencion = signal<number>(0);
  
  // Estado de UI
  readonly loading = signal<boolean>(false);
  readonly actionLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly selectedActoExencion = signal<ActoExencion | null>(null);

  /**
   * Carga la lista paginada de vinculaciones Acto-Exención.
   */
  cargarActosExencion(pageNumber: number = 1, pageSize: number = 10, exencionId?: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService.obtenerTodos(pageNumber, pageSize, exencionId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.actosExencion.set(response.data.items || []);
          this.totalActosExencion.set(response.data.totalCount);
        } else {
          this.error.set(response.message || 'Error al cargar vinculaciones');
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
   * Selecciona y carga los detalles de una vinculación por ID.
   */
  seleccionarPorId(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.selectedActoExencion.set(null);

    this.apiService.obtenerPorId(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.selectedActoExencion.set(response.data);
        } else {
          this.error.set(response.message || 'Error al cargar vinculación');
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
    this.selectedActoExencion.set(null);
  }

  /**
   * Vincula nuevos tipos de acto a una exención.
   */
  vincularTiposActo(dto: CrearActoExencionRequest): Observable<ApiResponse<number[]>> {
    this.actionLoading.set(true);
    return this.apiService.crear(dto).pipe(
      tap({
        next: () => this.actionLoading.set(false),
        error: () => this.actionLoading.set(false)
      })
    );
  }

  /**
   * Sincroniza la lista de tipos de acto vinculados a una exención.
   */
  sincronizarTiposActo(exencionId: number, tiposActoRegistroIds: number[]): Observable<void> {
    this.actionLoading.set(true);
    return this.apiService.actualizar(exencionId, tiposActoRegistroIds).pipe(
      tap({
        next: () => this.actionLoading.set(false),
        error: () => this.actionLoading.set(false)
      })
    );
  }
}
