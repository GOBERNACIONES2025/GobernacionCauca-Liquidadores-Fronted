import { Injectable, signal, computed } from '@angular/core';
import { RegistrosUser, EntidadRegistroContext, MunicipioContext, DepartamentoContext } from './registros-auth.models';

@Injectable({
  providedIn: 'root'
})
export class RegistrosAuthStateService {
  private readonly STORAGE_KEY = 'gov_registros_user';

  // Reactive state using Angular 19 Signals
  readonly currentUser = signal<RegistrosUser | null>(this.loadStoredUser());

  // Computed signals for reactive views
  readonly isAuthenticated = computed(() => this.currentUser() !== null);

  readonly isGobernacion = computed(() => {
    const user = this.currentUser();
    return user !== null && user.tipoPortal === 'GOBERNACION';
  });

  readonly isEntidad = computed(() => {
    const user = this.currentUser();
    return user !== null && user.tipoPortal === 'ENTIDAD_REGISTRO';
  });

  readonly currentEntidad = computed<EntidadRegistroContext | null>(() => {
    return this.currentUser()?.entidadRegistro || null;
  });

  readonly currentMunicipio = computed<MunicipioContext | null>(() => {
    return this.currentUser()?.municipio || null;
  });

  readonly currentDepartamento = computed<DepartamentoContext | null>(() => {
    return this.currentUser()?.departamento || null;
  });

  /**
   * Guarda y actualiza la sesión activa del usuario para Impuesto de Registro.
   */
  setSession(user: RegistrosUser): void {
    this.currentUser.set(user);
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
    } catch (err) {
      console.error('Error saving Registros user session to localStorage:', err);
    }
  }

  /**
   * Limpia la sesión del usuario en Impuesto de Registro.
   */
  clearSession(): void {
    this.currentUser.set(null);
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (err) {
      console.error('Error clearing Registros user session from localStorage:', err);
    }
  }

  private loadStoredUser(): RegistrosUser | null {
    try {
      if (typeof window === 'undefined') return null;
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as RegistrosUser;
      }
      return null;
    } catch {
      return null;
    }
  }
}
