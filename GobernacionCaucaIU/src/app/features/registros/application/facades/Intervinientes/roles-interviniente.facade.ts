import { Injectable, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { 
  RolInterviniente, 
  CrearRolIntervinienteRequest, 
  ActualizarRolIntervinienteRequest 
} from '../../../domain/models/Intervinientes/rol-interviniente.model';
import { RolesIntervinienteApiService } from '../../../infrastructure/api/Intervinientes/roles-interviniente-api.service';
import { ApiResponse } from '../../../../../core/shared/models/shared.model';

/**
 * @description
 * Facade (Capa de Aplicación) para la gestión del estado de Roles de Intervinientes.
 * Expone señales reactivas (Angular Signals) y métodos de orquestación de operaciones para la UI.
 */
@Injectable({
  providedIn: 'root'
})
export class RolesIntervinienteFacade {
  private apiService = inject(RolesIntervinienteApiService);

  // Estado reactivo (Signals)
  readonly rolesInterviniente = signal<RolInterviniente[]>([]);
  readonly totalRolesInterviniente = signal<number>(0);
  
  // Estado de UI
  readonly loading = signal<boolean>(false);
  readonly actionLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly selectedRolInterviniente = signal<RolInterviniente | null>(null);

  /**
   * Carga la lista paginada de roles de intervinientes.
   */
  cargarRolesInterviniente(pageNumber: number = 1, pageSize: number = 10): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService.obtenerTodos(pageNumber, pageSize).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.rolesInterviniente.set(response.data.items || []);
          this.totalRolesInterviniente.set(response.data.totalCount);
        } else {
          this.error.set(response.message || 'Error al cargar los roles de interviniente');
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
   * Selecciona y carga un rol de interviniente por su ID.
   */
  seleccionarPorId(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.selectedRolInterviniente.set(null);

    this.apiService.obtenerPorId(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.selectedRolInterviniente.set(response.data);
        } else {
          this.error.set(response.message || 'Error al cargar el rol de interviniente');
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
   * Limpia la selección del rol actual.
   */
  limpiarSeleccion(): void {
    this.selectedRolInterviniente.set(null);
  }

  /**
   * Registra un nuevo rol de interviniente.
   */
  crear(dto: CrearRolIntervinienteRequest): Observable<ApiResponse<number>> {
    this.actionLoading.set(true);
    return this.apiService.crear(dto).pipe(
      tap({
        next: () => this.actionLoading.set(false),
        error: () => this.actionLoading.set(false)
      })
    );
  }

  /**
   * Actualiza un rol de interviniente existente.
   */
  actualizar(id: number, dto: ActualizarRolIntervinienteRequest): Observable<void> {
    this.actionLoading.set(true);
    return this.apiService.actualizar(id, dto).pipe(
      tap({
        next: () => this.actionLoading.set(false),
        error: () => this.actionLoading.set(false)
      })
    );
  }

  /**
   * Inactiva (elimina lógicamente) un rol de interviniente.
   */
  eliminar(id: number): Observable<void> {
    this.actionLoading.set(true);
    return this.apiService.eliminar(id).pipe(
      tap({
        next: () => {
          this.actionLoading.set(false);
          this.cargarRolesInterviniente();
        },
        error: () => this.actionLoading.set(false)
      })
    );
  }
}
