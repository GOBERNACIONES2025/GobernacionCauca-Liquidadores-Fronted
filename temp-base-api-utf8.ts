import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthStateService } from '../auth/auth-state.service';
import { HttpOptions, TaxModuleType } from '../auth/auth.models';

@Injectable({
  providedIn: 'root',
})
export class BaseApiService {
  private http = inject(HttpClient);
  private authState = inject(AuthStateService);

  /**
   * Construye la URL completa combinando la Base URL pura del impuesto objetivo y el endpoint solicitado.
   * @param endpoint Ruta relativa del recurso (ej: 'vehiculos/ABC123' o '/liquidaciones')
   * @param targetModule Impuesto objetivo ('AUTOMOTORES', 'REGISTROS', etc.). Si no se pasa, toma el impuesto activo.
   */
  public buildUrl(endpoint: string, targetModule?: TaxModuleType): string {
    const baseUrl = this.authState.getApiUrl(targetModule);
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    return `${cleanBase}${cleanEndpoint}`;
  }

  /**
   * Peticion GET generica fuertemente tipada.
   */
  get<T>(endpoint: string, options?: HttpOptions, targetModule?: TaxModuleType): Observable<T> {
    const url = this.buildUrl(endpoint, targetModule);
    return this.http.get<T>(url, this.formatOptions(options));
  }

  /**
   * Peticion POST generica fuertemente tipada.
   */
  post<T>(endpoint: string, body: any, options?: HttpOptions, targetModule?: TaxModuleType): Observable<T> {
    const url = this.buildUrl(endpoint, targetModule);
    return this.http.post<T>(url, body, this.formatOptions(options));
