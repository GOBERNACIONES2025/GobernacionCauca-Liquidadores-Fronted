import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../../core/services/base-api.service';
import { ApiResponse, PagedResult } from '../../../../../core/shared/models/shared.model';
import { 
  NormaListado, 
  NormaDetalle, 
  CrearNormaRequest, 
  ActualizarNormaRequest 
} from '../../../domain/models/Normatividad/norma.model';

/**
 * @description
 * Servicio de infraestructura para la gestión de Normas jurídicas y sus documentos.
 * Realiza peticiones HTTP al backend en el módulo de REGISTROS mediante BaseApiService.
 * 
 * @see {@link BaseApiService}
 * @see {@link NormaListado}
 * @see {@link NormaDetalle}
 */
@Injectable({
  providedIn: 'root',
})
export class NormasApiService {
  private api = inject(BaseApiService);
  private readonly baseUrl = '/Normas';

  /**
   * @description
   * Recupera una lista paginada de normas con filtro opcional por departamento.
   * 
   * @param {number} [departamentoId] - Filtro opcional por departamento.
   * @param {number} [pageNumber=1] - Índice de la página solicitada.
   * @param {number} [pageSize=10] - Cantidad de registros por página.
   * @returns {Observable<ApiResponse<PagedResult<NormaListado>>>} Lista de normas.
   */
  obtenerTodos(
    departamentoId?: number, 
    pageNumber: number = 1, 
    pageSize: number = 10
  ): Observable<ApiResponse<PagedResult<NormaListado>>> {
    const params: any = { pageNumber, pageSize };
    if (departamentoId) params.departamentoId = departamentoId;

    return this.api.get<ApiResponse<PagedResult<NormaListado>>>(
      this.baseUrl,
      { params },
      'REGISTROS'
    );
  }

  /**
   * @description
   * Obtiene el detalle completo de una norma por su ID.
   * 
   * @param {number} id - Identificador primario de la norma.
   * @returns {Observable<ApiResponse<NormaDetalle>>} Detalle completo con documentos.
   */
  obtenerPorId(id: number): Observable<ApiResponse<NormaDetalle>> {
    return this.api.get<ApiResponse<NormaDetalle>>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }

  /**
   * @description
   * Registra una nueva norma en el sistema con su documento normativo asociado.
   * 
   * @param {File} file - El documento normativo adjunto.
   * @param {CrearNormaRequest} command - Datos de la nueva norma.
   * @returns {Observable<ApiResponse<number>>} ID de la norma creada.
   */
  crear(file: File, command: CrearNormaRequest): Observable<ApiResponse<number>> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    formData.append('requestJson', JSON.stringify(command));
    
    return this.api.post<ApiResponse<number>>(this.baseUrl, formData, {}, 'REGISTROS');
  }

  /**
   * @description
   * Actualiza una norma existente y sincroniza sus documentos normativos.
   * 
   * @param {number} id - Identificador de la norma a actualizar.
   * @param {ActualizarNormaRequest} command - Datos actualizados.
   * @returns {Observable<void>}
   */
  actualizar(id: number, command: ActualizarNormaRequest): Observable<void> {
    return this.api.put<void>(`${this.baseUrl}/${id}`, command, {}, 'REGISTROS');
  }

  /**
   * @description
   * Actualiza el estado de una norma a un nuevo estado (ej. Derogada, Inactiva).
   * 
   * @param {number} id - Identificador de la norma.
   * @param {number} nuevoEstadoNormaId - ID del nuevo estado norma a asignar.
   * @returns {Observable<void>}
   */
  eliminar(id: number, nuevoEstadoNormaId: number): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/${id}/estado/${nuevoEstadoNormaId}`, {}, 'REGISTROS');
  }
}
