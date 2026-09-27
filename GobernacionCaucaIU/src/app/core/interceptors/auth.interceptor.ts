import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenStorageService } from '../tokens/token-storage.service';

/**
 * Interceptor de autenticación genérico para módulos base (Automotores, Pasaportes, etc.).
 * Inyecta el token Bearer general. Omite peticiones del módulo de Impuesto de Registro
 * para no interferir con su propio interceptor y ciclo de vida de tokens.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Si la petición pertenece al Impuesto de Registro, se delega a su propio interceptor
  if (req.url.includes(':5001') || req.url.includes('/api/v1/')) {
    return next(req);
  }

  const tokenStorage = inject(TokenStorageService);
  const token = tokenStorage.getAccessToken();

  if (token) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
    return next(authReq);
  }

  return next(req);
};


