import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../core/services/base-api.service';
import { ApiResponse } from '../../domain/interfaces/api-response.interface';
import {
  VehiculoOmiso,
  OmisosKpis,
  OmisosFiltros,
  SimulacionLiquidacion,
  SimularLiquidacionRequest,
  TrazabilidadPostalRequest
} from '../../domain/models/liquidacion.model';

export interface PagedResultOmisos<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Servicio de infraestructura API para el módulo de Vehículos Omisos y Emplazamiento.
 * Encapsula la comunicación con la API Backend (.NET 10) para fiscalización, cobro y actos administrativos.
 */
@Injectable({
  providedIn: 'root'
})
export class OmisosApiService {
  private api = inject(BaseApiService);

  /**
   * Consulta la lista paginada de vehículos omisos con cálculo dinámico de mora y semáforo.
   */
  getOmisos(filtros: OmisosFiltros = {}): Observable<ApiResponse<PagedResultOmisos<VehiculoOmiso>>> {
    const params: Record<string, any> = {
      page: filtros.page ?? 1,
      pageSize: filtros.pageSize ?? 15,
      ordenarPor: filtros.ordenarPor ?? 'diasMora',
      ordenDesc: filtros.ordenDesc ?? true,
    };

    if (filtros.buscar?.trim()) params['buscar'] = filtros.buscar.trim();
    if (filtros.vigencia && filtros.vigencia > 0) params['vigencia'] = filtros.vigencia;
    if (filtros.nivelMora) params['nivelMora'] = filtros.nivelMora;
    if (filtros.estadoEmplazamiento) params['estadoEmplazamiento'] = filtros.estadoEmplazamiento;
    if (filtros.diasMoraMinimo && filtros.diasMoraMinimo > 0) params['diasMoraMinimo'] = filtros.diasMoraMinimo;

    return this.api.get<ApiResponse<PagedResultOmisos<VehiculoOmiso>>>(
      '/liquidaciones/omisos', { params }, 'AUTOMOTORES'
    );
  }

  /**
   * Fallback de contingencia: consulta las liquidaciones pendientes si el endpoint /omisos no estuviese disponible.
   */
  getPendientesFallback(params: Record<string, any>): Observable<ApiResponse<PagedResultOmisos<any>>> {
    return this.api.get<ApiResponse<PagedResultOmisos<any>>>(
      '/liquidaciones/pendientes', { params }, 'AUTOMOTORES'
    );
  }

  /**
   * Obtiene los indicadores KPI globales del parque omiso y semáforos de mora.
   */
  getKpis(vigencia?: number): Observable<ApiResponse<OmisosKpis>> {
    const params: Record<string, any> = {};
    if (vigencia && vigencia > 0) params['vigencia'] = vigencia;

    return this.api.get<ApiResponse<OmisosKpis>>(
      '/liquidaciones/omisos/kpis', { params }, 'AUTOMOTORES'
    );
  }

  /**
   * Simula y proyecta el estado de cuenta oficial para el expediente de emplazamiento.
   */
  simular(request: SimularLiquidacionRequest): Observable<ApiResponse<SimulacionLiquidacion>> {
    return this.api.post<ApiResponse<SimulacionLiquidacion>>(
      '/liquidaciones/simular', request, {}, 'AUTOMOTORES'
    );
  }

  /**
   * Registra o actualiza la trazabilidad postal (guía de 4-72, acuse de recibo o causal de devolución).
   */
  actualizarTrazabilidadPostal(payload: TrazabilidadPostalRequest): Observable<ApiResponse<boolean>> {
    return this.api.post<ApiResponse<boolean>>(
      '/liquidaciones/emplazamientos/postal', payload, {}, 'AUTOMOTORES'
    );
  }

  /**
   * Emite y radica formalmente un Acto Administrativo de Emplazamiento Previo en BD.
   */
  emitirEmplazamiento(payload: { placa: string; vigencias?: number[]; observaciones?: string }): Observable<ApiResponse<any>> {
    return this.api.post<ApiResponse<any>>(
      '/liquidaciones/emplazamientos', payload, {}, 'AUTOMOTORES'
    );
  }

  /**
   * Emite un lote masivo de Actos de Emplazamiento Previo con radicación oficial en BD.
   */
  emitirEmplazamientoMasivo(payload: { placas: string[]; vigencia?: number; vigenciasPorPlaca?: Record<string, number[]> }): Observable<ApiResponse<any>> {
    return this.api.post<ApiResponse<any>>(
      '/liquidaciones/emplazamientos/masivo', payload, {}, 'AUTOMOTORES'
    );
  }

  /**
   * Registra la notificación subsidiaria por Aviso Web / Cartelera ante devolución física (ETN Art. 568).
   */
  publicarAvisoWeb(payload: { placa: string; numeroActoEmplazamiento?: string; observaciones?: string }): Observable<ApiResponse<boolean>> {
    return this.api.post<ApiResponse<boolean>>(
      '/liquidaciones/emplazamientos/aviso-web', payload, {}, 'AUTOMOTORES'
    );
  }

  /**
   * Descarga el PDF oficial del Dossier de Emplazamiento Previo (Auto de Apertura + Emplazamiento ETN Art. 715) por ID de Acto.
   */
  descargarDossierPdf(id: number, descargar: boolean = true): Observable<Blob> {
    return this.api.get<Blob>(
      `/liquidaciones/emplazamientos/${id}/pdf`,
      { params: { descargar }, responseType: 'blob' as any },
      'AUTOMOTORES'
    );
  }

  /**
   * Descarga el PDF oficial del Dossier de Emplazamiento Previo buscando por placa vehicular.
   */
  descargarDossierPdfPorPlaca(placa: string, descargar: boolean = true): Observable<Blob> {
    return this.api.get<Blob>(
      `/liquidaciones/emplazamientos/por-placa/${encodeURIComponent(placa)}/pdf`,
      { params: { descargar }, responseType: 'blob' as any },
      'AUTOMOTORES'
    );
  }

  /**
   * Obtiene la vista previa en HTML del Dossier de Emplazamiento para inspección visual o visor web por ID de Acto.
   */
  getPreviewHtmlDossier(id: number): Observable<string> {
    return this.api.get<string>(
      `/liquidaciones/emplazamientos/${id}/preview-html`,
      { responseType: 'text' as any },
      'AUTOMOTORES'
    );
  }

  /**
   * Obtiene la vista previa en HTML del Dossier de Emplazamiento buscando por placa vehicular.
   */
  getPreviewHtmlDossierPorPlaca(placa: string): Observable<string> {
    return this.api.get<string>(
      `/liquidaciones/emplazamientos/por-placa/${encodeURIComponent(placa)}/preview-html`,
      { responseType: 'text' as any },
      'AUTOMOTORES'
    );
  }

  /**
   * Genera y descarga el Auto de Cierre y Archivo de Fiscalización en PDF.
   */
  descargarAutoCierrePdf(id: number, request: { causal?: string; motivo?: string; usuario?: string }, descargar: boolean = true): Observable<Blob> {
    return this.api.post<Blob>(
      `/liquidaciones/emplazamientos/${id}/auto-cierre/pdf`,
      request,
      { params: { descargar }, responseType: 'blob' as any },
      'AUTOMOTORES'
    );
  }

  /**
   * Genera y descarga la Planilla de Envío para el Operador Postal 4-72 en PDF para una lista de actos.
   */
  descargarPlanillaPostalPdf(request: { actosIds: number[]; responsableEntrega?: string }, descargar: boolean = true): Observable<Blob> {
    return this.api.post<Blob>(
      '/liquidaciones/emplazamientos/planilla-postal/pdf',
      request,
      { params: { descargar }, responseType: 'blob' as any },
      'AUTOMOTORES'
    );
  }

  /**
   * Genera y descarga el Edicto de Aviso Web / Notificación Subsidiaria por Cartelera en PDF para actos devueltos.
   */
  descargarAvisoWebPdf(request: { actosIds: number[] }, descargar: boolean = true): Observable<Blob> {
    return this.api.post<Blob>(
      '/liquidaciones/emplazamientos/aviso-web/pdf',
      request,
      { params: { descargar }, responseType: 'blob' as any },
      'AUTOMOTORES'
    );
  }

  /**
   * Construye la URL directa para descargar o abrir inline el PDF del Dossier de Emplazamiento por ID.
   */
  construirDossierPdfUrl(id: number, descargar: boolean = false): string {
    return this.api.buildUrl(`/liquidaciones/emplazamientos/${id}/pdf?descargar=${descargar}`, 'AUTOMOTORES');
  }

  /**
   * Construye la URL directa para descargar o abrir inline el PDF del Dossier de Emplazamiento por Placa.
   */
  construirDossierPdfUrlPorPlaca(placa: string, descargar: boolean = false): string {
    return this.api.buildUrl(`/liquidaciones/emplazamientos/por-placa/${encodeURIComponent(placa)}/pdf?descargar=${descargar}`, 'AUTOMOTORES');
  }
}
