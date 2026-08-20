import { Injectable, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { 
  Inmueble, 
  CrearInmuebleDto, 
  ActualizarInmuebleDto, 
  InmuebleQueryParams 
} from '../../../domain/models/Inmuebles/inmueble.model';
import { InmueblesApiService } from '../../../infrastructure/api/Inmuebles/inmuebles-api.service';
import { ApiResponse } from '../../../../../core/shared/models/shared.model';

/**
 * @description
 * Facade (Capa de Aplicación) para la gestión del estado de Inmuebles.
 * Expone señales reactivas (Angular Signals) y métodos de orquestación de operaciones para la UI.
 */
@Injectable({
  providedIn: 'root'
})
export class InmueblesFacade {
  private apiService = inject(InmueblesApiService);

  // Estado reactivo (Signals)
  readonly inmuebles = signal<Inmueble[]>([]);
  readonly totalInmuebles = signal<number>(0);
  
  // Estado de UI
  readonly loading = signal<boolean>(false);
  readonly actionLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly selectedInmueble = signal<Inmueble | null>(null);

  /**
   * Carga la lista paginada de inmuebles aplicando los filtros recibidos.
   */
  cargarInmuebles(params?: InmuebleQueryParams): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService.obtenerTodos(params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.inmuebles.set(response.data.items || []);
          this.totalInmuebles.set(response.data.totalCount);
        } else {
          this.error.set(response.message || 'Error al cargar los inmuebles');
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
   * Selecciona y carga un inmueble en detalle por su ID.
   */
  seleccionarPorId(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.selectedInmueble.set(null);

    this.apiService.obtenerPorId(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.selectedInmueble.set(response.data);
        } else {
          this.error.set(response.message || 'Error al cargar el inmueble');
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
   * Limpia la selección del inmueble actual.
   */
  limpiarSeleccion(): void {
    this.selectedInmueble.set(null);
  }

  /**
   * Registra un nuevo inmueble.
   */
  crear(dto: CrearInmuebleDto): Observable<ApiResponse<number>> {
    this.actionLoading.set(true);
    return this.apiService.crear(dto).pipe(
      tap({
        next: () => this.actionLoading.set(false),
        error: () => this.actionLoading.set(false)
      })
    );
  }

  /**
   * Actualiza un inmueble existente.
   */
  actualizar(id: number, dto: ActualizarInmuebleDto): Observable<void> {
    this.actionLoading.set(true);
    return this.apiService.actualizar(id, dto).pipe(
      tap({
        next: () => this.actionLoading.set(false),
        error: () => this.actionLoading.set(false)
      })
    );
  }
}
