import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of, map } from 'rxjs';
import { RegistrosAuthStateService } from './registros-auth-state.service';
import { RegistrosLoginRequest, RegistrosAuthResponse, RegistrosUser } from './registros-auth.models';
import { RegistrosTokenStorageService } from '../tokens/registros-token-storage.service';
import { AuthStateService } from '../../../../core/auth/auth-state.service';

@Injectable({
  providedIn: 'root'
})
export class RegistrosAuthService {
  private http = inject(HttpClient);
  private registrosAuthState = inject(RegistrosAuthStateService);
  private coreAuthState = inject(AuthStateService);
  private tokenStorage = inject(RegistrosTokenStorageService);

  private get baseUrl(): string {
    return `${this.coreAuthState.getApiUrl('REGISTROS')}/auth`;
  }

  /**
   * Realiza la autenticación en el endpoint de Impuesto de Registro (puerto 5001).
   * Almacena los tokens JWT y configura la sesión de usuario y contexto territorial.
   */
  login(credentials: RegistrosLoginRequest): Observable<RegistrosAuthResponse> {
    return this.http.post<any>(`${this.baseUrl}/login`, credentials).pipe(
      map((res) => (res && res.data ? res.data : res) as RegistrosAuthResponse),
      tap((response) => {
        this.tokenStorage.setTokens(response.accessToken, response.refreshToken);
        this.registrosAuthState.setSession(response.usuario);
      })
    );
  }

  /**
   * Refresca el token de acceso cuando expire utilizando el refresh token.
   */
  refreshToken(): Observable<RegistrosAuthResponse> {
    const refreshToken = this.tokenStorage.getRefreshToken();
    return this.http.post<any>(`${this.baseUrl}/refresh-token`, { refreshToken }).pipe(
      map((res) => (res && res.data ? res.data : res) as RegistrosAuthResponse),
      tap((response) => {
        this.tokenStorage.setTokens(response.accessToken, response.refreshToken);
        if (response.usuario) {
          this.registrosAuthState.setSession(response.usuario);
        }
      })
    );
  }

  /**
   * Obtiene los datos del perfil actual del usuario autenticado en Registros.
   */
  getMe(): Observable<RegistrosUser> {
    return this.http.get<any>(`${this.baseUrl}/me`).pipe(
      map((res) => (res && res.data ? res.data : res) as RegistrosUser),
      tap((user) => {
        this.registrosAuthState.setSession(user);
      })
    );
  }

  /**
   * Cierra la sesión activa en el portal de Registros y limpia almacenamiento.
   */
  logout(): void {
    const refreshToken = this.tokenStorage.getRefreshToken();
    if (refreshToken) {
      this.http.post(`${this.baseUrl}/logout`, { refreshToken })
        .pipe(catchError(() => of(null)))
        .subscribe();
    }

    this.tokenStorage.clearTokens();
    this.registrosAuthState.clearSession();
  }
}

