import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { of, Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { RegistrosAuthStateService } from '../auth/registros-auth-state.service';
import { RegistrosAuthService } from '../auth/registros-auth.service';
import { RegistrosTokenStorageService } from '../tokens/registros-token-storage.service';
import { ToastService } from '../../../../core/services/toast.service';

/**
 * Valida la sesión y vigencia del token JWT para el acceso a rutas protegidas.
 * Si el access token ha expirado:
 * - Si existe un refresh token, intenta refrescarlo automáticamente.
 * - Si no existe o la renovación falla, limpia el almacenamiento,
 *   alerta al usuario con un Toast y redirige al formulario de inicio de sesión correspondiente.
 */
function checkAuthAndToken(
  targetPortal: 'GOBERNACION' | 'ENTIDAD_REGISTRO' | 'ANY',
  defaultLoginRoute: string
): Observable<boolean | UrlTree> | boolean | UrlTree {
  const authState = inject(RegistrosAuthStateService);
  const tokenStorage = inject(RegistrosTokenStorageService);
  const authService = inject(RegistrosAuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  const token = tokenStorage.getAccessToken();
  const isAuth = authState.isAuthenticated();

  // Caso 1: El usuario nunca ha iniciado sesión
  if (!isAuth && !token) {
    return router.createUrlTree([defaultLoginRoute]);
  }

  // Helper para verificar el rol/portal requerido cuando el token es válido
  const checkPortalPermission = (): boolean | UrlTree => {
    if (targetPortal === 'GOBERNACION') {
      if (authState.isGobernacion()) {
        return true;
      }
      return router.createUrlTree(['/registros/entidades/solicitudes']);
    }

    if (targetPortal === 'ENTIDAD_REGISTRO') {
      if (authState.isEntidad()) {
        return true;
      }
      return router.createUrlTree(['/registros/gobernacion/dashboard']);
    }

    return true;
  };

  // Helper para limpiar sesión y mostrar alerta de expiración
  const handleExpiredSession = (): UrlTree => {
    tokenStorage.clearTokens();
    authState.clearSession();
    toast.warning('Su sesión ha expirado. Por favor ingrese sus credenciales nuevamente.');
    return router.createUrlTree([defaultLoginRoute]);
  };

  // Caso 2: El token de acceso NO ha expirado y la sesión está activa
  if (!tokenStorage.isTokenExpired(token) && isAuth) {
    return checkPortalPermission();
  }

  // Caso 3: El token de acceso ha expirado. Verificar si existe Refresh Token
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) {
    return handleExpiredSession();
  }

  // Intentar refrescar la sesión
  return authService.refreshToken().pipe(
    map(() => {
      return checkPortalPermission();
    }),
    catchError(() => {
      return of(handleExpiredSession());
    })
  );
}

/**
 * Guardia general de autenticación para el módulo de Impuesto de Registro.
 */
export const registrosAuthGuard: CanActivateFn = () => {
  return checkAuthAndToken('ANY', '/registros/entidades/login');
};

/**
 * Guardia que asegura acceso exclusivo a funcionarios de la Gobernación del Cauca
 * (Fiscalización, Rentas, Liquidación central y Parametrización).
 */
export const registrosGobernacionGuard: CanActivateFn = () => {
  return checkAuthAndToken('GOBERNACION', '/registros/gobernacion/login');
};

/**
 * Guardia que asegura acceso exclusivo a Entidades Registrales Externas
 * (Notarías, Cámaras de Comercio, Juzgados, ORIP).
 */
export const registrosEntidadesGuard: CanActivateFn = () => {
  return checkAuthAndToken('ENTIDAD_REGISTRO', '/registros/entidades/login');
};
