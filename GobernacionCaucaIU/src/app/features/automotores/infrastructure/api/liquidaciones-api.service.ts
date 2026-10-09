import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../core/services/base-api.service';
import { ApiResponse, PagedResult } from '../../domain/interfaces/api-response.interface';
import {
  SimulacionLiquidacion,
  SimularLiquidacionRequest,
  LiquidacionMasivaRequest,
  LiquidacionMasivaResultado,
  FacturaPreview,
  LiquidacionItem,
  LiquidacionKpis
} from '../../domain/models/liquidacion.model';


export interface LiquidacionFiltros {
  page?: number;
  pageSize?: number;
  buscar?: string;
  vigencia?: number;
  estado?: string;
  tab?: string;
  tipo?: string;
}


@Injectable({
  providedIn: 'root'
})
export class LiquidacionesApiService {
  private api = inject(BaseApiService);


  getLiquidaciones(filtros: LiquidacionFiltros = {}): Observable<ApiResponse<PagedResult<LiquidacionItem>>> {
    const params: Record<string, string | number> = {};
    if (filtros.page) params['page'] = filtros.page;
    if (filtros.pageSize) params['pageSize'] = filtros.pageSize;
    if (filtros.buscar) params['buscar'] = filtros.buscar;
    if (filtros.vigencia) params['vigencia'] = filtros.vigencia;
    if (filtros.estado) params['estado'] = filtros.estado;
    if (filtros.tab) params['tab'] = filtros.tab;
    if (filtros.tipo) params['tipo'] = filtros.tipo;

    return this.api.get<ApiResponse<PagedResult<LiquidacionItem>>>('/liquidaciones', { params }, 'AUTOMOTORES');
  }


  getKpis(): Observable<ApiResponse<LiquidacionKpis>> {
    return this.api.get<ApiResponse<LiquidacionKpis>>('/liquidaciones/kpis', {}, 'AUTOMOTORES');
  }

  // Autor: Juan Sebastián Montaño Pérez
  // Fecha: 28/09/2026
  // Módulo: Repositorio - Simulación; devolvera la simulación de la vigencias de x vehiculo
  // Descripción: SimularLiquidacionRequest; Será el objeto que devolvera despues de hacer la simulación de la deuda.
  simularLiquidacion(request: SimularLiquidacionRequest): Observable<ApiResponse<SimulacionLiquidacion>> {
    return this.api.post<ApiResponse<SimulacionLiquidacion>>('/liquidaciones/simular', request, {}, 'AUTOMOTORES');
  }


  oficializar(request: SimularLiquidacionRequest): Observable<ApiResponse<LiquidacionItem[]>> {
    return this.api.post<ApiResponse<LiquidacionItem[]>>('/liquidaciones/oficializar', request, {}, 'AUTOMOTORES');
  }


  ejecutarMasiva(request: LiquidacionMasivaRequest): Observable<ApiResponse<LiquidacionMasivaResultado>> {
    return this.api.post<ApiResponse<LiquidacionMasivaResultado>>('/liquidaciones/masiva', request, {}, 'AUTOMOTORES');
  }


  previsualizarFactura(placa: string, vigencia?: number, esUnificado: boolean = false): Observable<ApiResponse<FacturaPreview>> {
    const params: Record<string, string | number | boolean> = { placa };
    if (vigencia) params['vigencia'] = vigencia;
    if (esUnificado) params['esUnificado'] = esUnificado;

    return this.api.get<ApiResponse<FacturaPreview>>('/liquidaciones/factura/preview', { params }, 'AUTOMOTORES');
  }


  descargarPdfBlob(placa: string, vigencia?: number, esUnificado: boolean = false): Observable<Blob> {
    const params: Record<string, string | number | boolean> = { placa, descargar: true };
    if (vigencia) params['vigencia'] = vigencia;
    if (esUnificado) params['esUnificado'] = esUnificado;

    return this.api.get<Blob>('/liquidaciones/pdf', { params, responseType: 'blob' as any }, 'AUTOMOTORES');
  }


  construirPdfUrl(placa: string, vigencia?: number, esUnificado: boolean = false, descargar: boolean = true): string {
    let endpoint = `/liquidaciones/pdf?placa=${encodeURIComponent(placa)}`;
    if (vigencia) endpoint += `&vigencia=${vigencia}`;
    if (esUnificado) endpoint += `&esUnificado=true`;
    if (descargar) endpoint += `&descargar=true`;

    return this.api.buildUrl(endpoint, 'AUTOMOTORES');
  }
}
