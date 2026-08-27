import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../../core/services/base-api.service';
import { ApiResponse } from '../../../../../core/shared/models/shared.model';
import { 
  CrearSolicitudDto, 
  RegistrarContribuyenteDto, 
  RegistrarDocumentoDto, 
  RegistrarActosDto, 
  RegistrarIntervinientesDto, 
  SolicitudLiquidacion,
  SolicitudListadoDto,
  PagedResult
} from '../../../domain/models/Radicacion/solicitud-wizard.model';

@Injectable({
  providedIn: 'root'
})
export class SolicitudLiquidacionApiService {
  private api = inject(BaseApiService);
  private readonly baseUrl = '/SolicitudLiquidacion';
  private readonly dbContext = 'REGISTROS';

  listarSolicitudes(
    paramsOrPage: number | any = 1, 
    pageSize: number = 10, 
    search?: string, 
    estadoId?: number
  ): Observable<ApiResponse<PagedResult<SolicitudListadoDto>>> {
    const params: any = {};
    if (typeof paramsOrPage === 'object') {
      params.PageNumber = paramsOrPage.pageNumber ?? 1;
      params.PageSize = paramsOrPage.pageSize ?? 10;
      const term = paramsOrPage.searchTerm ?? paramsOrPage.search;
      if (term && term.trim() !== '') params.SearchTerm = term.trim();
      if (paramsOrPage.estadoId || paramsOrPage.estadoSolicitudId) {
        params.EstadoSolicitudId = paramsOrPage.estadoId ?? paramsOrPage.estadoSolicitudId;
      }
    } else {
      params.PageNumber = paramsOrPage ?? 1;
      params.PageSize = pageSize ?? 10;
      if (search && search.trim() !== '') params.SearchTerm = search.trim();
      if (estadoId) params.EstadoSolicitudId = estadoId;
    }
    return this.api.get<ApiResponse<PagedResult<SolicitudListadoDto>>>(this.baseUrl, { params }, this.dbContext);
  }

  obtenerTodos(
    paramsOrPage: number | any = 1, 
    pageSize: number = 10, 
    search?: string, 
    estadoId?: number
  ): Observable<ApiResponse<PagedResult<SolicitudListadoDto>>> {
    return this.listarSolicitudes(paramsOrPage, pageSize, search, estadoId);
  }

  crearSolicitud(command: CrearSolicitudDto): Observable<ApiResponse<number>> {
    return this.api.post<ApiResponse<number>>(`${this.baseUrl}`, command, {}, this.dbContext);
  }

  obtenerSolicitudPorId(id: number): Observable<ApiResponse<SolicitudLiquidacion>> {
    return this.api.get<ApiResponse<SolicitudLiquidacion>>(`${this.baseUrl}/${id}`, {}, this.dbContext);
  }

  registrarContribuyente(id: number, command: RegistrarContribuyenteDto): Observable<ApiResponse<boolean>> {
    return this.api.patch<ApiResponse<boolean>>(`${this.baseUrl}/${id}/contribuyente`, command, {}, this.dbContext);
  }

  registrarDocumento(id: number, file: File | null, command: RegistrarDocumentoDto): Observable<ApiResponse<boolean>> {
    const formData = new FormData();
    
    // Al usar [FromForm] con un record, ASP.NET Core exige que todos los campos estén presentes
    // (incluyendo SolicitudId, aunque luego el controlador lo sobreescriba).
    formData.append('SolicitudId', id.toString());
    formData.append('NumeroDocumento', command.numeroDocumento);
    formData.append('FechaDocumento', command.fechaDocumento);
    formData.append('EntidadRegistroId', command.entidadRegistroId.toString());
    formData.append('MunicipioJurisdiccionId', command.municipioJurisdiccionId.toString());
    
    if (command.descripcion) {
      formData.append('Descripcion', command.descripcion);
    }
    
    if (file) {
      formData.append('Archivo', file, file.name);
    }
    
    return this.api.patch<ApiResponse<boolean>>(`${this.baseUrl}/${id}/documento`, formData, {}, this.dbContext);
  }

  registrarActos(id: number, command: RegistrarActosDto): Observable<ApiResponse<boolean>> {
    return this.api.patch<ApiResponse<boolean>>(`${this.baseUrl}/${id}/actos`, command, {}, this.dbContext);
  }

  registrarIntervinientes(id: number, command: RegistrarIntervinientesDto): Observable<ApiResponse<boolean>> {
    return this.api.patch<ApiResponse<boolean>>(`${this.baseUrl}/${id}/intervinientes`, command, {}, this.dbContext);
  }

  completarSolicitud(id: number): Observable<ApiResponse<boolean>> {
    return this.api.post<ApiResponse<boolean>>(`${this.baseUrl}/${id}/completar`, {}, {}, this.dbContext);
  }

  cancelarSolicitud(id: number, motivo: string): Observable<ApiResponse<boolean>> {
    return this.api.post<ApiResponse<boolean>>(`${this.baseUrl}/${id}/cancelar`, { motivo }, {}, this.dbContext);
  }
}
