import { Injectable, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { 
  Usuario, 
  CrearUsuarioDto, 
  ActualizarUsuarioDto, 
  UsuarioQueryParams 
} from '../../../domain/models/Seguridad/usuario.model';
import { UsuariosApiService } from '../../../infrastructure/api/Seguridad/usuarios-api.service';
import { ApiResponse } from '../../../../../core/shared/models/shared.model';

/**
 * @description
 * Facade (Capa de Aplicación) para la gestión del estado de Usuarios de Seguridad.
 * Expone señales reactivas (Angular Signals) y métodos de orquestación de operaciones para la UI.
 */
@Injectable({
  providedIn: 'root'
})
export class UsuariosFacade {
  private apiService = inject(UsuariosApiService);

  // Signals
  readonly usuarios = signal<Usuario[]>([]);
  readonly totalUsuarios = signal<number>(0);
  
  // UI State
  readonly loading = signal<boolean>(false);
  readonly actionLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly selectedUsuario = signal<Usuario | null>(null);

  /**
   * Carga la lista paginada de usuarios con filtros opcionales.
   */
  cargarUsuarios(params?: UsuarioQueryParams): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService.obtenerTodos(params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.usuarios.set(response.data.items || []);
          this.totalUsuarios.set(response.data.totalCount);
        } else {
          this.error.set(response.message || 'Error al cargar usuarios');
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
   * Selecciona un usuario por su ID.
   */
  seleccionarPorId(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.selectedUsuario.set(null);

    this.apiService.obtenerPorId(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.selectedUsuario.set(response.data);
        } else {
          this.error.set(response.message || 'Error al cargar usuario');
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
    this.selectedUsuario.set(null);
  }

  /**
   * Registra un nuevo usuario.
   */
  crear(dto: CrearUsuarioDto): Observable<ApiResponse<number>> {
    this.actionLoading.set(true);
    return this.apiService.crear(dto).pipe(
      tap({
        next: () => this.actionLoading.set(false),
        error: () => this.actionLoading.set(false)
      })
    );
  }

  /**
   * Actualiza un usuario existente.
   */
  actualizar(id: number, dto: ActualizarUsuarioDto): Observable<void> {
    this.actionLoading.set(true);
    return this.apiService.actualizar(id, dto).pipe(
      tap({
        next: () => this.actionLoading.set(false),
        error: () => this.actionLoading.set(false)
      })
    );
  }

  /**
   * Elimina uno o más usuarios.
   */
  eliminar(ids: number[]): Observable<void> {
    this.actionLoading.set(true);
    return this.apiService.eliminar(ids).pipe(
      tap({
        next: () => {
          this.actionLoading.set(false);
          this.cargarUsuarios();
        },
        error: () => this.actionLoading.set(false)
      })
    );
  }
}
