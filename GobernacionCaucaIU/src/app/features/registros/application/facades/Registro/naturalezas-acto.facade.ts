import { Injectable, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { 
  NaturalezaActo, 
  CrearNaturalezaActoDto, 
  ActualizarNaturalezaActoDto 
} from '../../../domain/models/Registro/naturaleza-acto.model';
import { NaturalezasActoApiService } from '../../../infrastructure/api/Registro/naturalezas-acto-api.service';
import { ApiResponse } from '../../../../../core/shared/models/shared.model';

/**
 * @description
 * Facade (Capa de Aplicación) para la gestión del estado de Naturalezas de Acto.
 * Expone señales reactivas (Angular Signals) y métodos de orquestación de operaciones para la UI.
 */
@Injectable({
  providedIn: 'root'
})
export class NaturalezasActoFacade {
  private apiService = inject(NaturalezasActoApiService);

  // Signals
  readonly naturalezasActo = signal<NaturalezaActo[]>([]);
  readonly totalNaturalezasActo = signal<number>(0);
  
  // UI State
  readonly loading = signal<boolean>(false);
  readonly actionLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly selectedNaturalezaActo = signal<NaturalezaActo | null>(null);

  /**
   * Carga la lista paginada de naturalezas de acto.
   */
  cargarNaturalezasActo(pageNumber: number = 1, pageSize: number = 10): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService.obtenerTodos(pageNumber, pageSize).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.naturalezasActo.set(response.data.items || []);
          this.totalNaturalezasActo.set(response.data.totalCount);
        } else {
          this.error.set(response.message || 'Error al cargar naturalezas de acto');
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
   * Selecciona una naturaleza de acto por su ID.
   */
  seleccionarPorId(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.selectedNaturalezaActo.set(null);

    this.apiService.obtenerPorId(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.selectedNaturalezaActo.set(response.data);
        } else {
          this.error.set(response.message || 'Error al cargar naturaleza de acto');
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
    this.selectedNaturalezaActo.set(null);
  }

  /**
   * Crea una nueva naturaleza de acto.
   */
  crear(dto: CrearNaturalezaActoDto): Observable<ApiResponse<number>> {
    this.actionLoading.set(true);
    return this.apiService.crear(dto).pipe(
      tap({
        next: () => this.actionLoading.set(false),
        error: () => this.actionLoading.set(false)
      })
    );
  }

  /**
   * Actualiza una naturaleza de acto existente.
   */
  actualizar(id: number, dto: ActualizarNaturalezaActoDto): Observable<void> {
    this.actionLoading.set(true);
    return this.apiService.actualizar(id, dto).pipe(
      tap({
        next: () => this.actionLoading.set(false),
        error: () => this.actionLoading.set(false)
      })
    );
  }

  /**
   * Elimina una naturaleza de acto.
   */
  eliminar(id: number): Observable<void> {
    this.actionLoading.set(true);
    return this.apiService.eliminar(id).pipe(
      tap({
        next: () => {
          this.actionLoading.set(false);
          this.cargarNaturalezasActo();
        },
        error: () => this.actionLoading.set(false)
      })
    );
  }
}
