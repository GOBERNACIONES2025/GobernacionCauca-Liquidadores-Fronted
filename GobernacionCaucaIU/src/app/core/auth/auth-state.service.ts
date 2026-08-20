import { Injectable, signal, computed } from '@angular/core';
import { User, TaxModuleType } from './auth.models';

@Injectable({
  providedIn: 'root',
})
export class AuthStateService {
  // Estado reactivo central con Angular Signals
  readonly currentUser = signal<User | null>(this.loadStoredUser());
  readonly currentModulo = signal<TaxModuleType | null>(this.loadStoredModulo());

  // Mapa de URLs base por cada modulo de impuesto
  //Acá están las rutas bases de las apis by impuesto`
  readonly moduleApiUrls = signal<Record<string, string>>({
    LOGIN: 'http://localhost:5000/api',
    AUTOMOTORES: 'https://localhost:7250/api',
    REGISTROS: 'http://localhost:5098/api/v1',
  });

  // Signal computado para verificar si hay sesion activa
  readonly isAuthenticated = computed(() => this.currentUser() !== null);

  //* Registra o actualiza la URL base de un modulo especifico (ej: retornado por el Login API)
  registerModuleUrl(modulo: string, url: string): void {
    const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
    this.moduleApiUrls.update((urls) => ({
      ...urls,
      [modulo.toUpperCase()]: cleanUrl,
    }));
  }

  /**
   * Establece la sesion del usuario y configura la URL retornada por el Login para su impuesto
   */
  setSession(user: User, modulo: TaxModuleType, apiUrl?: string): void {
    this.currentUser.set(user);
    this.currentModulo.set(modulo);

    localStorage.setItem('gov_user', JSON.stringify(user));
    localStorage.setItem('gov_modulo', modulo);

    if (apiUrl) {
      this.registerModuleUrl(modulo, apiUrl);
      localStorage.setItem(`gov_api_url_${modulo.toUpperCase()}`, apiUrl);
    }
  }

  // Cambia el modulo activo actual
  setActiveModulo(modulo: TaxModuleType): void {
    this.currentModulo.set(modulo);
    localStorage.setItem('gov_modulo', modulo);
  }

  /**
   * Obtiene la Base URL para un impuesto o modulo especifico.
   * Si no se indica modulo, toma la Base URL del modulo activo actual.
   */
  getApiUrl(modulo?: TaxModuleType): string {
    const targetModulo = (modulo || this.currentModulo() || 'LOGIN').toUpperCase();
    const urls = this.moduleApiUrls();

    if (urls[targetModulo]) {
      return urls[targetModulo];
    }

    // Intentar cargar desde localStorage si fue guardado previamente
    const storedUrl = localStorage.getItem(`gov_api_url_${targetModulo}`);
    if (storedUrl) {
      this.registerModuleUrl(targetModulo, storedUrl);
      return storedUrl;
    }

    // Retornar fallback base o la URL de LOGIN si no se encuentra
    return urls['LOGIN'] || '';
  }

  /**
   * Limpia el estado de la sesion
   */
  clearSession(): void {
    this.currentUser.set(null);
    this.currentModulo.set(null);
    localStorage.removeItem('gov_user');
    localStorage.removeItem('gov_modulo');
  }

  private loadStoredUser(): User | null {
    try {
      const stored = localStorage.getItem('gov_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  private loadStoredModulo(): TaxModuleType | null {
    return localStorage.getItem('gov_modulo');
  }
}
