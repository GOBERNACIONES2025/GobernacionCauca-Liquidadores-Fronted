import { Injectable, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { 
  Contribuyente, 
  CrearContribuyenteRequest, 
  ActualizarContribuyenteRequest 
} from '../../../domain/models/Contribuyentes/contribuyente.model';
import { ContribuyentesApiService } from '../../../infrastructure/api/Contribuyentes/contribuyentes-api.service';
import { ApiResponse } from '../../../../../core/shared/models/shared.model';

/**
 * @description
 * Facade (Capa de Aplicación) para la gestión del estado de Contribuyentes en Registros.
 * Expone señales reactivas (Angular Signals) y métodos de orquestación de operaciones para la UI.
 */
@Injectable({
  providedIn: 'root'
})
export class ContribuyentesFacade {
  private apiService = inject(ContribuyentesApiService);

  // Signals
  readonly contribuyentes = signal<Contribuyente[]>([]);
  readonly totalContribuyentes = signal<number>(0);
  
  // UI State
  readonly loading = signal<boolean>(false);
  readonly actionLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly selectedContribuyente = signal<Contribuyente | null>(null);

  /**
   * Carga la lista paginada de contribuyentes.
   */
  cargarContribuyentes(pageNumber: number = 1, pageSize: number = 10): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService.obtenerTodos(pageNumber, pageSize).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.contribuyentes.set(response.data.items || []);
          this.totalContribuyentes.set(response.data.totalCount);
        } else {
          this.error.set(response.message || 'Error al cargar contribuyentes');
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
   * Selecciona un contribuyente por su ID.
   */
  seleccionarPorId(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.selectedContribuyente.set(null);

    this.apiService.obtenerPorId(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.selectedContribuyente.set(response.data);
        } else {
          this.error.set(response.message || 'Error al cargar contribuyente');
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
    this.selectedContribuyente.set(null);
  }

  /**
   * Crea un nuevo contribuyente.
   */
  crear(dto: CrearContribuyenteRequest): Observable<ApiResponse<number>> {
    this.actionLoading.set(true);
    return this.apiService.crear(dto).pipe(
      tap({
        next: () => this.actionLoading.set(false),
        error: () => this.actionLoading.set(false)
      })
    );
  }

  /**
   * Actualiza un contribuyente existente.
   */
  actualizar(id: number, dto: ActualizarContribuyenteRequest): Observable<void> {
    this.actionLoading.set(true);
    return this.apiService.actualizar(id, dto).pipe(
      tap({
        next: () => this.actionLoading.set(false),
        error: () => this.actionLoading.set(false)
      })
    );
  }

  /**
   * Elimina un contribuyente.
   */
  eliminar(id: number): Observable<void> {
    this.actionLoading.set(true);
    return this.apiService.eliminar(id).pipe(
      tap({
        next: () => {
          this.actionLoading.set(false);
          this.cargarContribuyentes();
        },
        error: () => this.actionLoading.set(false)
      })
    );
  }
}
