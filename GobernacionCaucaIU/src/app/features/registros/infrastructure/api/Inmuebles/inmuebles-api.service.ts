import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../../core/services/base-api.service';
import { ApiResponse, PagedResult } from '../../../../../core/shared/models/shared.model';
import { 
  Inmueble, 
  CrearInmuebleRequest, 
  ActualizarInmuebleRequest, 
  InmuebleQueryParams 
} from '../../../domain/models/Inmuebles/inmueble.model';

/**
 * @description
 * Servicio de infraestructura para la gestión de Inmuebles y sus avalúos catastrales.
 * Realiza peticiones HTTP al backend en el módulo de REGISTROS mediante BaseApiService.
 * 
 * @see {@link BaseApiService}
 * @see {@link Inmueble}
 */
@Injectable({
  providedIn: 'root',
})
export class InmueblesApiService {
  private api = inject(BaseApiService);
  private readonly baseUrl = '/Inmuebles';

  /**
   * @description
   * Recupera una lista paginada de inmuebles según los filtros especificados.
   * 
   * @param {InmuebleQueryParams} [params] - Filtros de paginación, municipio, matrícula o texto libre.
   * @returns {Observable<ApiResponse<PagedResult<Inmueble>>>} Respuesta estructurada con los inmuebles paginados.
   */
  obtenerTodos(params?: InmuebleQueryParams): Observable<ApiResponse<PagedResult<Inmueble>>> {
    const queryParams: any = {
      pageNumber: params?.pageNumber ?? 1,
      pageSize: params?.pageSize ?? 10,
    };

    if (params?.municipioId) queryParams.municipioId = params.municipioId;
    if (params?.search) queryParams.search = params.search;
    if (params?.busqueda) queryParams.search = params.busqueda;
    if (params?.matriculaInmobiliaria) queryParams.search = params.matriculaInmobiliaria;

    return this.api.get<ApiResponse<PagedResult<Inmueble>>>(
      this.baseUrl,
      { params: queryParams },
      'REGISTROS'
    );
  }

  /**
   * @description
   * Obtiene la información detallada de un inmueble por su identificador único.
   * 
   * @param {number} id - Identificador primario del inmueble.
   * @returns {Observable<ApiResponse<Inmueble>>} Entidad de inmueble con su histórico de avalúos.
   */
  obtenerPorId(id: number): Observable<ApiResponse<Inmueble>> {
    return this.api.get<ApiResponse<Inmueble>>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }

  /**
   * @description
   * Registra un nuevo inmueble en el sistema junto con sus avalúos asociados opcionales.
   * 
   * @param {CrearInmuebleRequest} command - Datos del nuevo inmueble a registrar.
   * @returns {Observable<ApiResponse<number>>} ID del nuevo inmueble creado.
   */
  crear(command: CrearInmuebleRequest): Observable<ApiResponse<number>> {
    return this.api.post<ApiResponse<number>>(this.baseUrl, command, {}, 'REGISTROS');
  }

  /**
   * @description
   * Actualiza los datos de un inmueble existente y su lista de avalúos catastrales.
   * 
   * @param {number} id - Identificador primario del inmueble.
   * @param {ActualizarInmuebleRequest} command - Payload con los datos modificados.
   * @returns {Observable<void>} Observable que completa al finalizar la actualización.
   */
  actualizar(id: number, command: ActualizarInmuebleRequest): Observable<void> {
    return this.api.put<void>(`${this.baseUrl}/${id}`, command, {}, 'REGISTROS');
  }
}
