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
   * Si las credenciales corresponden a admin/admin123 o módulo GENERAL, se redirecciona al panel general ('/').
   * Si las credenciales provienen de BD, se envían a su respectivo módulo según la estrategia y el perfil.
   */
  async navigatePostLogin(session: AuthSessionResult, returnUrl?: string | null): Promise<boolean> {
    const modulo = (session.modulo || '').toUpperCase();

    // 1. Caso Administrador General (admin/admin123 o módulo GENERAL): Redirigir al Panel General
    const isGeneralAdmin =
      modulo === 'GENERAL' ||
      session.user?.email === 'admin@cauca.gov.co' ||
      session.user?.roles?.includes('SUPER_ADMIN');

    if (isGeneralAdmin && (!returnUrl || returnUrl === '/' || returnUrl === '/login')) {
      return this.router.navigate(['/']);
    }

    // 2. Si se solicitó una URL específica previa válida
    if (returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('/login') && returnUrl !== '/') {
      return this.router.navigateByUrl(returnUrl);
    }

    // 3. Caso Entidades de Registro Externas (Notarías, Cámaras, Juzgados, ORIP)
    if (session.portal === 'ENTIDAD_REGISTRO') {
      return this.router.navigate(['/registros/entidades/solicitudes']);
    }

    // 4. Caso Funcionarios / Usuarios por Renta o Módulo desde BD (Strategy)
    switch (modulo) {
      case 'REGISTROS':
        return this.router.navigate(['/registros/gobernacion/dashboard']);
      case 'AUTOMOTORES':
        return this.router.navigate(['/automotores/dashboard']);
      case 'DEGUELLO':
        return this.router.navigate(['/deguello/dashboard']);
      case 'PASAPORTES':
        return this.router.navigate(['/pasaportes/admin']);
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
