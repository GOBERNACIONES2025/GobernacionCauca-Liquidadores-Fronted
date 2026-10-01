import { Injectable, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { 
  CausalAnulacion, 
  CrearCausalAnulacionRequest, 
  ActualizarCausalAnulacionRequest 
} from '../../../domain/models/Liquidacion/causal-anulacion.model';
import { CausalesAnulacionApiService } from '../../../infrastructure/api/Liquidacion/causales-anulacion-api.service';
import { ApiResponse } from '../../../../../core/shared/models/shared.model';

/**
 * Facade para la gestión del estado de Causales de Anulación.
 */
@Injectable({
  providedIn: 'root'
})
export class CausalesAnulacionFacade {
  private apiService = inject(CausalesAnulacionApiService);
  
  readonly causalesAnulacion = signal<CausalAnulacion[]>([]);
  readonly totalCausalesAnulacion = signal<number>(0);
  
  readonly loading = signal<boolean>(false);
  readonly actionLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly selectedCausalAnulacion = signal<CausalAnulacion | null>(null);

  cargarCausalesAnulacion(pageNumber: number = 1, pageSize: number = 10, search?: string, activo?: boolean): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService.obtenerTodos(pageNumber, pageSize, search, activo).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.causalesAnulacion.set(response.data.items || []);
          this.totalCausalesAnulacion.set(response.data.totalCount);
        } else {
          this.error.set(response.message || 'Error al cargar causales de anulación');
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
    this.selectedCausalAnulacion.set(null);

    this.apiService.obtenerPorId(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.selectedCausalAnulacion.set(response.data);
        } else {
          this.error.set(response.message || 'Error al cargar causal de anulación');
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
    this.selectedCausalAnulacion.set(null);
  }

  crear(dto: CrearCausalAnulacionRequest): Observable<ApiResponse<number>> {
    this.actionLoading.set(true);
    return this.apiService.crear(dto).pipe(
      tap({
        next: () => this.actionLoading.set(false),
        error: () => this.actionLoading.set(false)
      })
    );
  }


  actualizar(id: number, dto: ActualizarCausalAnulacionRequest): Observable<void> {
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
          this.cargarCausalesAnulacion();
        },
        error: () => this.actionLoading.set(false)
      })
    );
  }
}
