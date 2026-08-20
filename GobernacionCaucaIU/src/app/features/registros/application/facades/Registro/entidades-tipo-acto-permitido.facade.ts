import { Injectable, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { 
  EntidadTipoActoPermitido, 
  CrearEntidadTipoActoPermitidoDto, 
  ActualizarEntidadTipoActoPermitidoDto 
} from '../../../domain/models/Registro/entidad-tipo-acto-permitido.model';
import { EntidadesTipoActoPermitidoApiService } from '../../../infrastructure/api/Registro/entidades-tipo-acto-permitido-api.service';
import { ApiResponse } from '../../../../../core/shared/models/shared.model';

/**
 * @description
 * Facade (Capa de Aplicación) para la gestión del estado de Entidades - Tipos de Acto Permitidos.
 * Expone señales reactivas (Angular Signals) y métodos de orquestación de operaciones para la UI.
 */
@Injectable({
  providedIn: 'root'
})
export class EntidadesTipoActoPermitidoFacade {
  private apiService = inject(EntidadesTipoActoPermitidoApiService);

  // Signals
  readonly entidadesTipoActoPermitido = signal<EntidadTipoActoPermitido[]>([]);
  readonly totalEntidadesTipoActoPermitido = signal<number>(0);
  
  // UI State
  readonly loading = signal<boolean>(false);
  readonly actionLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly selectedEntidadTipoActoPermitido = signal<EntidadTipoActoPermitido | null>(null);

  /**
   * Carga la lista paginada de relaciones permitidas con filtros opcionales.
   */
  cargarEntidadesTipoActoPermitido(
    pageNumber: number = 1, 
    pageSize: number = 10, 
    entidadRegistroId?: number, 
    tipoActoRegistroId?: number
  ): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService.obtenerTodos(pageNumber, pageSize, entidadRegistroId, tipoActoRegistroId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.entidadesTipoActoPermitido.set(response.data.items || []);
          this.totalEntidadesTipoActoPermitido.set(response.data.totalCount);
        } else {
          this.error.set(response.message || 'Error al cargar tipos de acto permitidos');
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
   * Selecciona una relación por su ID.
   */
  seleccionarPorId(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.selectedEntidadTipoActoPermitido.set(null);

    this.apiService.obtenerPorId(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.selectedEntidadTipoActoPermitido.set(response.data);
        } else {
          this.error.set(response.message || 'Error al cargar tipo de acto permitido');
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
    this.selectedEntidadTipoActoPermitido.set(null);
  }

  /**
   * Registra una nueva relación permitida.
   */
  crear(dto: CrearEntidadTipoActoPermitidoDto): Observable<ApiResponse<number>> {
    this.actionLoading.set(true);
    return this.apiService.crear(dto).pipe(
      tap({
        next: () => this.actionLoading.set(false),
        error: () => this.actionLoading.set(false)
      })
    );
  }

  /**
   * Actualiza una relación permitida existente.
   */
  actualizar(id: number, dto: ActualizarEntidadTipoActoPermitidoDto): Observable<void> {
    this.actionLoading.set(true);
    return this.apiService.actualizar(id, dto).pipe(
      tap({
        next: () => this.actionLoading.set(false),
        error: () => this.actionLoading.set(false)
      })
    );
  }

  /**
   * Elimina una relación permitida.
   */
  eliminar(id: number): Observable<void> {
    this.actionLoading.set(true);
    return this.apiService.eliminar(id).pipe(
      tap({
        next: () => {
          this.actionLoading.set(false);
          this.cargarEntidadesTipoActoPermitido();
        },
        error: () => this.actionLoading.set(false)
      })
    );
  }
}
