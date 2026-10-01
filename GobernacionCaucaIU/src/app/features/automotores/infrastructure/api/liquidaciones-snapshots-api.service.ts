// Autor: Juan Sebastián Montaño Pérez
// Fecha: 30/09/2026
// Módulo: Liquidaciones Vehiculares / Snapshots
// Descripción: Servicio de infraestructura API para consulta, detalle y conciliación de snapshots de liquidación.

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../core/services/base-api.service';
import { ApiResponse, PagedResult } from '../../domain/interfaces/api-response.interface';
import {
  LiquidacionSnapshotItem,
  LiquidacionSnapshotDetalle,
  LiquidacionSnapshotFilterParams
} from '../../domain/models/liquidacion-snapshot.model';

@Injectable({
  providedIn: 'root'
})
export class LiquidacionesSnapshotsApiService {
  private readonly api = inject(BaseApiService);

  getSnapshots(filtros: LiquidacionSnapshotFilterParams = {}): Observable<ApiResponse<PagedResult<LiquidacionSnapshotItem>>> {
    const params: Record<string, string | number> = {};

    if (filtros.page) params['page'] = filtros.page;
    if (filtros.pageSize) params['pageSize'] = filtros.pageSize;
    if (filtros.buscar?.trim()) params['buscar'] = filtros.buscar.trim();
    if (filtros.idLiquidacion) params['idLiquidacion'] = filtros.idLiquidacion;
    if (filtros.placa?.trim()) params['placa'] = filtros.placa.trim().toUpperCase();
    if (filtros.numeroLiquidacion?.trim()) params['numeroLiquidacion'] = filtros.numeroLiquidacion.trim();
    if (filtros.referenciaPago?.trim()) params['referenciaPago'] = filtros.referenciaPago.trim();
    if (filtros.estadoPago?.trim()) params['estadoPago'] = filtros.estadoPago.trim().toUpperCase();
    if (filtros.fechaEmisionDesde?.trim()) params['fechaEmisionDesde'] = filtros.fechaEmisionDesde.trim();
    if (filtros.fechaEmisionHasta?.trim()) params['fechaEmisionHasta'] = filtros.fechaEmisionHasta.trim();
    if (filtros.vigencia) params['vigencia'] = filtros.vigencia;

    return this.api.get<ApiResponse<PagedResult<LiquidacionSnapshotItem>>>(
      '/liquidaciones/snapshots',
      { params },
      'AUTOMOTORES'
    );
  }

  getSnapshotById(id: number): Observable<ApiResponse<LiquidacionSnapshotDetalle>> {
    return this.api.get<ApiResponse<LiquidacionSnapshotDetalle>>(
      `/liquidaciones/snapshots/${id}`,
      {},
      'AUTOMOTORES'
    );
  }

  getSnapshotsByLiquidacion(idLiquidacion: number): Observable<ApiResponse<LiquidacionSnapshotItem[]>> {
    return this.api.get<ApiResponse<LiquidacionSnapshotItem[]>>(
      `/liquidaciones/${idLiquidacion}/snapshots`,
      {},
      'AUTOMOTORES'
    );
  }

  getSnapshotByReferencia(referencia: string): Observable<ApiResponse<LiquidacionSnapshotDetalle>> {
    const refLimpia = encodeURIComponent(referencia.trim());
    return this.api.get<ApiResponse<LiquidacionSnapshotDetalle>>(
      `/liquidaciones/snapshots/referencia/${refLimpia}`,
      {},
      'AUTOMOTORES'
    );
  }

  getSnapshotParaConciliacion(numeroLiquidacion: string, fechaPago: string): Observable<ApiResponse<LiquidacionSnapshotDetalle>> {
    const params: Record<string, string> = {
      numeroLiquidacion: numeroLiquidacion.trim(),
      fechaPago: fechaPago.trim()
    };

    return this.api.get<ApiResponse<LiquidacionSnapshotDetalle>>(
      '/liquidaciones/snapshots/conciliacion',
      { params },
      'AUTOMOTORES'
    );
  }
}
