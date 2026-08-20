import { Injectable, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Departamento } from '../../../domain/models/Territorios/departamento.model';
import { DepartamentosApiService } from '../../../infrastructure/api/Territorios/departamentos-api.service';
import { ApiResponse } from '../../../../../core/shared/models/shared.model';

/**
 * @description
 * Facade (Capa de Aplicación) para la gestión del estado de Departamentos.
 * Utiliza Signals de Angular para exponer un estado reactivo a la UI (Presentación),
 * orquestando las llamadas al DepartamentosApiService subyacente.
 */
@Injectable({
  providedIn: 'root'
})
export class DepartamentosFacade {
  private apiService = inject(DepartamentosApiService);

  // Estado centralizado expuesto como Signals
  readonly departamentos = signal<Departamento[]>([]);
  readonly totalDepartamentos = signal<number>(0);
  
  // Estado de UI
  readonly loading = signal<boolean>(false);
  readonly actionLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly selectedDepartamento = signal<Departamento | null>(null);

  /**
   * Carga la lista de departamentos de forma paginada y actualiza el estado (Signals).
   */
  cargarDepartamentos(pageNumber: number = 1, pageSize: number = 10): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService.obtenerTodos(pageNumber, pageSize).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.departamentos.set(response.data.items || []);
          this.totalDepartamentos.set(response.data.totalCount);
        } else {
          this.error.set(response.message || 'Error al cargar los departamentos');
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
   * Carga un departamento específico y lo almacena en el estado selectedDepartamento.
   */
  seleccionarDepartamentoPorId(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.selectedDepartamento.set(null);

    this.apiService.obtenerPorId(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.selectedDepartamento.set(response.data);
        } else {
          this.error.set(response.message || 'Error al cargar el departamento');
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
   * Limpia el departamento actualmente seleccionado.
   */
  limpiarSeleccion(): void {
    this.selectedDepartamento.set(null);
  }

  /**
   * Crea un nuevo departamento y retorna el Observable para que el componente maneje la navegación/notificación.
   */
  crearDepartamento(departamento: Partial<Departamento>): Observable<ApiResponse<number>> {
    this.actionLoading.set(true);
    return this.apiService.crear(departamento).pipe(
      tap({
        next: () => this.actionLoading.set(false),
        error: () => this.actionLoading.set(false)
      })
    );
  }

  /**
   * Actualiza un departamento existente.
   */
  actualizarDepartamento(id: number, departamento: Partial<Departamento>): Observable<void> {
    this.actionLoading.set(true);
    return this.apiService.actualizar(id, departamento).pipe(
      tap({
        next: () => this.actionLoading.set(false),
        error: () => this.actionLoading.set(false)
      })
    );
  }

  /**
   * Elimina un departamento.
   */
  eliminarDepartamento(id: number): Observable<void> {
    this.actionLoading.set(true);
    return this.apiService.eliminar(id).pipe(
      tap({
        next: () => {
          this.actionLoading.set(false);
          // Opcionalmente recargar la lista si la eliminación fue exitosa
          this.cargarDepartamentos();
        },
        error: () => this.actionLoading.set(false)
      })
    );
  }
}
