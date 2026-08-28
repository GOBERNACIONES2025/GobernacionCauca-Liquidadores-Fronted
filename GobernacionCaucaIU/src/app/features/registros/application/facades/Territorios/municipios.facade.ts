import { Injectable, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Municipio, CrearMunicipioRequest, ActualizarMunicipioRequest } from '../../../domain/models/Territorios/municipio.model';
import { MunicipiosApiService } from '../../../infrastructure/api/Territorios/municipios-api.service';
import { ApiResponse } from '../../../../../core/shared/models/shared.model';

/**
 * @description
 * Facade (Capa de Aplicación) para la gestión del estado de Municipios.
 * Utiliza Signals de Angular para exponer un estado reactivo a la UI (Presentación),
 * orquestando las llamadas al MunicipiosApiService subyacente.
 */
@Injectable({
  providedIn: 'root'
})
export class MunicipiosFacade {
  private apiService = inject(MunicipiosApiService);

  // Estado centralizado expuesto como Signals
  readonly municipios = signal<Municipio[]>([]);
  readonly totalMunicipios = signal<number>(0);
  
  // Estado de UI
  readonly loading = signal<boolean>(false);
  readonly actionLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly selectedMunicipio = signal<Municipio | null>(null);

  /**
   * Carga la lista de municipios de forma paginada y actualiza el estado (Signals).
   */
  cargarMunicipios(pageNumber: number = 1, pageSize: number = 10, search?: string, activo?: boolean): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService.obtenerTodos(pageNumber, pageSize, search, undefined, activo).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.municipios.set(response.data.items || []);
          this.totalMunicipios.set(response.data.totalCount);
        } else {
          this.error.set(response.message || 'Error al cargar los municipios');
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
   * Carga un municipio específico y lo almacena en el estado selectedMunicipio.
   */
  seleccionarMunicipioPorId(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.selectedMunicipio.set(null);

    this.apiService.obtenerPorId(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.selectedMunicipio.set(response.data);
        } else {
          this.error.set(response.message || 'Error al cargar el municipio');
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
   * Limpia el municipio actualmente seleccionado.
   */
  limpiarSeleccion(): void {
    this.selectedMunicipio.set(null);
  }

  /**
   * Crea un nuevo municipio y retorna el Observable para que el componente maneje la navegación/notificación.
   */
  crearMunicipio(municipio: Partial<Municipio>): Observable<ApiResponse<number>> {
    this.actionLoading.set(true);
    const depId = municipio.departamentoId ?? (typeof (municipio as any).departamento === 'object' ? (municipio as any).departamento?.id : (municipio as any).idDepartamento);
    const request: CrearMunicipioRequest = {
      codigoDane: municipio.codigoDane!,
      nombre: municipio.nombre!,
      departamentoId: Number(depId)
    };
    return this.apiService.crear(request).pipe(
      tap({
        next: () => this.actionLoading.set(false),
        error: () => this.actionLoading.set(false)
      })
    );
  }

  /**
   * Actualiza un municipio existente.
   */
  actualizarMunicipio(id: number, municipio: Partial<Municipio>): Observable<void> {
    this.actionLoading.set(true);
    const depId = municipio.departamentoId ?? (typeof (municipio as any).departamento === 'object' ? (municipio as any).departamento?.id : (municipio as any).idDepartamento);
    const request: ActualizarMunicipioRequest = {
      codigoDane: municipio.codigoDane!,
      nombre: municipio.nombre!,
      activo: municipio.activo ?? true,
      departamentoId: Number(depId)
    };
    return this.apiService.actualizar(id, request).pipe(
      tap({
        next: () => this.actionLoading.set(false),
        error: () => this.actionLoading.set(false)
      })
    );
  }



  /**
   * Elimina un municipio.
   */
  eliminarMunicipio(id: number): Observable<void> {
    this.actionLoading.set(true);
    return this.apiService.eliminar(id).pipe(
      tap({
        next: () => {
          this.actionLoading.set(false);
          // Opcionalmente recargar la lista si la eliminación fue exitosa
          this.cargarMunicipios();
        },
        error: () => this.actionLoading.set(false)
      })
    );
  }
}
