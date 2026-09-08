import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';

export interface PasaportesAdminLoginResult {
  success: boolean;
  message?: string;
}

// Credenciales exclusivamente temporales para la demostración frontend.
const DEMO_CREDENTIALS = {
  username: 'admin@cauca.gov.co',
  password: 'Admin123*',
} as const;

const SESSION_KEY = 'pasaportes_admin_authenticated';

@Injectable({ providedIn: 'root' })
export class PasaportesAdminAuthService {
  constructor(private readonly router: Router) {}

  login(username: string, password: string, remember: boolean): Observable<PasaportesAdminLoginResult> {
    const isValid =
      username.trim().toLowerCase() === DEMO_CREDENTIALS.username &&
      password === DEMO_CREDENTIALS.password;

    if (!isValid) {
      return of({ success: false, message: 'Usuario o contraseña incorrectos.' });
    }

    this.clearSession();
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem(SESSION_KEY, 'true');
    return of({ success: true });
  }

  isAuthenticated(): boolean {
    return sessionStorage.getItem(SESSION_KEY) === 'true' || localStorage.getItem(SESSION_KEY) === 'true';
  }

  logout(destination: 'login' | 'liquidadores' = 'login'): void {
    this.clearSession();
    const commands = destination === 'liquidadores' ? ['/'] : ['/pasaportes/admin/login'];
    void this.router.navigate(commands);
  }

  private clearSession(): void {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
  }
}
