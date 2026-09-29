import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStateService } from '../auth/auth-state.service';
import { TokenStorageService } from '../tokens/token-storage.service';
import { ToastService } from '../services/toast.service';

/**
 * Guardia general que valida si existe una sesión activa y token en almacenamiento.
 * Usado por módulos base/Automotores.
 */
export const authGuard: CanActivateFn = () => {
  const authState = inject(AuthStateService);
  const tokenStorage = inject(TokenStorageService);
  const router = inject(Router);
  const toast = inject(ToastService);

  if (authState.isAuthenticated() && !tokenStorage.isTokenExpired()) {
    return true;
  }

  if (tokenStorage.isTokenExpired() && tokenStorage.getAccessToken()) {
    tokenStorage.clearTokens();
    authState.clearSession();
    toast.warning('Su sesión ha expirado. Por favor inicie sesión nuevamente.');
  }

  return router.createUrlTree(['/login']);
};
