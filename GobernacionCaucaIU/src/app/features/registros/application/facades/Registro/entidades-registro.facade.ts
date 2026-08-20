import { Injectable, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { 
  EntidadRegistro, 
  CrearEntidadRegistroRequest, 
  ActualizarEntidadRegistroRequest 
} from '../../../domain/models/Registro/entidad-registro.model';
import { EntidadesRegistroApiService } from '../../../infrastructure/api/Registro/entidades-registro-api.service';
import { ApiResponse } from '../../../../../core/shared/models/shared.model';

/**
 * @description
 * Facade (Capa de Aplicación) para la gestión del estado de Entidades de Registro.
 * Expone señales reactivas (Angular Signals) y métodos de orquestación de operaciones para la UI.
 */
@Injectable({
  providedIn: 'root'
})
export class EntidadesRegistroFacade {
  private apiService = inject(EntidadesRegistroApiService);

  // Signals
  readonly entidadesRegistro = signal<EntidadRegistro[]>([]);
  readonly totalEntidadesRegistro = signal<number>(0);
  
  // UI State
  readonly loading = signal<boolean>(false);
  readonly actionLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly selectedEntidadRegistro = signal<EntidadRegistro | null>(null);

  /**
   * Carga la lista paginada de entidades de registro con filtros opcionales.
   */
  cargarEntidadesRegistro(
    pageNumber: number = 1, 
    pageSize: number = 10, 
    tipoEntidadRegistroId?: number, 
    departamentoId?: number, 
    municipioId?: number
  ): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService.obtenerTodos(pageNumber, pageSize, tipoEntidadRegistroId, departamentoId, municipioId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.entidadesRegistro.set(response.data.items || []);
          this.totalEntidadesRegistro.set(response.data.totalCount);
        } else {
          this.error.set(response.message || 'Error al cargar entidades de registro');
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
   * Selecciona una entidad de registro por su ID.
   */
  seleccionarPorId(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.selectedEntidadRegistro.set(null);

    this.apiService.obtenerPorId(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.selectedEntidadRegistro.set(response.data);
        } else {
          this.error.set(response.message || 'Error al cargar entidad de registro');
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
    this.selectedEntidadRegistro.set(null);
  }

  /**
   * Registra una nueva entidad de registro.
   */
  crear(dto: CrearEntidadRegistroRequest): Observable<ApiResponse<number>> {
    this.actionLoading.set(true);
    return this.apiService.crear(dto).pipe(
      tap({
        next: () => this.actionLoading.set(false),
        error: () => this.actionLoading.set(false)
      })
    );
  }

  /**
   * Actualiza una entidad de registro existente.
   */
  actualizar(id: number, dto: ActualizarEntidadRegistroRequest): Observable<void> {
    this.actionLoading.set(true);
    return this.apiService.actualizar(id, dto).pipe(
      tap({
        next: () => this.actionLoading.set(false),
        error: () => this.actionLoading.set(false)
      })
    );
  }

  /**
   * Elimina una entidad de registro.
   */
  eliminar(id: number): Observable<void> {
    this.actionLoading.set(true);
    return this.apiService.eliminar(id).pipe(
      tap({
        next: () => {
          this.actionLoading.set(false);
          this.cargarEntidadesRegistro();
        },
        error: () => this.actionLoading.set(false)
      })
    );
  }
}
