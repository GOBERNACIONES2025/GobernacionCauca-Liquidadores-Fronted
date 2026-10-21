import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../core/services/base-api.service';
import { ApiResponse, PagedResult } from '../../domain/interfaces/api-response.interface';
import {
  ExpedienteCobroCoactivo,
  MedidaCautelar,
  EjecucionesFiscalesKpis,
  EjecucionesFiscalesFiltros,
  IniciarExpedienteRequest,
  LibrarMandamientoRequest,
  RegistrarNotificacionMandamientoRequest,
  EmitirConstanciaEjecutoriaRequest,
  DecretarMedidaCautelarRequest,
  LevantarMedidaCautelarRequest,
  RegistrarAutoCierreRequest,
  AsignarAbogadoRequest
} from '../../domain/models/ejecuciones-fiscales.model';

@Injectable({
  providedIn: 'root'
})
export class EjecucionesFiscalesApiService {
  private api = inject(BaseApiService);

  getExpedientes(filtros: EjecucionesFiscalesFiltros = {}): Observable<ApiResponse<PagedResult<ExpedienteCobroCoactivo>>> {
    const params: Record<string, any> = {
      page: filtros.page ?? 1,
      pageSize: filtros.pageSize ?? 15,
    };

    if (filtros.tab) params['tab'] = filtros.tab;
    if (filtros.placa?.trim()) params['placa'] = filtros.placa.trim().toUpperCase();
    if (filtros.numeroIdentificacion?.trim()) params['numeroIdentificacion'] = filtros.numeroIdentificacion.trim();
    if (filtros.numeroExpediente?.trim()) params['numeroExpediente'] = filtros.numeroExpediente.trim().toUpperCase();
    if (filtros.numeroMandamiento?.trim()) params['numeroMandamiento'] = filtros.numeroMandamiento.trim().toUpperCase();
    if (filtros.estadoProceso) params['estadoProceso'] = filtros.estadoProceso;
    if (filtros.abogadoAsignado) params['abogadoAsignado'] = filtros.abogadoAsignado;

    return this.api.get<ApiResponse<PagedResult<ExpedienteCobroCoactivo>>>(
      '/ejecuciones-fiscales', { params }, 'AUTOMOTORES'
    );
  }

  getKpis(): Observable<ApiResponse<EjecucionesFiscalesKpis>> {
    return this.api.get<ApiResponse<EjecucionesFiscalesKpis>>(
      '/ejecuciones-fiscales/kpis', {}, 'AUTOMOTORES'
    );
  }

  getPorId(id: number): Observable<ApiResponse<ExpedienteCobroCoactivo>> {
    return this.api.get<ApiResponse<ExpedienteCobroCoactivo>>(
      `/ejecuciones-fiscales/${id}`, {}, 'AUTOMOTORES'
    );
  }

  iniciarExpediente(req: IniciarExpedienteRequest): Observable<ApiResponse<ExpedienteCobroCoactivo>> {
    return this.api.post<ApiResponse<ExpedienteCobroCoactivo>>(
      '/ejecuciones-fiscales/iniciar', req, {}, 'AUTOMOTORES'
    );
  }

  iniciarMasivo(ids: number[], abogado?: string, usuario?: string): Observable<ApiResponse<ExpedienteCobroCoactivo[]>> {
    const params: Record<string, any> = {};
    if (abogado) params['abogado'] = abogado;
    if (usuario) params['usuario'] = usuario;

    return this.api.post<ApiResponse<ExpedienteCobroCoactivo[]>>(
      '/ejecuciones-fiscales/iniciar-masivo', ids, { params }, 'AUTOMOTORES'
    );
  }

  librarMandamiento(id: number, req: LibrarMandamientoRequest): Observable<ApiResponse<ExpedienteCobroCoactivo>> {
    return this.api.post<ApiResponse<ExpedienteCobroCoactivo>>(
      `/ejecuciones-fiscales/${id}/mandamiento`, req, {}, 'AUTOMOTORES'
    );
  }

  registrarNotificacion(id: number, req: RegistrarNotificacionMandamientoRequest): Observable<ApiResponse<ExpedienteCobroCoactivo>> {
    return this.api.post<ApiResponse<ExpedienteCobroCoactivo>>(
      `/ejecuciones-fiscales/${id}/notificar`, req, {}, 'AUTOMOTORES'
    );
  }

  emitirConstanciaEjecutoria(id: number, req: EmitirConstanciaEjecutoriaRequest): Observable<ApiResponse<ExpedienteCobroCoactivo>> {
    return this.api.post<ApiResponse<ExpedienteCobroCoactivo>>(
      `/ejecuciones-fiscales/${id}/constancia-ejecutoria`, req, {}, 'AUTOMOTORES'
    );
  }

  decretarMedidasCautelares(id: number, req: DecretarMedidaCautelarRequest): Observable<ApiResponse<ExpedienteCobroCoactivo>> {
    return this.api.post<ApiResponse<ExpedienteCobroCoactivo>>(
      `/ejecuciones-fiscales/${id}/medidas-cautelares`, req, {}, 'AUTOMOTORES'
    );
  }

  levantarMedidaCautelar(medidaId: number, req: LevantarMedidaCautelarRequest): Observable<ApiResponse<MedidaCautelar>> {
    return this.api.post<ApiResponse<MedidaCautelar>>(
      `/ejecuciones-fiscales/medidas-cautelares/${medidaId}/levantar`, req, {}, 'AUTOMOTORES'
    );
  }

  registrarAutoCierre(id: number, req: RegistrarAutoCierreRequest): Observable<ApiResponse<ExpedienteCobroCoactivo>> {
    return this.api.post<ApiResponse<ExpedienteCobroCoactivo>>(
      `/ejecuciones-fiscales/${id}/auto-cierre`, req, {}, 'AUTOMOTORES'
    );
  }

  asignarAbogado(id: number, req: AsignarAbogadoRequest): Observable<ApiResponse<ExpedienteCobroCoactivo>> {
    return this.api.post<ApiResponse<ExpedienteCobroCoactivo>>(
      `/ejecuciones-fiscales/${id}/asignar-abogado`, req, {}, 'AUTOMOTORES'
    );
  }

  descargarDocumentoPdf(endpoint: string): Observable<Blob> {
    return this.api.get<Blob>(endpoint, { responseType: 'blob' as any }, 'AUTOMOTORES');
  }
}
