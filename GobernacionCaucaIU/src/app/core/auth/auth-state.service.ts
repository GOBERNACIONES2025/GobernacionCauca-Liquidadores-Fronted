import { Injectable, signal, computed } from '@angular/core';
import { User, TaxModuleType } from './auth.models';

@Injectable({
  providedIn: 'root',
})
export class AuthStateService {
  // Estado reactivo central con Angular Signals
  readonly currentUser = signal<User | null>(this.loadStoredUser());
  readonly currentModulo = signal<TaxModuleType | null>(this.loadStoredModulo());

  // Mapa de URLs base por cada módulo de impuesto
  // Se configura la API en HTTPS (puerto 7250) y HTTP (puerto 5023)
  readonly moduleApiUrls = signal<Record<string, string>>({
    LOGIN: 'https://localhost:7250/api',
    AUTOMOTORES: 'http://localhost:5023/api',
    REGISTROS: 'http://192.168.25.153:5098/api/v1',
  });

  // Signal computado para verificar si hay sesión activa
  readonly isAuthenticated = computed(() => this.currentUser() !== null);

  //* Registra o actualiza la URL base de un módulo específico
  registerModuleUrl(modulo: string, url: string): void {
    const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
    this.moduleApiUrls.update((urls) => ({
      ...urls,
      [modulo.toUpperCase()]: cleanUrl,
    }));
  }

  /**
   * Establece la sesión del usuario y configura la URL retornada por el Login
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

  // Cambia el módulo activo actual
  setActiveModulo(modulo: TaxModuleType): void {
    this.currentModulo.set(modulo);
    localStorage.setItem('gov_modulo', modulo);
  }

  /**
   * Obtiene la Base URL para un impuesto o módulo específico.
   * Si no se indica módulo, toma la Base URL del módulo activo actual.
   */
  getApiUrl(modulo?: TaxModuleType): string {
    const targetModulo = (modulo || this.currentModulo() || 'AUTOMOTORES').toUpperCase();
    const urls = this.moduleApiUrls();

    if (urls[targetModulo]) {
      return urls[targetModulo];
    }

    // Intentar cargar desde localStorage si fue guardado previamente y es válido
    const storedUrl = localStorage.getItem(`gov_api_url_${targetModulo}`);
    if (storedUrl && !storedUrl.includes('5000')) {
      this.registerModuleUrl(targetModulo, storedUrl);
      return storedUrl;
    }

    // Retornar fallback base HTTPS puerto 7250
    return urls['AUTOMOTORES'] || urls['LOGIN'] || 'https://localhost:7250/api';
  }

  /**
   * Limpia el estado de la sesión
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
