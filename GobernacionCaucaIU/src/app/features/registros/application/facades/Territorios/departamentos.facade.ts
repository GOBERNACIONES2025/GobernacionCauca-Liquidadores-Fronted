import { Injectable, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, tap, catchError } from 'rxjs';
import { Departamento, CrearDepartamentoRequest, ActualizarDepartamentoRequest } from '../../../domain/models/Territorios/departamento.model';
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
  cargarDepartamentos(pageNumber: number = 1, pageSize: number = 10, search?: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService.obtenerTodos(pageNumber, pageSize, search).subscribe({
      next: (response) => {
        if (response.data) {
          this.departamentos.set(response.data.items || []);
          this.totalDepartamentos.set(response.data.totalCount || 0);
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
        if (response.data) {
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
   * Crea un nuevo departamento mapeándolo estrictamente al Request.
   */
  crearDepartamento(departamento: Partial<Departamento>): Observable<ApiResponse<number>> {
    this.actionLoading.set(true);
    const request: CrearDepartamentoRequest = {
      codigoDane: departamento.codigoDane!,
      nombre: departamento.nombre!
    };
    return this.apiService.crear(request).pipe(
      tap(() => this.actionLoading.set(false)),
      catchError(err => {
        this.actionLoading.set(false);
        throw err;
      })
    );
  }

  /**
   * Actualiza un departamento existente mapeándolo estrictamente al Request.
   */
  actualizarDepartamento(id: number, departamento: Partial<Departamento>): Observable<void> {
    this.actionLoading.set(true);
    const request: ActualizarDepartamentoRequest = {
      codigoDane: departamento.codigoDane!,
      nombre: departamento.nombre!,
      activo: departamento.activo ?? true
    };
    return this.apiService.actualizar(id, request).pipe(
      tap(() => this.actionLoading.set(false)),
      catchError(err => {
        this.actionLoading.set(false);
        throw err;
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
