import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../core/services/base-api.service';
import { ApiResponse, PagedResult } from '../../domain/interfaces/api-response.interface';
import {
  ActoLiquidacionOficial,
  LiquidacionOficialKpis,
  LiquidacionOficialFiltros,
  EmitirLiquidacionOficialRequest,
  EmitirLiquidacionOficialMasivaRequest,
  ActualizarTrazabilidadPostalLiqOficialRequest,
  DeclararPrescripcionRequest,
} from '../../domain/models/liquidacion-oficial.model';

/**
 * Servicio de infraestructura API para el módulo de Liquidación Oficial de Aforo y Prescripción.
 * Se comunica con la API Backend (.NET 10) de Cobro Coactivo (Fase 2).
 */
@Injectable({
  providedIn: 'root'
})
export class LiquidacionesOficialesApiService {
  private api = inject(BaseApiService);

  /**
   * Consulta el listado de liquidaciones oficiales según pestaña operativa y filtros de búsqueda.
   */
  getLiquidacionesOficiales(filtros: LiquidacionOficialFiltros = {}): Observable<ApiResponse<PagedResult<ActoLiquidacionOficial>>> {
    const params: Record<string, any> = {
      page: filtros.page ?? 1,
      pageSize: filtros.pageSize ?? 15,
    };

    if (filtros.placa?.trim()) params['placa'] = filtros.placa.trim().toUpperCase();
    if (filtros.vigencia && filtros.vigencia > 0) params['vigencia'] = filtros.vigencia;
    if (filtros.estadoActo) params['estadoActo'] = filtros.estadoActo;
    if (filtros.estadoPostal) params['estadoPostal'] = filtros.estadoPostal;
    if (filtros.tab) params['tab'] = filtros.tab;
    if (filtros.fechaDesde) params['fechaDesde'] = filtros.fechaDesde;
    if (filtros.fechaHasta) params['fechaHasta'] = filtros.fechaHasta;

    return this.api.get<ApiResponse<PagedResult<ActoLiquidacionOficial>>>(
      '/liquidaciones-oficiales', { params }, 'AUTOMOTORES'
    );
  }

  /**
   * Obtiene los indicadores KPI estratégicos de liquidaciones oficiales y prescripciones.
   */
  getKpis(): Observable<ApiResponse<LiquidacionOficialKpis>> {
    return this.api.get<ApiResponse<LiquidacionOficialKpis>>(
      '/liquidaciones-oficiales/kpis', {}, 'AUTOMOTORES'
    );
  }

  /**
   * Obtiene el detalle de un acto de liquidación oficial por ID.
   */
  getPorId(id: number): Observable<ApiResponse<ActoLiquidacionOficial>> {
    return this.api.get<ApiResponse<ActoLiquidacionOficial>>(
      `/liquidaciones-oficiales/${id}`, {}, 'AUTOMOTORES'
    );
  }

  /**
   * Emite formalmente un Acto de Liquidación Oficial de Aforo individual.
   */
  emitir(payload: EmitirLiquidacionOficialRequest): Observable<ApiResponse<ActoLiquidacionOficial>> {
    return this.api.post<ApiResponse<ActoLiquidacionOficial>>(
      '/liquidaciones-oficiales/emitir', payload, {}, 'AUTOMOTORES'
    );
  }

  /**
   * Emite formalmente un lote masivo de Liquidaciones Oficiales de Aforo.
   */
  emitirMasivo(payload: EmitirLiquidacionOficialMasivaRequest): Observable<ApiResponse<any>> {
    return this.api.post<ApiResponse<any>>(
      '/liquidaciones-oficiales/emitir-masivo', payload, {}, 'AUTOMOTORES'
    );
  }

  /**
   * Registra o actualiza la trazabilidad postal (guía de 4-72, acuse de recibo) y computa términos de ejecutoria.
   */
  actualizarPostal(payload: ActualizarTrazabilidadPostalLiqOficialRequest): Observable<ApiResponse<boolean>> {
    return this.api.post<ApiResponse<boolean>>(
      '/liquidaciones-oficiales/postal', payload, {}, 'AUTOMOTORES'
    );
  }

  /**
   * Declara formalmente la Pérdida de Competencia y Prescripción de la Acción de Cobro (ETN Arts. 717 y 817).
   */
  declararPrescripcion(payload: DeclararPrescripcionRequest): Observable<ApiResponse<ActoLiquidacionOficial>> {
    return this.api.post<ApiResponse<ActoLiquidacionOficial>>(
      '/liquidaciones-oficiales/prescribir', payload, {}, 'AUTOMOTORES'
    );
  }

  /**
   * Comprueba los plazos de ejecutoria vencidos (2 meses sin recurso) y consolida Títulos Ejecutivos en Firme.
   */
  verificarEjecutoria(): Observable<ApiResponse<number>> {
    return this.api.post<ApiResponse<number>>(
      '/liquidaciones-oficiales/verificar-ejecutoria', {}, {}, 'AUTOMOTORES'
    );
  }

  /**
   * Descarga el PDF oficial de la Resolución de Liquidación Oficial de Aforo.
   */
  descargarPdf(id: number, descargar: boolean = true): Observable<Blob> {
    return this.api.get<Blob>(
      `/liquidaciones-oficiales/${id}/pdf`,
      { params: { descargar }, responseType: 'blob' as any },
      'AUTOMOTORES'
    );
  }

  /**
   * Obtiene la vista previa HTML de la Resolución de Liquidación Oficial de Aforo.
   */
  getPreviewHtml(id: number): Observable<string> {
    return this.api.get<string>(
      `/liquidaciones-oficiales/${id}/preview-html`,
      { responseType: 'text' as any },
      'AUTOMOTORES'
    );
  }

  /**
   * Descarga el PDF oficial de la Resolución de Prescripción / Pérdida de Competencia.
   */
  descargarPrescripcionPdf(id: number, descargar: boolean = true): Observable<Blob> {
    return this.api.get<Blob>(
      `/liquidaciones-oficiales/${id}/prescripcion/pdf`,
      { params: { descargar }, responseType: 'blob' as any },
      'AUTOMOTORES'
    );
  }
}
