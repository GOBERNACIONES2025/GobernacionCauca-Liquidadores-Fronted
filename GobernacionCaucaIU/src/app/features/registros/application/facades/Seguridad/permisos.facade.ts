import { Injectable, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { 
  Permiso, 
  CrearPermisoRequest, 
  ActualizarPermisoRequest 
} from '../../../domain/models/Seguridad/permiso.model';
import { PermisosApiService } from '../../../infrastructure/api/Seguridad/permisos-api.service';
import { ApiResponse } from '../../../../../core/shared/models/shared.model';

@Injectable({
  providedIn: 'root'
})
export class PermisosFacade {
  private apiService = inject(PermisosApiService);

  readonly permisos = signal<Permiso[]>([]);
  readonly totalPermisos = signal<number>(0);
  readonly modulos = signal<string[]>([]);
  
  readonly loading = signal<boolean>(false);
  readonly actionLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly selectedPermiso = signal<Permiso | null>(null);

  cargarPermisos(
    pageNumber: number = 1, 
    pageSize: number = 10, 
    search?: string, 
    activo?: boolean,
    modulo?: string
  ): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService.obtenerTodos(pageNumber, pageSize, search, activo, modulo ? { modulo } : undefined).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.permisos.set(response.data.items || []);
          this.totalPermisos.set(response.data.totalCount);
        } else {
          this.error.set(response.message || 'Error al cargar permisos');
        }
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(err.message || 'Error de conexión');
        this.loading.set(false);
      }
    });
  }

  cargarModulos(): void {
    this.apiService.obtenerModulos().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.modulos.set(response.data);
        }
      },
      error: () => {}
    });
  }

  seleccionarPorId(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.selectedPermiso.set(null);

    this.apiService.obtenerPorId(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.selectedPermiso.set(response.data);
        } else {
          this.error.set(response.message || 'Error al cargar permiso');
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
    this.selectedPermiso.set(null);
  }

  crear(dto: CrearPermisoRequest): Observable<ApiResponse<number>> {
    this.actionLoading.set(true);
    return this.apiService.crear(dto).pipe(
      tap({
        next: () => this.actionLoading.set(false),
        error: () => this.actionLoading.set(false)
      })
    );
  }

  actualizar(id: number, dto: ActualizarPermisoRequest): Observable<void> {
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
          this.cargarPermisos();
        },
        error: () => this.actionLoading.set(false)
      })
    );
  }
}
