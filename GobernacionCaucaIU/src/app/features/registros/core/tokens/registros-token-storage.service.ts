import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class RegistrosTokenStorageService {
  private readonly ACCESS_TOKEN_KEY = 'gov_registros_access_token';
  private readonly REFRESH_TOKEN_KEY = 'gov_registros_refresh_token';

  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  setAccessToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.ACCESS_TOKEN_KEY, token);
  }

  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  setRefreshToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  setTokens(accessToken: string, refreshToken: string): void {
    this.setAccessToken(accessToken);
    this.setRefreshToken(refreshToken);
  }

  clearTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  hasTokens(): boolean {
    return !!this.getAccessToken();
  }

  /**
   * Determina si el token JWT proporcionado (o el actual en almacenamiento) ha expirado.
   * Utiliza una ventana de gracia de 5 segundos.
   */
  isTokenExpired(token?: string | null): boolean {
    const jwt = token !== undefined ? token : this.getAccessToken();
    if (!jwt) return true;

    try {
      const parts = jwt.split('.');
      if (parts.length !== 3) return true;

      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      const payload = JSON.parse(jsonPayload);
      if (!payload.exp) return false;

      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp <= (currentTime + 5);
    } catch {
      return true;
    }
  }

  /**
   * Obtiene la fecha y hora de expiración del token JWT.
   */
  getTokenExpirationDate(token?: string | null): Date | null {
    const jwt = token !== undefined ? token : this.getAccessToken();
    if (!jwt) return null;

    try {
      const parts = jwt.split('.');
      if (parts.length !== 3) return null;

      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      const payload = JSON.parse(jsonPayload);
      if (!payload.exp) return null;

      return new Date(payload.exp * 1000);
    } catch {
      return null;
    }
  }
}
