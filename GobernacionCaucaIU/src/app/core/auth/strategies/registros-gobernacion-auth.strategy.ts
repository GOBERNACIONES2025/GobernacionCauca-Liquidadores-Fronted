import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { IAuthStrategy, AuthCredentials, AuthTargetContext, AuthSessionResult } from './auth-strategy.interface';
import { RegistrosAuthService } from '../../../features/registros/core/auth/registros-auth.service';

@Injectable({
  providedIn: 'root'
})
export class RegistrosGobernacionAuthStrategy implements IAuthStrategy {
  readonly id = 'REGISTROS';
  readonly name = 'Impuesto de Registro (Gobernación y Entidades)';

  private registrosAuthService = inject(RegistrosAuthService);

  canHandle(context: AuthTargetContext): boolean {
    const modulo = (context.modulo || '').toUpperCase();
    return modulo === 'REGISTROS' || !context.modulo;
  }

  authenticate(credentials: AuthCredentials, _context: AuthTargetContext): Observable<AuthSessionResult> {
    // Se envían únicamente credenciales sin forzar portalRequerido.
    // El backend valida la identidad y retorna el tipoPortal correspondiente (GOBERNACION o ENTIDAD_REGISTRO).
    return this.registrosAuthService.login({
      emailOrUsuario: credentials.usuario,
      password: credentials.clave
    }).pipe(
      map((response): AuthSessionResult => {
        const tipoPortal = response.usuario.tipoPortal || 'GOBERNACION';
        const displayName = response.usuario.entidadRegistro?.nombre || response.usuario.nombre;

        return {
          user: {
            id: response.usuario.id,
            nombre: displayName,
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
