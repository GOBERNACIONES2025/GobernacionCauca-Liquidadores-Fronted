import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { TokenStorageService } from '../tokens/token-storage.service';
import { AuthStateService } from '../auth/auth-state.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const tokenStorage = inject(TokenStorageService);
  const authState = inject(AuthStateService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Token expirado o invalido: Limpiar estado y redirigir al login
        tokenStorage.clearTokens();
        authState.clearSession();
        router.navigate(['/login']);
      } else if (error.status === 403) {
        console.error('Acceso denegado al recurso:', req.url);
      }

      return throwError(() => error);
    })
  );
};
