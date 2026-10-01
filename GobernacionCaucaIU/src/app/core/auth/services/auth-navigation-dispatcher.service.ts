import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthSessionResult } from '../strategies/auth-strategy.interface';

@Injectable({
  providedIn: 'root'
})
export class AuthNavigationDispatcher {
  private router = inject(Router);

  /**
   * Resuelve y ejecuta la navegación posterior a un inicio de sesión exitoso.
   * Prioriza returnUrl si existe; en caso contrario, deriva a la vista principal
   * según la renta o el tipo de entidad.
   */
  async navigatePostLogin(session: AuthSessionResult, returnUrl?: string | null): Promise<boolean> {
    if (returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('/login')) {
      return this.router.navigateByUrl(returnUrl);
    }

    // Caso 1: Entidades de Registro Externas (Notarías, Cámaras, Juzgados, ORIP)
    if (session.portal === 'ENTIDAD_REGISTRO') {
      return this.router.navigate(['/registros/entidades/solicitudes']);
    }

    // Caso 2: Funcionarios de la Gobernación por Renta
    const modulo = (session.modulo || '').toUpperCase();
    switch (modulo) {
      case 'REGISTROS':
        return this.router.navigate(['/registros/gobernacion/dashboard']);
      case 'AUTOMOTORES':
        return this.router.navigate(['/automotores/dashboard']);
      case 'DEGUELLO':
        return this.router.navigate(['/deguello/dashboard']);
      default:
        return this.router.navigate(['/']);
    }
  }

  /**
   * Resuelve y ejecuta la navegación tras el cierre de sesión unificado.
   */
  async dispatchLogout(queryParams?: Record<string, string>): Promise<boolean> {
    return this.router.navigate(['/login'], { queryParams });
  }
}
