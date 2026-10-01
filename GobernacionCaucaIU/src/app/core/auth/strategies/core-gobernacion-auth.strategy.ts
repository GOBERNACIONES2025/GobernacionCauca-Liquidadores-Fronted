import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { IAuthStrategy, AuthCredentials, AuthTargetContext, AuthSessionResult } from './auth-strategy.interface';
import { AuthService } from '../auth.service';

@Injectable({
  providedIn: 'root'
})
export class CoreGobernacionAuthStrategy implements IAuthStrategy {
  readonly id = 'CORE_GOBERNACION';
  readonly name = 'Gobernación del Cauca - Portal Central / Automotores';

  private authService = inject(AuthService);

  canHandle(context: AuthTargetContext): boolean {
    // Maneja cualquier petición de Gobernación que no sea específica de Registro
    const isNotEntidad = context.portal !== 'ENTIDAD_REGISTRO';
    const isNotRegistros = (context.modulo || '').toUpperCase() !== 'REGISTROS';
    return isNotEntidad && isNotRegistros;
  }

  authenticate(credentials: AuthCredentials, context: AuthTargetContext): Observable<AuthSessionResult> {
    const targetModulo = (context.modulo || 'AUTOMOTORES').toUpperCase();

    return this.authService.login({
      usuario: credentials.usuario,
      clave: credentials.clave
    }).pipe(
      map((response): AuthSessionResult => ({
        user: response.usuario,
        modulo: response.modulo || targetModulo,
        tokens: {
          accessToken: response.accessToken,
          refreshToken: response.refreshToken
        },
        portal: 'GOBERNACION',
        apiUrl: response.apiUrl,
        rawData: response
      }))
    );
  }
}
