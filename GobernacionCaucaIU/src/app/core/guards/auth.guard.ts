import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStateService } from '../auth/auth-state.service';
import { TokenStorageService } from '../tokens/token-storage.service';

/**
 * Guardia general que valida si existe una sesión activa y token en almacenamiento.
 * Usado por módulos base/Automotores.
 */
export const authGuard: CanActivateFn = () => {
  const authState = inject(AuthStateService);
  const tokenStorage = inject(TokenStorageService);
  const router = inject(Router);

  if (authState.isAuthenticated() && tokenStorage.getAccessToken()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};

