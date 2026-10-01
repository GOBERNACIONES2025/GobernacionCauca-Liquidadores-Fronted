import { HttpErrorResponse, HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { RegistrosTokenStorageService } from '../tokens/registros-token-storage.service';
import { RegistrosAuthService } from '../auth/registros-auth.service';
import { RegistrosAuthStateService } from '../auth/registros-auth-state.service';
import { ToastService } from '../../../../core/services/toast.service';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

/**
 * Interceptor HTTP exclusivo para el Bounded Context de Impuesto de Registro.
 * Solo procesa peticiones dirigidas al backend de Registros (puerto 5001 o /api/v1/).
 * Administra la inyección de token y la rotación criptográfica ante errores 401.
 */
export const registrosAuthInterceptor: HttpInterceptorFn = (req, next) => {
  // Ignorar cualquier petición que NO pertenezca a la API de Registros
  const isRegistrosRequest = req.url.includes(':5001') || req.url.includes('/api/v1/');
  if (!isRegistrosRequest) {
    return next(req);
  }

  // Excluir endpoints públicos de autenticación para evitar bucles
  const urlLower = req.url.toLowerCase();
  const isAuthEndpoint =
    urlLower.includes('/auth/login') ||
    urlLower.includes('/auth/refresh-token') ||
    urlLower.includes('/auth/logout');

  if (isAuthEndpoint) {
    return next(req);
  }

  const tokenStorage = inject(RegistrosTokenStorageService);
  const authService = inject(RegistrosAuthService);
  const authState = inject(RegistrosAuthStateService);
  const router = inject(Router);
  const toast = inject(ToastService);

  const token = tokenStorage.getAccessToken();
  let authReq = req;

  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(authReq).pipe(
    catchError((error) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        return handleRegistros401(authReq, next, tokenStorage, authService, authState, router, toast);
      }
      return throwError(() => error);
    })
  );
};

function handleRegistros401(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  tokenStorage: RegistrosTokenStorageService,
  authService: RegistrosAuthService,
  authState: RegistrosAuthStateService,
  router: Router,
  toast: ToastService
) {
  // Determinar portal de destino antes de limpiar el estado
  const isEntidad = authState.isEntidad() || router.url.includes('/entidades');
  const targetLoginRoute = isEntidad ? '/registros/entidades/login' : '/registros/gobernacion/login';

  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) {
      isRefreshing = false;
      tokenStorage.clearTokens();
      authState.clearSession();
      toast.warning('Su sesión ha expirado. Por favor ingrese sus credenciales nuevamente.');
      router.navigate([targetLoginRoute]);
      return throwError(() => new Error('Sesión de Impuesto de Registro expirada'));
    }

    return authService.refreshToken().pipe(
      switchMap((authResponse) => {
        isRefreshing = false;
        const newAccessToken = authResponse.accessToken;
        refreshTokenSubject.next(newAccessToken);

        return next(
          req.clone({
            setHeaders: {
              Authorization: `Bearer ${newAccessToken}`,
            },
          })
        );
      }),
      catchError((err) => {
        isRefreshing = false;
        tokenStorage.clearTokens();
        authState.clearSession();
        toast.warning('Su sesión ha expirado. Por favor ingrese sus credenciales nuevamente.');
        router.navigate([targetLoginRoute]);
        return throwError(() => err);
      })
    );
  }

  // Si ya hay un proceso de refresco activo, esperar a que emita el nuevo token
  return refreshTokenSubject.pipe(
    filter((token) => token !== null),
    take(1),
    switchMap((newToken) => {
      return next(
        req.clone({
          setHeaders: {
            Authorization: `Bearer ${newToken}`,
          },
        })
      );
    })
  );
}
