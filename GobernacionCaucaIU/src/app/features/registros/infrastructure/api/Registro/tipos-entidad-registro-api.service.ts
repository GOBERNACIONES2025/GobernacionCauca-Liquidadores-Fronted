import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../../core/services/base-api.service';
import { ApiResponse, PagedResult } from '../../../../../core/shared/models/shared.model';
import { 
  TipoEntidadRegistro, 
  CrearTipoEntidadRegistroDto, 
  ActualizarTipoEntidadRegistroDto 
} from '../../../domain/models/Registro/tipo-entidad-registro.model';

/**
 * @description
 * Servicio de infraestructura para la gestión de Tipos de Entidad de Registro.
 * Realiza peticiones HTTP al backend en el módulo de REGISTROS mediante BaseApiService.
 * 
 * @see {@link BaseApiService}
 * @see {@link TipoEntidadRegistro}
 */
@Injectable({
  providedIn: 'root',
})
export class TiposEntidadRegistroApiService {
  private api = inject(BaseApiService);
  private readonly baseUrl = '/TiposEntidadRegistro';

  /**
   * @description
   * Recupera una lista paginada de tipos de entidad de registro.
   * 
   * @param {number} [pageNumber=1] - Índice de la página solicitada.
   * @param {number} [pageSize=10] - Cantidad de registros por página.
   * @returns {Observable<ApiResponse<PagedResult<TipoEntidadRegistro>>>} Respuesta paginada.
   */
  obtenerTodos(pageNumber: number = 1, pageSize: number = 10): Observable<ApiResponse<PagedResult<TipoEntidadRegistro>>> {
    return this.api.get<ApiResponse<PagedResult<TipoEntidadRegistro>>>(
      this.baseUrl,
      { params: { pageNumber, pageSize } },
      'REGISTROS'
    );
  }

  /**
   * @description
   * Obtiene los detalles de un tipo de entidad de registro por su identificador.
   * 
   * @param {number} id - Identificador primario del tipo.
   * @returns {Observable<ApiResponse<TipoEntidadRegistro>>} Entidad encontrada.
   */
  obtenerPorId(id: number): Observable<ApiResponse<TipoEntidadRegistro>> {
    return this.api.get<ApiResponse<TipoEntidadRegistro>>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }

  /**
   * @description
   * Registra un nuevo tipo de entidad de registro.
   * 
   * @param {CrearTipoEntidadRegistroDto} command - Datos del nuevo tipo.
   * @returns {Observable<ApiResponse<number>>} ID del registro creado.
   */
  crear(command: CrearTipoEntidadRegistroDto): Observable<ApiResponse<number>> {
    return this.api.post<ApiResponse<number>>(this.baseUrl, command, {}, 'REGISTROS');
  }

  /**
   * @description
   * Actualiza un tipo de entidad de registro existente.
   * 
   * @param {number} id - Identificador a actualizar.
   * @param {ActualizarTipoEntidadRegistroDto} command - Datos actualizados.
   * @returns {Observable<void>}
   */
  actualizar(id: number, command: ActualizarTipoEntidadRegistroDto): Observable<void> {
    return this.api.put<void>(`${this.baseUrl}/${id}`, { ...command, id }, {}, 'REGISTROS');
  }

  /**
   * @description
   * Elimina un tipo de entidad de registro.
   * 
   * @param {number} id - Identificador a eliminar.
   * @returns {Observable<void>}
   */
  eliminar(id: number): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }
}
