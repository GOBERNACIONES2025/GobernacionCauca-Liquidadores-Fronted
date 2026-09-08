import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../../core/services/base-api.service';
import { ApiResponse, PagedResult } from '../../../../../core/shared/models/shared.model';
import {
  ConfiguracionExtemporaneidad,
  CrearConfiguracionExtemporaneidadRequest,
  ActualizarConfiguracionExtemporaneidadRequest,
  ConfiguracionExtemporaneidadQueryParams
} from '../../../domain/models/Tarifas/configuracion-extemporaneidad.model';

/**
 * @description
 * Servicio de infraestructura para la gestión de Configuraciones de Extemporaneidad en Registros.
 * Consume los endpoints REST de ConfiguracionExtemporaneidadController mediante BaseApiService.
 */
@Injectable({
  providedIn: 'root'
})
export class ConfiguracionExtemporaneidadApiService {
  private api = inject(BaseApiService);
  private readonly baseUrl = '/ConfiguracionExtemporaneidad';

  /**
   * Obtiene la lista paginada de configuraciones de extemporaneidad con filtros opcionales.
   */
  obtenerTodos(
    paramsOrPage: number | ConfiguracionExtemporaneidadQueryParams = 1,
    pageSize: number = 10,
    searchTerm?: string,
    activo?: boolean,
    departamentoId?: number
  ): Observable<ApiResponse<PagedResult<ConfiguracionExtemporaneidad>>> {
    const queryParams: any = {};

    if (typeof paramsOrPage === 'object') {
      queryParams.PageNumber = paramsOrPage.pageNumber ?? 1;
      queryParams.PageSize = paramsOrPage.pageSize ?? 10;
      const term = paramsOrPage.searchTerm ?? paramsOrPage.search;
      if (term && term.trim() !== '') {
        queryParams.SearchTerm = term.trim();
      }
      if (paramsOrPage.activo !== undefined && paramsOrPage.activo !== null) {
        queryParams.Activo = paramsOrPage.activo;
      }
      if (paramsOrPage.departamentoId) {
        queryParams.DepartamentoId = paramsOrPage.departamentoId;
      }
      if (paramsOrPage.tipoCalculoTarifaId) {
        queryParams.TipoCalculoTarifaId = paramsOrPage.tipoCalculoTarifaId;
      }
      if (paramsOrPage.vigenciaId) {
        queryParams.VigenciaId = paramsOrPage.vigenciaId;
      }
      if (paramsOrPage.normaId) {
        queryParams.NormaId = paramsOrPage.normaId;
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
      if (departamentoId) {
        queryParams.DepartamentoId = departamentoId;
      }
    }

    return this.api.get<ApiResponse<PagedResult<ConfiguracionExtemporaneidad>>>(
      this.baseUrl,
      { params: queryParams },
      'REGISTROS'
    );
  }

  /**
   * Obtiene una configuración de extemporaneidad específica por su ID.
   */
  obtenerPorId(id: number): Observable<ApiResponse<ConfiguracionExtemporaneidad>> {
    return this.api.get<ApiResponse<ConfiguracionExtemporaneidad>>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }

  /**
   * Crea una nueva configuración de extemporaneidad.
   */
  crear(command: CrearConfiguracionExtemporaneidadRequest): Observable<ApiResponse<number>> {
    return this.api.post<ApiResponse<number>>(this.baseUrl, command, {}, 'REGISTROS');
  }

  /**
   * Actualiza una configuración de extemporaneidad existente.
   */
  actualizar(id: number, command: ActualizarConfiguracionExtemporaneidadRequest): Observable<void> {
    return this.api.put<void>(`${this.baseUrl}/${id}`, command, {}, 'REGISTROS');
  }

  /**
   * Elimina lógicamente una configuración de extemporaneidad.
   */
  eliminar(id: number): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/${id}`, {}, 'REGISTROS');
  }
}
