import { Injectable, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { 
  CausalReliquidacion, 
  CrearCausalReliquidacionRequest, 
  ActualizarCausalReliquidacionRequest 
} from '../../../domain/models/Liquidacion/causal-reliquidacion.model';
import { CausalesReliquidacionApiService } from '../../../infrastructure/api/Liquidacion/causales-reliquidacion-api.service';
import { ApiResponse } from '../../../../../core/shared/models/shared.model';

/**
 * Facade para la gestión del estado de Causales de Reliquidación.
 */
@Injectable({
  providedIn: 'root'
})
export class CausalesReliquidacionFacade {
  private apiService = inject(CausalesReliquidacionApiService);

  readonly causalesReliquidacion = signal<CausalReliquidacion[]>([]);
  readonly totalCausalesReliquidacion = signal<number>(0);
  
  readonly loading = signal<boolean>(false);
  readonly actionLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly selectedCausalReliquidacion = signal<CausalReliquidacion | null>(null);

  cargarCausalesReliquidacion(pageNumber: number = 1, pageSize: number = 10, search?: string, activo?: boolean): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService.obtenerTodos(pageNumber, pageSize, search, activo).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.causalesReliquidacion.set(response.data.items || []);
          this.totalCausalesReliquidacion.set(response.data.totalCount);
        } else {
          this.error.set(response.message || 'Error al cargar causales de reliquidación');
        }
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(err.message || 'Error de conexión');
        this.loading.set(false);
      }
    });
  }

  seleccionarPorId(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.selectedCausalReliquidacion.set(null);

    this.apiService.obtenerPorId(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.selectedCausalReliquidacion.set(response.data);
        } else {
          this.error.set(response.message || 'Error al cargar causal de reliquidación');
        }
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(err.message || 'Error de conexión');
        this.loading.set(false);
      }
    });
  }

  limpiarSeleccion(): void {
    this.selectedCausalReliquidacion.set(null);
  }

  crear(dto: CrearCausalReliquidacionRequest): Observable<ApiResponse<number>> {
    this.actionLoading.set(true);
    return this.apiService.crear(dto).pipe(
      tap({
        next: () => this.actionLoading.set(false),
        error: () => this.actionLoading.set(false)
      })
    );
  }

  actualizar(id: number, dto: ActualizarCausalReliquidacionRequest): Observable<void> {
    this.actionLoading.set(true);
    return this.apiService.actualizar(id, dto).pipe(
      tap({
        next: () => this.actionLoading.set(false),
        error: () => this.actionLoading.set(false)
      })
    );
  }


  eliminar(id: number): Observable<void> {
    this.actionLoading.set(true);
    return this.apiService.eliminar(id).pipe(
      tap({
        next: () => {
          this.actionLoading.set(false);
          this.cargarCausalesReliquidacion();
        },
        error: () => this.actionLoading.set(false)
      })
    );
  }
}
