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
  }

  /**
   * Peticion PUT generica fuertemente tipada.
   */
  put<T>(endpoint: string, body: any, options?: HttpOptions, targetModule?: TaxModuleType): Observable<T> {
    const url = this.buildUrl(endpoint, targetModule);
    return this.http.put<T>(url, body, this.formatOptions(options));
  }

  /**
   * Peticion PATCH generica fuertemente tipada.
   */
  patch<T>(endpoint: string, body: any, options?: HttpOptions, targetModule?: TaxModuleType): Observable<T> {
    const url = this.buildUrl(endpoint, targetModule);
    return this.http.patch<T>(url, body, this.formatOptions(options));
  }

  /**
   * Peticion DELETE generica fuertemente tipada.
   */
  delete<T>(endpoint: string, options?: HttpOptions, targetModule?: TaxModuleType): Observable<T> {
    const url = this.buildUrl(endpoint, targetModule);
    return this.http.delete<T>(url, this.formatOptions(options));
  }

  /**
   * Formatea las opciones HTTP (parametros de consulta, headers, etc.)
   */
  private formatOptions(options?: HttpOptions): {
    headers?: { [header: string]: string | string[] };
    params?: HttpParams;
    withCredentials?: boolean;
  } {
    if (!options) return {};

    let params = new HttpParams();
    if (options.params) {
      Object.keys(options.params).forEach((key) => {
        const value = options.params![key];
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return {
      headers: options.headers,
      params,
      withCredentials: options.withCredentials,
    };
  }
}
