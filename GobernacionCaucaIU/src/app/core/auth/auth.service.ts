import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { LoginRequest, LoginResponse } from './auth.models';
import { AuthStateService } from './auth-state.service';
import { TokenStorageService } from '../tokens/token-storage.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private authState = inject(AuthStateService);
  private tokenStorage = inject(TokenStorageService);

  /**
   * Realiza el login en la API de autenticacion y orquestacion.
   * Guarda los tokens y configura el modulo asignado con su API URL.
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    const loginApiUrl = `${this.authState.getApiUrl('LOGIN')}/auth/login`;

    return this.http.post<LoginResponse>(loginApiUrl, credentials).pipe(
      tap((response) => {
        // Almacenar Tokens
        this.tokenStorage.setTokens(response.accessToken, response.refreshToken);

        // Guardar estado del usuario, modulo asignado y su API URL correspondiente
        this.authState.setSession(
          response.usuario,
          response.modulo,
          response.apiUrl
        );
      })
    );
  }

  /**
   * Cierra la sesion del usuario limpiando tokens y estado reactivo.
   */
  logout(): void {
    this.tokenStorage.clearTokens();
    this.authState.clearSession();
  }
}
