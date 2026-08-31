import { Injectable, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { 
  TipoBeneficiarioExencion, 
  CrearTipoBeneficiarioExencionRequest, 
  ActualizarTipoBeneficiarioExencionRequest 
} from '../../../domain/models/Exenciones/tipo-beneficiario-exencion.model';
import { TiposBeneficiarioExencionApiService } from '../../../infrastructure/api/Exenciones/tipos-beneficiario-exencion-api.service';
import { ApiResponse } from '../../../../../core/shared/models/shared.model';

/**
 * @description
 * Facade (Capa de Aplicación) para la gestión de estado de Tipos de Beneficiarios de Exención.
 * Expone señales (Signals) reactivas para la interfaz de usuario.
 */
@Injectable({
  providedIn: 'root'
})
export class TiposBeneficiarioExencionFacade {
  private apiService = inject(TiposBeneficiarioExencionApiService);

  // Estado reactivo (Signals)
  readonly tiposBeneficiario = signal<TipoBeneficiarioExencion[]>([]);
  readonly totalTiposBeneficiario = signal<number>(0);
  
  // Estado de UI
  readonly loading = signal<boolean>(false);
  readonly actionLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly selectedTipoBeneficiario = signal<TipoBeneficiarioExencion | null>(null);

  /**
   * Carga la lista paginada de tipos de beneficiarios.
   */
  cargarTiposBeneficiario(pageNumber: number = 1, pageSize: number = 10, search?: string, activo?: boolean): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService.obtenerTodos(pageNumber, pageSize, search, activo).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.tiposBeneficiario.set(response.data.items || []);
          this.totalTiposBeneficiario.set(response.data.totalCount);
        } else {
          this.error.set(response.message || 'Error al cargar tipos de beneficiario');
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
   * Selecciona y carga un tipo de beneficiario por su ID.
   */
  seleccionarPorId(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.selectedTipoBeneficiario.set(null);

    this.apiService.obtenerPorId(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.selectedTipoBeneficiario.set(response.data);
        } else {
          this.error.set(response.message || 'Error al cargar tipo de beneficiario');
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
   * Limpia el elemento seleccionado.
   */
  limpiarSeleccion(): void {
    this.selectedTipoBeneficiario.set(null);
  }

  /**
   * Crea un nuevo tipo de beneficiario.
   */
  crear(dto: CrearTipoBeneficiarioExencionRequest): Observable<ApiResponse<number>> {
    this.actionLoading.set(true);
    return this.apiService.crear(dto).pipe(
      tap({
        next: () => this.actionLoading.set(false),
        error: () => this.actionLoading.set(false)
      })
    );
  }

  /**
   * Actualiza un tipo de beneficiario existente.
   */
  actualizar(id: number, dto: ActualizarTipoBeneficiarioExencionRequest): Observable<void> {
    this.actionLoading.set(true);
    return this.apiService.actualizar(id, dto).pipe(
      tap({
        next: () => this.actionLoading.set(false),
        error: () => this.actionLoading.set(false)
      })
    );
  }

  /**
   * Elimina un tipo de beneficiario.
   */
  eliminar(id: number): Observable<void> {
    this.actionLoading.set(true);
    return this.apiService.eliminar(id).pipe(
      tap({
        next: () => {
          this.actionLoading.set(false);
          this.cargarTiposBeneficiario();
        },
        error: () => this.actionLoading.set(false)
      })
    );
  }
}
