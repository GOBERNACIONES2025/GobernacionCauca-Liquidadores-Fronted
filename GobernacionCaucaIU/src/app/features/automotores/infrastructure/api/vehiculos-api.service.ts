import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../core/services/base-api.service';
import { ApiResponse, PagedResult } from '../../domain/interfaces/api-response.interface';
import { 
  VehiculoItemDto, 
  VehiculoDetalleDto,
  VehiculoKpisDto, 
  VehiculoFiltros, 
  CreateVehiculoRequest, 
  UpdateVehiculoRequest, 
  VincularPropietarioRequest, 
  VehiculoExpedienteDto 
} from '../../domain/interfaces/vehiculo.interface';
import { ConsultaVehicularRequest, ConsultaVehicularData } from '../../domain/interfaces/consulta-vehicular.interface';

@Injectable({
  providedIn: 'root',
})
export class VehiculosApiService {
  private api = inject(BaseApiService);

  getVehiculos(filtros: VehiculoFiltros = {}): Observable<ApiResponse<PagedResult<VehiculoItemDto>>> {
    const params: Record<string, string | number | boolean> = {};
    if (filtros.page) params['page'] = filtros.page;
    if (filtros.pageSize) params['pageSize'] = filtros.pageSize;
    if (filtros.buscar) params['buscar'] = filtros.buscar;
    if (filtros.estado && filtros.estado !== 'Todos') params['estado'] = filtros.estado;
    if (filtros.estadoMatriculaId) params['estadoMatriculaId'] = filtros.estadoMatriculaId;
    if (filtros.tipoVehiculo && filtros.tipoVehiculo !== 'Todos') params['tipoVehiculo'] = filtros.tipoVehiculo;
    if (filtros.soloActivos !== undefined && filtros.soloActivos !== null) {
      params['soloActivos'] = filtros.soloActivos;
    }
    return this.api.get<ApiResponse<PagedResult<VehiculoItemDto>>>('/vehiculos', { params }, 'AUTOMOTORES');
  }

  getPaginados(filtros: VehiculoFiltros = {}): Observable<ApiResponse<PagedResult<VehiculoItemDto>>> {
    return this.getVehiculos(filtros);
  }

  getKpis(): Observable<ApiResponse<VehiculoKpisDto>> {
    return this.api.get<ApiResponse<VehiculoKpisDto>>('/vehiculos/kpis', {}, 'AUTOMOTORES');
  }

  getVehiculoById(id: number): Observable<ApiResponse<VehiculoDetalleDto>> {
    return this.api.get<ApiResponse<VehiculoDetalleDto>>(`/vehiculos/${id}`, {}, 'AUTOMOTORES');
  }

  getById(id: number): Observable<ApiResponse<VehiculoDetalleDto>> {
    return this.getVehiculoById(id);
  }

  getVehiculoByPlaca(placa: string): Observable<ApiResponse<VehiculoDetalleDto>> {
    return this.api.get<ApiResponse<VehiculoDetalleDto>>(`/vehiculos/placa/${placa}`, {}, 'AUTOMOTORES');
  }

  getByPlaca(placa: string): Observable<ApiResponse<VehiculoDetalleDto>> {
    return this.getVehiculoByPlaca(placa);
  }

  getExpedienteById(id: number): Observable<ApiResponse<VehiculoExpedienteDto>> {
    return this.api.get<ApiResponse<VehiculoExpedienteDto>>(`/vehiculos/${id}/expediente`, {}, 'AUTOMOTORES');
  }

  getExpedienteByPlaca(placa: string): Observable<ApiResponse<VehiculoExpedienteDto>> {
    return this.api.get<ApiResponse<VehiculoExpedienteDto>>(`/vehiculos/placa/${placa}/expediente`, {}, 'AUTOMOTORES');
  }

  crearVehiculo(payload: CreateVehiculoRequest): Observable<ApiResponse<any>> {
    return this.api.post<ApiResponse<any>>('/vehiculos', payload, {}, 'AUTOMOTORES');
  }

  crear(payload: CreateVehiculoRequest): Observable<ApiResponse<any>> {
    return this.crearVehiculo(payload);
  }

  actualizarVehiculo(id: number, payload: UpdateVehiculoRequest): Observable<ApiResponse<any>> {
    return this.api.put<ApiResponse<any>>(`/vehiculos/${id}`, payload, {}, 'AUTOMOTORES');
  }

  actualizar(id: number, payload: UpdateVehiculoRequest): Observable<ApiResponse<any>> {
    return this.actualizarVehiculo(id, payload);
  }

  inactivarVehiculo(id: number): Observable<ApiResponse<any>> {
    return this.api.delete<ApiResponse<any>>(`/vehiculos/${id}`, {}, 'AUTOMOTORES');
  }

  inactivar(id: number): Observable<ApiResponse<any>> {
    return this.inactivarVehiculo(id);
  }

  vincularPropietario(id: number, payload: VincularPropietarioRequest): Observable<ApiResponse<any>> {
    return this.api.post<ApiResponse<any>>(`/vehiculos/${id}/propietarios`, payload, {}, 'AUTOMOTORES');
  }

  obtenerPropietarios(dni: string): Observable<any> {
    return this.api.get<any>('/Propietarios', {}, 'AUTOMOTORES');
  }

  getPendientesAprobacion(): Observable<ApiResponse<VehiculoItemDto[]>> {
    return this.api.get<ApiResponse<VehiculoItemDto[]>>('/vehiculos/pendientes-aprobacion', {}, 'AUTOMOTORES');
  }

  cambiarEstadoAprobacion(id: number, nuevoEstado: string): Observable<ApiResponse<any>> {
    return this.api.put<ApiResponse<any>>(`/vehiculos/${id}/estado-aprobacion`, {}, { params: { nuevoEstado } }, 'AUTOMOTORES');
  }

  consultarVehicular(body: ConsultaVehicularRequest): Observable<ApiResponse<ConsultaVehicularData>> {
    return this.api.post<ApiResponse<ConsultaVehicularData>>('/Consultas/Vehicular', body, {}, 'AUTOMOTORES');
  }
}
