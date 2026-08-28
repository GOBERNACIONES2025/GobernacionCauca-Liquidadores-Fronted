import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../core/services/base-api.service';
import { ApiResponse } from '../../domain/interfaces/api-response.interface';
import { 
  CatalogoItemDto, 
  TipoDocumentoDto, 
  NaturalezaJuridicaDto, 
  MarcaDto, 
  LineaDto, 
  TodosCatalogosDto 
} from '../../domain/interfaces/catalogo.interface';

@Injectable({
  providedIn: 'root',
})
export class CatalogoApiService {
  private api = inject(BaseApiService);

  getTodos(): Observable<ApiResponse<TodosCatalogosDto>> {
    return this.api.get<ApiResponse<TodosCatalogosDto>>('/catalogo/todos', {}, 'AUTOMOTORES');
  }

  getTiposDocumento(): Observable<ApiResponse<TipoDocumentoDto[]> | TipoDocumentoDto[]> {
    return this.api.get<any>('/catalogo/tipos-documento', {}, 'AUTOMOTORES');
  }

  getNaturalezasJuridicas(): Observable<ApiResponse<NaturalezaJuridicaDto[]> | NaturalezaJuridicaDto[]> {
    return this.api.get<any>('/catalogo/naturalezas-juridicas', {}, 'AUTOMOTORES');
  }

  getEstadosMatricula(): Observable<ApiResponse<CatalogoItemDto[]>> {
    return this.api.get<ApiResponse<CatalogoItemDto[]>>('/catalogo/estados-matricula', {}, 'AUTOMOTORES');
  }

  getOrganismosTransito(): Observable<ApiResponse<CatalogoItemDto[]>> {
    return this.api.get<ApiResponse<CatalogoItemDto[]>>('/catalogo/organismos-transito', {}, 'AUTOMOTORES');
  }

  getTiposVinculo(): Observable<ApiResponse<CatalogoItemDto[]>> {
    return this.api.get<ApiResponse<CatalogoItemDto[]>>('/catalogo/tipos-vinculo', {}, 'AUTOMOTORES');
  }

  getClasesVehiculo(): Observable<ApiResponse<CatalogoItemDto[]>> {
    return this.api.get<ApiResponse<CatalogoItemDto[]>>('/catalogo/clases-vehiculo', {}, 'AUTOMOTORES');
  }

  getCombustibles(): Observable<ApiResponse<CatalogoItemDto[]>> {
    return this.api.get<ApiResponse<CatalogoItemDto[]>>('/catalogo/combustibles', {}, 'AUTOMOTORES');
  }

  getServiciosVehiculo(): Observable<ApiResponse<CatalogoItemDto[]>> {
    return this.api.get<ApiResponse<CatalogoItemDto[]>>('/catalogo/servicios-vehiculo', {}, 'AUTOMOTORES');
  }

  getTiposVehiculo(): Observable<ApiResponse<CatalogoItemDto[]>> {
    return this.api.get<ApiResponse<CatalogoItemDto[]>>('/catalogo/tipos-vehiculo', {}, 'AUTOMOTORES');
  }

  getMarcas(tipoVehiculo?: string, tipoVehiculoId?: number): Observable<ApiResponse<MarcaDto[]>> {
    const params: Record<string, string | number> = {};
    if (tipoVehiculo) params['tipoVehiculo'] = tipoVehiculo.trim();
    if (tipoVehiculoId) params['tipoVehiculoId'] = tipoVehiculoId;

    return this.api.get<ApiResponse<MarcaDto[]>>('/catalogo/marcas', { params }, 'AUTOMOTORES');
  }

  getLineas(marca?: string, marcaId?: number, tipoVehiculo?: string): Observable<ApiResponse<LineaDto[]>> {
    const params: Record<string, string | number> = {};
    if (marca) params['marca'] = marca.trim();
    if (marcaId) params['marcaId'] = marcaId;
    if (tipoVehiculo) params['tipoVehiculo'] = tipoVehiculo.trim();

    return this.api.get<ApiResponse<LineaDto[]>>('/catalogo/lineas', { params }, 'AUTOMOTORES');
  }
}
