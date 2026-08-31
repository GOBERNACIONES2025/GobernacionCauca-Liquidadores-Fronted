import { Injectable, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { 
  CategoriaActo, 
  CrearCategoriaActoRequest, 
  ActualizarCategoriaActoRequest 
} from '../../../domain/models/Registro/categoria-acto.model';
import { CategoriasActoApiService } from '../../../infrastructure/api/Registro/categorias-acto-api.service';
import { ApiResponse } from '../../../../../core/shared/models/shared.model';

/**
 * @description
 * Facade (Capa de Aplicación) para la gestión del estado de Categorías de Acto.
 * Expone señales reactivas (Angular Signals) y métodos de orquestación de operaciones para la UI.
 */
@Injectable({
  providedIn: 'root'
})
export class CategoriasActoFacade {
  private apiService = inject(CategoriasActoApiService);

  // Signals
  readonly categoriasActo = signal<CategoriaActo[]>([]);
  readonly totalCategoriasActo = signal<number>(0);
  
  // UI State
  readonly loading = signal<boolean>(false);
  readonly actionLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly selectedCategoriaActo = signal<CategoriaActo | null>(null);

  /**
   * Carga la lista paginada de categorías de acto.
   */
  cargarCategoriasActo(pageNumber: number = 1, pageSize: number = 10, search?: string, activo?: boolean): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService.obtenerTodos(pageNumber, pageSize, search, activo).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.categoriasActo.set(response.data.items || []);
          this.totalCategoriasActo.set(response.data.totalCount);
        } else {
          this.error.set(response.message || 'Error al cargar categorías de acto');
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
   * Selecciona una categoría de acto por su ID.
   */
  seleccionarPorId(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.selectedCategoriaActo.set(null);

    this.apiService.obtenerPorId(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.selectedCategoriaActo.set(response.data);
        } else {
          this.error.set(response.message || 'Error al cargar categoría de acto');
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
    this.selectedCategoriaActo.set(null);
  }

  /**
   * Crea una nueva categoría de acto.
   */
  crear(dto: CrearCategoriaActoRequest): Observable<ApiResponse<number>> {
    this.actionLoading.set(true);
    return this.apiService.crear(dto).pipe(
      tap({
        next: () => this.actionLoading.set(false),
        error: () => this.actionLoading.set(false)
      })
    );
  }

  /**
   * Actualiza una categoría de acto existente.
   */
  actualizar(id: number, dto: ActualizarCategoriaActoRequest): Observable<void> {
    this.actionLoading.set(true);
    return this.apiService.actualizar(id, dto).pipe(
      tap({
        next: () => this.actionLoading.set(false),
        error: () => this.actionLoading.set(false)
      })
    );
  }

  /**
   * Elimina una categoría de acto.
   */
  eliminar(id: number): Observable<void> {
    this.actionLoading.set(true);
    return this.apiService.eliminar(id).pipe(
      tap({
        next: () => {
          this.actionLoading.set(false);
          this.cargarCategoriasActo();
        },
        error: () => this.actionLoading.set(false)
      })
    );
  }
}
