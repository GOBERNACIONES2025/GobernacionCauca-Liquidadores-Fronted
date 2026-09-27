import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RegistrosAuthStateService } from '../auth/registros-auth-state.service';
import { RegistrosTokenStorageService } from '../tokens/registros-token-storage.service';

/**
 * Guardia general de autenticación para el módulo de Impuesto de Registro.
 */
export const registrosAuthGuard: CanActivateFn = () => {
  const authState = inject(RegistrosAuthStateService);
  const tokenStorage = inject(RegistrosTokenStorageService);
  const router = inject(Router);

  if (authState.isAuthenticated() && tokenStorage.getAccessToken()) {
    return true;
  }

  return router.createUrlTree(['/registros/gobernacion/login']);
};

/**
 * Guardia que asegura acceso exclusivo a funcionarios de la Gobernación del Cauca
 * (Fiscalización, Rentas, Liquidación central y Parametrización).
 */
export const registrosGobernacionGuard: CanActivateFn = () => {
  const authState = inject(RegistrosAuthStateService);
  const tokenStorage = inject(RegistrosTokenStorageService);
  const router = inject(Router);

  if (authState.isAuthenticated() && tokenStorage.getAccessToken()) {
    if (authState.isGobernacion()) {
      return true;
    }
    // Si es un usuario de entidad registral intentando entrar a gobernación, enviarlo a su panel
    return router.createUrlTree(['/registros/entidades/solicitudes']);
  }

  return router.createUrlTree(['/registros/gobernacion/login']);
};

/**
 * Guardia que asegura acceso exclusivo a Entidades Registrales Externas
 * (Notarías, Cámaras de Comercio, ORIP).
 */
export const registrosEntidadesGuard: CanActivateFn = () => {
  const authState = inject(RegistrosAuthStateService);
  const tokenStorage = inject(RegistrosTokenStorageService);
  const router = inject(Router);

  if (authState.isAuthenticated() && tokenStorage.getAccessToken()) {
    if (authState.isEntidad()) {
      return true;
    }
    // Si es un funcionario de gobernación intentando entrar al panel de entidades, enviarlo a su dashboard
    return router.createUrlTree(['/registros/gobernacion/dashboard']);
  }

  return router.createUrlTree(['/registros/entidades/login']);
};
