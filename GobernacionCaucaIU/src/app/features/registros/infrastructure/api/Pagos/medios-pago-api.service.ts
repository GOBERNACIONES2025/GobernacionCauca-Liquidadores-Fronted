import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../../core/services/base-api.service';
import { ApiResponse, PagedResult } from '../../../../../core/shared/models/shared.model';
import { 
  MedioPago, 
  CrearMedioPagoDto, 
  ActualizarMedioPagoDto 
} from '../../../domain/models/Pagos/medio-pago.model';

@Injectable({
  providedIn: 'root',
})
export class MediosPagoApiService {
  private api = inject(BaseApiService);
  private readonly baseUrl = '/MediosPago';

  obtenerTodos(
    paramsOrPage: number | any = 1, 
    pageSize: number = 10, 
    searchTerm?: string,
    activo?: boolean
  ): Observable<ApiResponse<PagedResult<MedioPago>>> {
    const params: any = {};
    if (typeof paramsOrPage === 'object') {
      params.PageNumber = paramsOrPage.pageNumber ?? 1;
      params.PageSize = paramsOrPage.pageSize ?? 10;
      const term = paramsOrPage.searchTerm ?? paramsOrPage.search;
      if (term && term.trim() !== '') params.SearchTerm = term.trim();
      if (paramsOrPage.activo !== undefined && paramsOrPage.activo !== null) params.Activo = paramsOrPage.activo;
    } else {
      params.PageNumber = paramsOrPage ?? 1;
      params.PageSize = pageSize ?? 10;
      if (searchTerm && searchTerm.trim() !== '') params.SearchTerm = searchTerm.trim();
      if (activo !== undefined && activo !== null) params.Activo = activo;
    }
    return this.api.get<ApiResponse<PagedResult<MedioPago>>>(
      this.baseUrl,
      { params },
      'REGISTROS'
    );
  }

  obtenerPorId(id: number): Observable<ApiResponse<MedioPago>> {
    return this.api.get<ApiResponse<MedioPago>>(
      `${this.baseUrl}/${id}`,
      {},
      'REGISTROS'
    );
  }

  crear(request: CrearMedioPagoDto): Observable<ApiResponse<number>> {
    return this.api.post<ApiResponse<number>>(
      this.baseUrl,
      request,
      {},
      'REGISTROS'
    );
  }

  actualizar(id: number, request: ActualizarMedioPagoDto): Observable<ApiResponse<void>> {
    return this.api.put<ApiResponse<void>>(
      `${this.baseUrl}/${id}`,
      request,
      {},
      'REGISTROS'
    );
  }

  eliminar(id: number): Observable<ApiResponse<void>> {
    return this.api.delete<ApiResponse<void>>(
      `${this.baseUrl}/${id}`,
      {},
      'REGISTROS'
    );
  }
}
