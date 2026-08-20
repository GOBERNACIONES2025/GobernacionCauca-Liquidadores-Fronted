import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../../core/services/base-api.service';
import { ApiResponse, PagedResult } from '../../../../../core/shared/models/shared.model';
import { 
  EntidadRegistro, 
  CrearEntidadRegistroDto, 
  ActualizarEntidadRegistroDto 
} from '../../../domain/models/Registro/entidad-registro.model';

/**
 * @description
 * Servicio de infraestructura para la gestión de Entidades de Registro.
 * Realiza peticiones HTTP al backend en el módulo de REGISTROS mediante BaseApiService.
 * 
 * @see {@link BaseApiService}
 * @see {@link EntidadRegistro}
 */
@Injectable({
  providedIn: 'root',
})
export class EntidadesRegistroApiService {
  private api = inject(BaseApiService);
  private readonly baseUrl = '/EntidadesRegistro';

  /**
   * @description
   * Recupera una lista paginada de entidades de registro.
   * 
   * @param {number} [pageNumber=1] - Índice de la página solicitada.
   * @param {number} [pageSize=10] - Cantidad de registros por página.
   * @param {number} [tipoEntidadRegistroId] - Filtro opcional por tipo de entidad.
   * @param {number} [departamentoId] - Filtro opcional por departamento.
   * @param {number} [municipioId] - Filtro opcional por municipio.
   * @returns {Observable<ApiResponse<PagedResult<EntidadRegistro>>>} Respuesta paginada.
   */
  obtenerTodos(
    pageNumber: number = 1, 
    pageSize: number = 10, 
    tipoEntidadRegistroId?: number, 
    departamentoId?: number, 
    municipioId?: number
  ): Observable<ApiResponse<PagedResult<EntidadRegistro>>> {
    const params: any = { pageNumber, pageSize };
    if (tipoEntidadRegistroId) params.tipoEntidadRegistroId = tipoEntidadRegistroId;
    if (departamentoId) params.departamentoId = departamentoId;
    if (municipioId) params.municipioId = municipioId;

    return this.api.get<ApiResponse<PagedResult<EntidadRegistro>>>(
      this.baseUrl,
      { params },
      'REGISTROS'
    );
  }

  /**
   * @description
   * Obtiene los detalles de una entidad de registro por su identificador.
   * 
   * @param {number} id - Identificador primario de la entidad.
   * @returns {Observable<ApiResponse<EntidadRegistro>>} Entidad encontrada.
   */
  obtenerPorId(id: number): Observable<ApiResponse<EntidadRegistro>> {
    return this.api.get<ApiResponse<EntidadRegistro>>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }

  /**
   * @description
   * Registra una nueva entidad de registro.
   * 
   * @param {CrearEntidadRegistroDto} command - Datos de la nueva entidad.
   * @returns {Observable<ApiResponse<number>>} ID del registro creado.
   */
  crear(command: CrearEntidadRegistroDto): Observable<ApiResponse<number>> {
    return this.api.post<ApiResponse<number>>(this.baseUrl, command, {}, 'REGISTROS');
  }

  /**
   * @description
   * Actualiza una entidad de registro existente.
   * 
   * @param {number} id - Identificador a actualizar.
   * @param {ActualizarEntidadRegistroDto} command - Datos actualizados.
   * @returns {Observable<void>}
   */
  actualizar(id: number, command: ActualizarEntidadRegistroDto): Observable<void> {
    return this.api.put<void>(`${this.baseUrl}/${id}`, { ...command, id }, {}, 'REGISTROS');
  }

  /**
   * @description
   * Elimina una entidad de registro.
   * 
   * @param {number} id - Identificador a eliminar.
   * @returns {Observable<void>}
   */
  eliminar(id: number): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }
}
