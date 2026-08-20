import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../../core/services/base-api.service';
import { ApiResponse, PagedResult } from '../../../../../core/shared/models/shared.model';
import { 
  RolInterviniente, 
  CrearRolIntervinienteDto, 
  ActualizarRolIntervinienteDto 
} from '../../../domain/models/Intervinientes/rol-interviniente.model';

/**
 * @description
 * Servicio de infraestructura para la gestión de Roles de Intervinientes.
 * Realiza peticiones HTTP al backend en el módulo de REGISTROS mediante BaseApiService.
 * 
 * @see {@link BaseApiService}
 * @see {@link RolInterviniente}
 */
@Injectable({
  providedIn: 'root',
})
export class RolesIntervinienteApiService {
  private api = inject(BaseApiService);
  private readonly baseUrl = '/RolesInterviniente';

  /**
   * @description
   * Recupera una lista paginada de roles de intervinientes.
   * 
   * @param {number} [pageNumber=1] - Índice de la página solicitada.
   * @param {number} [pageSize=10] - Cantidad de registros por página.
   * @returns {Observable<ApiResponse<PagedResult<RolInterviniente>>>} Respuesta paginada.
   */
  obtenerTodos(pageNumber: number = 1, pageSize: number = 10): Observable<ApiResponse<PagedResult<RolInterviniente>>> {
    return this.api.get<ApiResponse<PagedResult<RolInterviniente>>>(
      this.baseUrl,
      { params: { pageNumber, pageSize } },
      'REGISTROS'
    );
  }

  /**
   * @description
   * Obtiene los detalles de un rol de interviniente por su identificador.
   * 
   * @param {number} id - Identificador primario del rol.
   * @returns {Observable<ApiResponse<RolInterviniente>>} Entidad encontrada.
   */
  obtenerPorId(id: number): Observable<ApiResponse<RolInterviniente>> {
    return this.api.get<ApiResponse<RolInterviniente>>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }

  /**
   * @description
   * Registra un nuevo rol de interviniente en el sistema.
   * 
   * @param {CrearRolIntervinienteDto} command - Datos del nuevo rol.
   * @returns {Observable<ApiResponse<number>>} ID del rol creado.
   */
  crear(command: CrearRolIntervinienteDto): Observable<ApiResponse<number>> {
    return this.api.post<ApiResponse<number>>(this.baseUrl, command, {}, 'REGISTROS');
  }

  /**
   * @description
   * Actualiza un rol de interviniente existente.
   * 
   * @param {number} id - Identificador del rol a actualizar.
   * @param {ActualizarRolIntervinienteDto} command - Datos actualizados.
   * @returns {Observable<void>}
   */
  actualizar(id: number, command: ActualizarRolIntervinienteDto): Observable<void> {
    return this.api.put<void>(`${this.baseUrl}/${id}`, { ...command, id }, {}, 'REGISTROS');
  }

  /**
   * @description
   * Inactiva (borrado lógico) un rol de interviniente.
   * 
   * @param {number} id - Identificador del rol a inactivar.
   * @returns {Observable<void>}
   */
  eliminar(id: number): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }
}
