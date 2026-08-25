import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { SolicitudLiquidacionApiService } from '../../../infrastructure/api/Radicacion/solicitud-liquidacion-api.service';
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
import { ApiResponse } from '../../../../../core/shared/models/shared.model';

@Injectable({
  providedIn: 'root'
})
export class SolicitudesLiquidacionFacade {
  private apiService = inject(SolicitudLiquidacionApiService);
  
  public actionLoading = signal<boolean>(false);

  listarSolicitudes(pageNumber: number = 1, pageSize: number = 10, search?: string, estadoId?: number): Observable<ApiResponse<PagedResult<SolicitudListadoDto>>> {
    this.actionLoading.set(true);
    return this.apiService.listarSolicitudes(pageNumber, pageSize, search, estadoId).pipe(
      finalize(() => this.actionLoading.set(false))
    );
  }

  crearSolicitud(command: CrearSolicitudDto): Observable<ApiResponse<number>> {
    this.actionLoading.set(true);
    return this.apiService.crearSolicitud(command).pipe(
      finalize(() => this.actionLoading.set(false))
    );
  }

  obtenerSolicitudPorId(id: number): Observable<ApiResponse<SolicitudLiquidacion>> {
    this.actionLoading.set(true);
    return this.apiService.obtenerSolicitudPorId(id).pipe(
      finalize(() => this.actionLoading.set(false))
    );
  }

  registrarContribuyente(id: number, command: RegistrarContribuyenteDto): Observable<ApiResponse<boolean>> {
    this.actionLoading.set(true);
    return this.apiService.registrarContribuyente(id, command).pipe(
      finalize(() => this.actionLoading.set(false))
    );
  }

  registrarDocumento(id: number, file: File | null, command: RegistrarDocumentoDto): Observable<ApiResponse<boolean>> {
    this.actionLoading.set(true);
    return this.apiService.registrarDocumento(id, file, command).pipe(
      finalize(() => this.actionLoading.set(false))
    );
  }

  registrarActos(id: number, command: RegistrarActosDto): Observable<ApiResponse<boolean>> {
    this.actionLoading.set(true);
    return this.apiService.registrarActos(id, command).pipe(
      finalize(() => this.actionLoading.set(false))
    );
  }

  registrarIntervinientes(id: number, command: RegistrarIntervinientesDto): Observable<ApiResponse<boolean>> {
    this.actionLoading.set(true);
    return this.apiService.registrarIntervinientes(id, command).pipe(
      finalize(() => this.actionLoading.set(false))
    );
  }

  completarSolicitud(id: number): Observable<ApiResponse<boolean>> {
    this.actionLoading.set(true);
    return this.apiService.completarSolicitud(id).pipe(
      finalize(() => this.actionLoading.set(false))
    );
  }

  cancelarSolicitud(id: number, motivo: string): Observable<ApiResponse<boolean>> {
    this.actionLoading.set(true);
    return this.apiService.cancelarSolicitud(id, motivo).pipe(
      finalize(() => this.actionLoading.set(false))
    );
  }
}
