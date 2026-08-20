import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../../core/services/base-api.service';
import { ApiResponse, PagedResult } from '../../../../../core/shared/models/shared.model';
import { 
  TipoPersona, 
  CrearTipoPersonaDto, 
  ActualizarTipoPersonaDto 
} from '../../../domain/models/Contribuyentes/tipo-persona.model';

/**
 * @description
 * Servicio de infraestructura para la gestión de Tipos de Persona.
 * Realiza peticiones HTTP al backend en el módulo de REGISTROS mediante BaseApiService.
 * 
 * @see {@link BaseApiService}
 * @see {@link TipoPersona}
 */
@Injectable({
  providedIn: 'root',
})
export class TiposPersonaApiService {
  private api = inject(BaseApiService);
  private readonly baseUrl = '/TiposPersona';

  /**
   * @description
   * Recupera una lista paginada de tipos de persona.
   * 
   * @param {number} [pageNumber=1] - Índice de la página solicitada.
   * @param {number} [pageSize=10] - Cantidad de registros por página.
   * @returns {Observable<ApiResponse<PagedResult<TipoPersona>>>} Respuesta paginada.
   */
  obtenerTodos(pageNumber: number = 1, pageSize: number = 10): Observable<ApiResponse<PagedResult<TipoPersona>>> {
    return this.api.get<ApiResponse<PagedResult<TipoPersona>>>(
      this.baseUrl,
      { params: { pageNumber, pageSize } },
      'REGISTROS'
    );
  }

  /**
   * @description
   * Obtiene los detalles de un tipo de persona por su identificador.
   * 
   * @param {number} id - Identificador primario del tipo.
   * @returns {Observable<ApiResponse<TipoPersona>>} Entidad encontrada.
   */
  obtenerPorId(id: number): Observable<ApiResponse<TipoPersona>> {
    return this.api.get<ApiResponse<TipoPersona>>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }

  /**
   * @description
   * Registra un nuevo tipo de persona.
   * 
   * @param {CrearTipoPersonaDto} command - Datos del nuevo tipo.
   * @returns {Observable<ApiResponse<number>>} ID del registro creado.
   */
  crear(command: CrearTipoPersonaDto): Observable<ApiResponse<number>> {
    return this.api.post<ApiResponse<number>>(this.baseUrl, command, {}, 'REGISTROS');
  }

  /**
   * @description
   * Actualiza un tipo de persona existente.
   * 
   * @param {number} id - Identificador a actualizar.
   * @param {ActualizarTipoPersonaDto} command - Datos actualizados.
   * @returns {Observable<void>}
   */
  actualizar(id: number, command: ActualizarTipoPersonaDto): Observable<void> {
    return this.api.put<void>(`${this.baseUrl}/${id}`, { ...command, id }, {}, 'REGISTROS');
  }

  /**
   * @description
   * Elimina un tipo de persona.
   * 
   * @param {number} id - Identificador a eliminar.
   * @returns {Observable<void>}
   */
  eliminar(id: number): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }
}
