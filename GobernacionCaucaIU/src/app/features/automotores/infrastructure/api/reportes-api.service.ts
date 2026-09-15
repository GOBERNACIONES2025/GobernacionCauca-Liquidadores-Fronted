import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../core/services/base-api.service';
import { ApiResponse, PagedResult } from '../../domain/interfaces/api-response.interface';
import { VehiculoItemDto } from '../../domain/interfaces/vehiculo.interface';
import { PropietarioDto } from '../../domain/interfaces/propietario.interface';
import { ReporteVehiculoFiltros, ReporteContribuyenteFiltros } from '../../domain/models/reporte.model';

@Injectable({
  providedIn: 'root'
})
export class ReportesApiService {
  private http = inject(HttpClient);
  private baseApi = inject(BaseApiService);

  /**
   * Descarga el archivo binario Excel generado por el backend para Parque Automotor.
   */
  descargarVehiculosExcel(filtros: ReporteVehiculoFiltros): Observable<Blob> {
    const url = this.baseApi.buildUrl('/reportes/vehiculos/excel', 'AUTOMOTORES');
    let params = new HttpParams();

    if (filtros.buscar) params = params.set('buscar', filtros.buscar.trim());
    if (filtros.estado && filtros.estado !== 'Todos') params = params.set('estado', filtros.estado);
    if (filtros.tipoVehiculo && filtros.tipoVehiculo !== 'Todos') params = params.set('tipoVehiculo', filtros.tipoVehiculo);

    return this.http.get(url, {
      params,
      responseType: 'blob'
    });
  }

  /**
   * Descarga el archivo binario Excel generado por el backend para Directorio de Contribuyentes.
   */
  descargarContribuyentesExcel(filtros: ReporteContribuyenteFiltros): Observable<Blob> {
    const url = this.baseApi.buildUrl('/reportes/contribuyentes/excel', 'AUTOMOTORES');
    let params = new HttpParams();

    if (filtros.buscar) params = params.set('buscar', filtros.buscar.trim());
    if (filtros.estado && filtros.estado !== 'Todos') {
      params = params.set('soloActivos', filtros.estado === 'Activos');
    }
    if (filtros.naturalezaJuridicaId && filtros.naturalezaJuridicaId > 0) {
      params = params.set('naturalezaJuridicaId', filtros.naturalezaJuridicaId);
    }
    if (filtros.situacion && filtros.situacion !== 'Todos') {
      params = params.set('situacion', filtros.situacion);
    }

    return this.http.get(url, {
      params,
      responseType: 'blob'
    });
  }

  /**
   * Obtiene la previsualización paginada del Parque Automotor (10 registros por defecto).
   */
  getVehiculosPreview(filtros: ReporteVehiculoFiltros): Observable<ApiResponse<PagedResult<VehiculoItemDto>>> {
    const params: Record<string, string | number | boolean> = {
      page: filtros.page || 1,
      pageSize: filtros.pageSize || 10
    };

    if (filtros.buscar) params['buscar'] = filtros.buscar.trim();
    if (filtros.estado && filtros.estado !== 'Todos') params['estado'] = filtros.estado;
    if (filtros.tipoVehiculo && filtros.tipoVehiculo !== 'Todos') params['tipoVehiculo'] = filtros.tipoVehiculo;

    return this.baseApi.get<ApiResponse<PagedResult<VehiculoItemDto>>>('/vehiculos', { params }, 'AUTOMOTORES');
  }

  /**
   * Obtiene todos los vehículos para exportación fallback en caso de contingencia.
   */
  getTodosVehiculosParaExportar(filtros: ReporteVehiculoFiltros): Observable<ApiResponse<PagedResult<VehiculoItemDto>>> {
    const params: Record<string, string | number | boolean> = {
      page: 1,
      pageSize: 10000
    };

    if (filtros.buscar) params['buscar'] = filtros.buscar.trim();
    if (filtros.estado && filtros.estado !== 'Todos') params['estado'] = filtros.estado;
    if (filtros.tipoVehiculo && filtros.tipoVehiculo !== 'Todos') params['tipoVehiculo'] = filtros.tipoVehiculo;

    return this.baseApi.get<ApiResponse<PagedResult<VehiculoItemDto>>>('/vehiculos', { params }, 'AUTOMOTORES');
  }

  /**
   * Obtiene la previsualización paginada de Contribuyentes (10 registros por defecto).
   */
  getContribuyentesPreview(filtros: ReporteContribuyenteFiltros): Observable<ApiResponse<PagedResult<PropietarioDto>>> {
    const params: Record<string, string | number | boolean> = {
      page: filtros.page || 1,
      pageSize: filtros.pageSize || 10
    };

    if (filtros.buscar) params['buscar'] = filtros.buscar.trim();
    if (filtros.estado && filtros.estado !== 'Todos') {
      params['soloActivos'] = filtros.estado === 'Activos';
    }

    return this.baseApi.get<ApiResponse<PagedResult<PropietarioDto>>>('/propietarios', { params }, 'AUTOMOTORES');
  }

  /**
   * Obtiene todos los contribuyentes para exportación fallback en caso de contingencia.
   */
  getTodosContribuyentesParaExportar(filtros: ReporteContribuyenteFiltros): Observable<ApiResponse<PagedResult<PropietarioDto>>> {
    const params: Record<string, string | number | boolean> = {
      page: 1,
      pageSize: 10000
    };

    if (filtros.buscar) params['buscar'] = filtros.buscar.trim();
    if (filtros.estado && filtros.estado !== 'Todos') {
      params['soloActivos'] = filtros.estado === 'Activos';
    }

    return this.baseApi.get<ApiResponse<PagedResult<PropietarioDto>>>('/propietarios', { params }, 'AUTOMOTORES');
  }
}
