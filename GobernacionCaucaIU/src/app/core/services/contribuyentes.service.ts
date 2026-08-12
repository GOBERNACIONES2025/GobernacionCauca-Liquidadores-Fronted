import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, PagedResult, Contribuyente, Expediente } from '../models/contribuyente.model';

@Injectable({
  providedIn: 'root'
})
export class ContribuyentesService {
  private apiUrl = 'https://localhost:7250/api/propietarios';

  constructor(private http: HttpClient) {}

  /**
   * Obtiene la lista paginada de contribuyentes.
   */
  getContribuyentes(page: number = 1, pageSize: number = 20, buscar?: string, soloActivos?: boolean): Observable<ApiResponse<PagedResult<Contribuyente>>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (buscar) {
      params = params.set('buscar', buscar);
    }

    if (soloActivos !== undefined) {
      params = params.set('soloActivos', soloActivos.toString());
    }

    return this.http.get<ApiResponse<PagedResult<Contribuyente>>>(this.apiUrl, { params });
  }

  /**
   * Obtiene el expediente completo de un contribuyente (Vehículos, Historial, Liquidaciones).
   */
  getExpediente(id: number): Observable<ApiResponse<Expediente>> {
    return this.http.get<ApiResponse<Expediente>>(`${this.apiUrl}/${id}/expediente`);
  }

  /**
   * Crea un nuevo contribuyente.
   */
  createContribuyente(data: any): Observable<ApiResponse<Contribuyente>> {
    return this.http.post<ApiResponse<Contribuyente>>(this.apiUrl, data);
  }

  /**
   * Actualiza un contribuyente existente.
   */
  updateContribuyente(id: number, data: any): Observable<ApiResponse<Contribuyente>> {
    return this.http.put<ApiResponse<Contribuyente>>(`${this.apiUrl}/${id}`, data);
  }
}
