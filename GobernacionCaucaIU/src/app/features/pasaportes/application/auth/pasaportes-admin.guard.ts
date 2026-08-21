import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PasaportesAdminAuthService } from './pasaportes-admin-auth.service';

export const pasaportesAdminGuard: CanActivateFn = () => {
  const auth = inject(PasaportesAdminAuthService);
  const router = inject(Router);
  return auth.isAuthenticated() ? true : router.createUrlTree(['/pasaportes/admin/login']);
};
