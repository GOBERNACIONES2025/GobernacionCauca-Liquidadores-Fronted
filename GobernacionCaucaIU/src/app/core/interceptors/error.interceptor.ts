import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { TokenStorageService } from '../tokens/token-storage.service';
import { AuthStateService } from '../auth/auth-state.service';
import { ToastService } from '../services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const tokenStorage = inject(TokenStorageService);
  const authState = inject(AuthStateService);
  const toastService = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // 1. Manejo de Errores de Validación o Dominio (400)
      if (error.status === 400 || error.status === 422) {
        const apiError = error.error;
        if (apiError && typeof apiError === 'object') {
          // Extraer mensaje directo (como en el endpoint de simulación)
          const message = apiError.Message || apiError.message || apiError.detail || apiError.title;
          if (message) {
            toastService.error(message);
          } else if (apiError.errors) {
            // Manejo de FluentValidation / ASP.NET ValidationProblemDetails
            const validationErrors = Object.values(apiError.errors).flat().join('\n');
            toastService.error(validationErrors || 'Error de validación.');
          } else {
            toastService.error('Error procesando la solicitud. Verifique los datos.');
          }
        } else {
           toastService.error('Error procesando la solicitud. Verifique los datos.');
        }
      } 
      // 2. Errores de Autenticación / Autorización (401, 403)
      else if (error.status === 401) {
        // Token expirado o invalido: Limpiar estado y redirigir al login
        tokenStorage.clearTokens();
        authState.clearSession();
        toastService.warning('Su sesión ha expirado.');
        router.navigate(['/login']);
      } else if (error.status === 403) {
        toastService.error('No tiene permisos para realizar esta acción.');
        console.error('Acceso denegado al recurso:', req.url);
      } 
      // 3. Errores de Servidor (500)
      else if (error.status === 500) {
        toastService.error('Ocurrió un error en el servidor. Intente nuevamente.');
      } 
      // 4. Errores de red o de conexión (0)
      else if (error.status === 0) {
        toastService.error('Error de conexión con el servidor.');
      }

      return throwError(() => error);
    })
  );
};
