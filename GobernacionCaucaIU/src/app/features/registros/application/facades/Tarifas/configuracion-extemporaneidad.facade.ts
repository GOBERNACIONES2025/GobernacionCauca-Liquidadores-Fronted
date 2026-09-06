import { Injectable, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import {
  ConfiguracionExtemporaneidad,
  CrearConfiguracionExtemporaneidadRequest,
  ActualizarConfiguracionExtemporaneidadRequest,
  ConfiguracionExtemporaneidadQueryParams
} from '../../../domain/models/Tarifas/configuracion-extemporaneidad.model';
import { ConfiguracionExtemporaneidadApiService } from '../../../infrastructure/api/Tarifas/configuracion-extemporaneidad-api.service';
import { ApiResponse } from '../../../../../core/shared/models/shared.model';

/**
 * @description
 * Facade (Capa de Aplicación) para la gestión del estado reactivo de Configuraciones de Extemporaneidad.
 * Expone señales (Angular Signals) y métodos de orquestación para la UI.
 */
@Injectable({
  providedIn: 'root'
})
export class ConfiguracionExtemporaneidadFacade {
  private apiService = inject(ConfiguracionExtemporaneidadApiService);

  // Signals reactivos
  readonly configuraciones = signal<ConfiguracionExtemporaneidad[]>([]);
  readonly totalConfiguraciones = signal<number>(0);

  // Estados de la UI
  readonly loading = signal<boolean>(false);
  readonly actionLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly selectedConfiguracion = signal<ConfiguracionExtemporaneidad | null>(null);

  /**
   * Carga la lista paginada de configuraciones de extemporaneidad con filtros opcionales.
   */
  cargarConfiguraciones(params?: ConfiguracionExtemporaneidadQueryParams): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService.obtenerTodos(params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.configuraciones.set(response.data.items || []);
          this.totalConfiguraciones.set(response.data.totalCount);
        } else {
          this.error.set(response.message || 'Error al cargar configuraciones de extemporaneidad');
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
   * Obtiene y selecciona una configuración por su identificador.
   */
  seleccionarPorId(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.selectedConfiguracion.set(null);

    this.apiService.obtenerPorId(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.selectedConfiguracion.set(response.data);
        } else {
          this.error.set(response.message || 'Error al cargar detalle');
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
   * Limpia la selección actual.
   */
  limpiarSeleccion(): void {
    this.selectedConfiguracion.set(null);
  }

  /**
   * Registra una nueva configuración de extemporaneidad.
   */
  crear(dto: CrearConfiguracionExtemporaneidadRequest): Observable<ApiResponse<number>> {
    this.actionLoading.set(true);
    return this.apiService.crear(dto).pipe(
      tap({
        next: () => this.actionLoading.set(false),
        error: () => this.actionLoading.set(false)
      })
    );
  }

  /**
   * Actualiza una configuración de extemporaneidad existente.
   */
  actualizar(id: number, dto: ActualizarConfiguracionExtemporaneidadRequest): Observable<void> {
    this.actionLoading.set(true);
    return this.apiService.actualizar(id, dto).pipe(
      tap({
        next: () => this.actionLoading.set(false),
        error: () => this.actionLoading.set(false)
      })
    );
  }

  /**
   * Elimina lógicamente una configuración de extemporaneidad.
   */
  eliminar(id: number): Observable<void> {
    this.actionLoading.set(true);
    return this.apiService.eliminar(id).pipe(
      tap({
        next: () => {
          this.actionLoading.set(false);
          this.cargarConfiguraciones();
        },
        error: () => this.actionLoading.set(false)
      })
    );
  }
}
