import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { IAuthStrategy, AuthCredentials, AuthTargetContext, AuthSessionResult } from './auth-strategy.interface';
import { RegistrosAuthService } from '../../../features/registros/core/auth/registros-auth.service';

@Injectable({
  providedIn: 'root'
})
export class RegistrosEntidadesAuthStrategy implements IAuthStrategy {
  readonly id = 'REGISTROS_ENTIDADES';
  readonly name = 'Entidades de Registro Externas (Notarías, Cámaras, Juzgados, ORIP)';

  private registrosAuthService = inject(RegistrosAuthService);

  canHandle(context: AuthTargetContext): boolean {
    return context.portal === 'ENTIDAD_REGISTRO';
  }

  authenticate(credentials: AuthCredentials, _context: AuthTargetContext): Observable<AuthSessionResult> {
    return this.registrosAuthService.login({
      emailOrUsuario: credentials.usuario,
      password: credentials.clave
    }).pipe(
      map((response): AuthSessionResult => {
        const tipoPortal = response.usuario.tipoPortal || 'ENTIDAD_REGISTRO';
        return {
          user: {
            id: response.usuario.id,
            nombre: response.usuario.entidadRegistro?.nombre || response.usuario.nombre,
            email: response.usuario.email,
            roles: response.usuario.roles || [response.usuario.rol || tipoPortal]
          },
          modulo: 'REGISTROS',
          tokens: {
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            expiresAt: response.expiresAt
          },
          portal: tipoPortal,
          rawData: response.usuario
        };
      })
    );
  }
}
