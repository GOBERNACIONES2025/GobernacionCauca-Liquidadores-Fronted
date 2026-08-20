import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../../core/services/base-api.service';
import { ApiResponse, PagedResult } from '../../../../../core/shared/models/shared.model';
import { 
  Rol, 
  CrearRolDto, 
  ActualizarRolDto 
} from '../../../domain/models/Seguridad/rol.model';

/**
 * @description
 * Servicio de infraestructura para la gestión de Roles de Seguridad.
 * Realiza peticiones HTTP al backend en el módulo de REGISTROS mediante BaseApiService.
 * 
 * @see {@link BaseApiService}
 * @see {@link Rol}
 */
@Injectable({
  providedIn: 'root',
})
export class RolesApiService {
  private api = inject(BaseApiService);
  private readonly baseUrl = '/Roles';

  /**
   * @description
   * Recupera una lista paginada de roles de seguridad.
   * 
   * @param {number} [pageNumber=1] - Índice de la página solicitada.
   * @param {number} [pageSize=10] - Cantidad de registros por página.
   * @returns {Observable<ApiResponse<PagedResult<Rol>>>} Respuesta paginada.
   */
  obtenerTodos(pageNumber: number = 1, pageSize: number = 10): Observable<ApiResponse<PagedResult<Rol>>> {
    return this.api.get<ApiResponse<PagedResult<Rol>>>(
      this.baseUrl,
      { params: { pageNumber, pageSize } },
      'REGISTROS'
    );
  }

  /**
   * @description
   * Obtiene los detalles de un rol por su identificador.
   * 
   * @param {number} id - Identificador primario del rol.
   * @returns {Observable<ApiResponse<Rol>>} Entidad encontrada.
   */
  obtenerPorId(id: number): Observable<ApiResponse<Rol>> {
    return this.api.get<ApiResponse<Rol>>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }

  /**
   * @description
   * Registra un nuevo rol de seguridad.
   * 
   * @param {CrearRolDto} command - Datos del nuevo rol.
   * @returns {Observable<ApiResponse<number>>} ID del registro creado.
   */
  crear(command: CrearRolDto): Observable<ApiResponse<number>> {
    return this.api.post<ApiResponse<number>>(this.baseUrl, command, {}, 'REGISTROS');
  }

  /**
   * @description
   * Actualiza un rol de seguridad existente.
   * 
   * @param {number} id - Identificador a actualizar.
   * @param {ActualizarRolDto} command - Datos actualizados.
   * @returns {Observable<void>}
   */
  actualizar(id: number, command: ActualizarRolDto): Observable<void> {
    return this.api.put<void>(`${this.baseUrl}/${id}`, { ...command, id }, {}, 'REGISTROS');
  }

  /**
   * @description
   * Elimina un rol de seguridad.
   * 
   * @param {number} id - Identificador a eliminar.
   * @returns {Observable<void>}
   */
  eliminar(id: number): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }
}
