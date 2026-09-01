import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStateService } from '../../../../core/auth/auth-state.service';

export const pasaportesAdminGuard: CanActivateFn = () => {
  const authState = inject(AuthStateService);
  const router = inject(Router);
  return authState.isAuthenticated() ? true : router.createUrlTree(['/login']);
};

