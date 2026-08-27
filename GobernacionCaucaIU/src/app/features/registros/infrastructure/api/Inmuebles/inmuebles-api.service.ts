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
  obtenerTodos(
    paramsOrPage: number | InmuebleQueryParams = 1,
    pageSize: number = 10,
    searchTerm?: string,
    activo?: boolean,
    filtrosEspecificos?: any
  ): Observable<ApiResponse<PagedResult<Inmueble>>> {
    const queryParams: any = {};
    if (typeof paramsOrPage === 'object') {
      queryParams.PageNumber = paramsOrPage.pageNumber ?? 1;
      queryParams.PageSize = paramsOrPage.pageSize ?? 10;
      const term = paramsOrPage.searchTerm ?? paramsOrPage.search ?? paramsOrPage.busqueda ?? paramsOrPage.matriculaInmobiliaria;
      if (term && term.trim() !== '') {
        queryParams.SearchTerm = term.trim();
      }
      if (paramsOrPage.municipioId) {
        queryParams.MunicipioId = paramsOrPage.municipioId;
      }
    } else {
      queryParams.PageNumber = paramsOrPage ?? 1;
      queryParams.PageSize = pageSize ?? 10;
      if (searchTerm && searchTerm.trim() !== '') {
        queryParams.SearchTerm = searchTerm.trim();
      }
      if (activo !== undefined && activo !== null) {
        queryParams.Activo = activo;
      }
      if (filtrosEspecificos) {
        Object.assign(queryParams, filtrosEspecificos);
      }
    }

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
