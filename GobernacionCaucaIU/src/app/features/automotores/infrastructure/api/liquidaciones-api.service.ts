import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../core/services/base-api.service';
import { ApiResponse, PagedResult } from '../../domain/interfaces/api-response.interface';
import { 
  SimulacionLiquidacion, 
  SimularLiquidacionRequest, 
  LiquidacionMasivaRequest, 
  LiquidacionMasivaResultado,
  FacturaPreview 
} from '../../domain/models/liquidacion.model';
import { LiquidacionItem, LiquidacionKpis } from '../../application/facades/liquidaciones.facade';

export interface LiquidacionFiltros {
  page?: number;
  pageSize?: number;
  buscar?: string;
  vigencia?: number;
  estado?: string;
}

/**
 * Servicio de infraestructura API para el módulo de Liquidaciones y Facturación Oficial de Automotores.
 */
@Injectable({
  providedIn: 'root'
})
export class LiquidacionesApiService {
  private api = inject(BaseApiService);

  /**
   * Obtiene la lista paginada de vehículos con vigencias pendientes por liquidar.
   */
  getPendientes(filtros: LiquidacionFiltros = {}): Observable<ApiResponse<PagedResult<LiquidacionItem>>> {
    const params: Record<string, string | number> = {};
    if (filtros.page) params['page'] = filtros.page;
    if (filtros.pageSize) params['pageSize'] = filtros.pageSize;
    if (filtros.buscar) params['buscar'] = filtros.buscar;
    if (filtros.vigencia) params['vigencia'] = filtros.vigencia;

    return this.api.get<ApiResponse<PagedResult<LiquidacionItem>>>('/liquidaciones/pendientes', { params }, 'AUTOMOTORES');
  }

  /**
   * Obtiene la lista paginada de liquidaciones oficiales emitidas registradas en BD.
   */
  getEmitidas(filtros: LiquidacionFiltros = {}): Observable<ApiResponse<PagedResult<LiquidacionItem>>> {
    const params: Record<string, string | number> = {};
    if (filtros.page) params['page'] = filtros.page;
    if (filtros.pageSize) params['pageSize'] = filtros.pageSize;
    if (filtros.buscar) params['buscar'] = filtros.buscar;
    if (filtros.vigencia) params['vigencia'] = filtros.vigencia;
    if (filtros.estado) params['estado'] = filtros.estado;

    return this.api.get<ApiResponse<PagedResult<LiquidacionItem>>>('/liquidaciones/emitidas', { params }, 'AUTOMOTORES');
  }

  /**
   * Consulta los indicadores KPI acumulados del módulo de liquidaciones.
   */
  getKpis(): Observable<ApiResponse<LiquidacionKpis>> {
    return this.api.get<ApiResponse<LiquidacionKpis>>('/liquidaciones/kpis', {}, 'AUTOMOTORES');
  }

  /**
   * Simula y proyecta el estado de cuenta y liquidación tributaria de un vehículo.
   */
  simular(request: SimularLiquidacionRequest): Observable<ApiResponse<SimulacionLiquidacion>> {
    return this.api.post<ApiResponse<SimulacionLiquidacion>>('/liquidaciones/simular', request, {}, 'AUTOMOTORES');
  }

  /**
   * Oficializa e inserta en la base de datos las liquidaciones por vigencia seleccionadas.
   */
  oficializar(request: SimularLiquidacionRequest): Observable<ApiResponse<LiquidacionItem[]>> {
    return this.api.post<ApiResponse<LiquidacionItem[]>>('/liquidaciones/oficializar', request, {}, 'AUTOMOTORES');
  }

  /**
   * Ejecuta la liquidación oficial masiva para un conjunto de vehículos o parque automotor.
   */
  ejecutarMasiva(request: LiquidacionMasivaRequest): Observable<ApiResponse<LiquidacionMasivaResultado>> {
    return this.api.post<ApiResponse<LiquidacionMasivaResultado>>('/liquidaciones/masiva', request, {}, 'AUTOMOTORES');
  }

  /**
   * Obtiene la previsualización HTML y metadatos de la factura oficial con código de barras GS1-128.
   */
  previsualizarFactura(placa: string, vigencia?: number, esUnificado: boolean = false): Observable<ApiResponse<FacturaPreview>> {
    const params: Record<string, string | number | boolean> = { placa };
    if (vigencia) params['vigencia'] = vigencia;
    if (esUnificado) params['esUnificado'] = esUnificado;

    return this.api.get<ApiResponse<FacturaPreview>>('/liquidaciones/factura/preview', { params }, 'AUTOMOTORES');
  }

  /**
   * Descarga el documento oficial de liquidación en PDF como Blob binario en memoria.
   * Evita bloqueos de seguridad del navegador por 'Insecure Connection / Mixed Content' en entornos HTTP/Desarrollo.
   */
  descargarPdfBlob(placa: string, vigencia?: number, esUnificado: boolean = false): Observable<Blob> {
    const params: Record<string, string | number | boolean> = { placa, descargar: true };
    if (vigencia) params['vigencia'] = vigencia;
    if (esUnificado) params['esUnificado'] = esUnificado;

    return this.api.get<Blob>('/liquidaciones/pdf', { params, responseType: 'blob' as any }, 'AUTOMOTORES');
  }

  /**
   * Construye la URL completa para descargar o visualizar el archivo binario PDF oficial.
   */
  construirPdfUrl(placa: string, vigencia?: number, esUnificado: boolean = false, descargar: boolean = true): string {
    let endpoint = `/liquidaciones/pdf?placa=${encodeURIComponent(placa)}`;
    if (vigencia) endpoint += `&vigencia=${vigencia}`;
    if (esUnificado) endpoint += `&esUnificado=true`;
    if (descargar) endpoint += `&descargar=true`;

    return this.api.buildUrl(endpoint, 'AUTOMOTORES');
  }
}
