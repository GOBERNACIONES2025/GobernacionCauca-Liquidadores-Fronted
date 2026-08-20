import { Injectable, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { 
  EstadoSolicitud, 
  CrearEstadoSolicitudDto, 
  ActualizarEstadoSolicitudDto 
} from '../../../domain/models/Radicacion/estado-solicitud.model';
import { EstadosSolicitudApiService } from '../../../infrastructure/api/Radicacion/estados-solicitud-api.service';
import { ApiResponse } from '../../../../../core/shared/models/shared.model';

/**
 * @description
 * Facade (Capa de Aplicación) para la gestión del estado de Estados de Solicitud (Radicación).
 * Expone señales reactivas (Angular Signals) y métodos de orquestación de operaciones para la UI.
 */
@Injectable({
  providedIn: 'root'
})
export class EstadosSolicitudFacade {
  private apiService = inject(EstadosSolicitudApiService);

  // Signals
  readonly estadosSolicitud = signal<EstadoSolicitud[]>([]);
  readonly totalEstadosSolicitud = signal<number>(0);
  
  // UI State
  readonly loading = signal<boolean>(false);
  readonly actionLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly selectedEstadoSolicitud = signal<EstadoSolicitud | null>(null);

  /**
   * Carga la lista paginada de estados de solicitud.
   */
  cargarEstadosSolicitud(pageNumber: number = 1, pageSize: number = 10): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService.obtenerTodos(pageNumber, pageSize).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.estadosSolicitud.set(response.data.items || []);
          this.totalEstadosSolicitud.set(response.data.totalCount);
        } else {
          this.error.set(response.message || 'Error al cargar estados de solicitud');
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
   * Selecciona un estado de solicitud por su ID.
   */
  seleccionarPorId(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.selectedEstadoSolicitud.set(null);

    this.apiService.obtenerPorId(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.selectedEstadoSolicitud.set(response.data);
        } else {
          this.error.set(response.message || 'Error al cargar estado de solicitud');
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
    this.selectedEstadoSolicitud.set(null);
  }

  /**
   * Registra un nuevo estado de solicitud.
   */
  crear(dto: CrearEstadoSolicitudDto): Observable<ApiResponse<number>> {
    this.actionLoading.set(true);
    return this.apiService.crear(dto).pipe(
      tap({
        next: () => this.actionLoading.set(false),
        error: () => this.actionLoading.set(false)
      })
    );
  }

  /**
   * Actualiza un estado de solicitud existente.
   */
  actualizar(id: number, dto: ActualizarEstadoSolicitudDto): Observable<void> {
    this.actionLoading.set(true);
    return this.apiService.actualizar(id, dto).pipe(
      tap({
        next: () => this.actionLoading.set(false),
        error: () => this.actionLoading.set(false)
      })
    );
  }

  /**
   * Elimina un estado de solicitud.
   */
  eliminar(id: number): Observable<void> {
    this.actionLoading.set(true);
    return this.apiService.eliminar(id).pipe(
      tap({
        next: () => {
          this.actionLoading.set(false);
          this.cargarEstadosSolicitud();
        },
        error: () => this.actionLoading.set(false)
      })
    );
  }
}
