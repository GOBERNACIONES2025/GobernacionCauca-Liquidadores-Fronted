import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of, tap, throwError } from 'rxjs';
import {
  IAuthStrategy,
  AUTH_STRATEGIES,
  AuthCredentials,
  AuthTargetContext,
  AuthSessionResult
} from '../strategies/auth-strategy.interface';
import { AuthStateService } from '../auth-state.service';
import { TokenStorageService } from '../../tokens/token-storage.service';
import { RegistrosAuthStateService } from '../../../features/registros/core/auth/registros-auth-state.service';
import { RegistrosTokenStorageService } from '../../../features/registros/core/tokens/registros-token-storage.service';
import { RegistrosUser } from '../../../features/registros/core/auth/registros-auth.models';
import { AuthNavigationDispatcher } from './auth-navigation-dispatcher.service';
import { RegistrosGobernacionAuthStrategy } from '../strategies/registros-gobernacion-auth.strategy';
import { RegistrosEntidadesAuthStrategy } from '../strategies/registros-entidades-auth.strategy';
import { CoreGobernacionAuthStrategy } from '../strategies/core-gobernacion-auth.strategy';

@Injectable({
  providedIn: 'root'
})
export class AuthOrchestratorService {
  private injectedStrategies = inject(AUTH_STRATEGIES, { optional: true });
  private coreAuthState = inject(AuthStateService);
  private coreTokenStorage = inject(TokenStorageService);
  private registrosAuthState = inject(RegistrosAuthStateService);
  private registrosTokenStorage = inject(RegistrosTokenStorageService);
  private dispatcher = inject(AuthNavigationDispatcher);

  // Instancias por defecto para garantizar funcionamiento sin requerir registro manual en cada módulo
  private defaultStrategies: IAuthStrategy[] = [
    inject(RegistrosEntidadesAuthStrategy),
    inject(RegistrosGobernacionAuthStrategy),
    inject(CoreGobernacionAuthStrategy),
  ];

  private get strategies(): IAuthStrategy[] {
    return this.injectedStrategies && this.injectedStrategies.length > 0
      ? this.injectedStrategies
      : this.defaultStrategies;
  }

  /**
   * Ejecuta la autenticación seleccionando la estrategia apropiada según el contexto.
   * - ÚNICAMENTE si el usuario es 'admin' y la contraseña es 'admin123' a la vez:
   *   Genera la sesión de Administrador General y redirecciona al panel general ('/').
   * - Para cualquier otra credencial:
   *   Utiliza el patrón Strategy para consumir los endpoints de autenticación reales de BD.
   */
  authenticate(
    credentials: AuthCredentials,
    context: AuthTargetContext,
    returnUrl?: string | null
  ): Observable<AuthSessionResult> {
    const isMockAdmin =
      credentials.usuario?.trim().toLowerCase() === 'admin' &&
      credentials.clave === 'admin123';

    // 1. Caso exclusivo: admin y admin123 a la vez
    if (isMockAdmin) {
      const adminSession: AuthSessionResult = {
        user: {
          id: 1,
          nombre: 'Administrador Departamental',
          email: 'admin@cauca.gov.co',
          roles: ['ADMINISTRADOR', 'FUNCIONARIO', 'SUPER_ADMIN'],
        },
        modulo: 'GENERAL',
        tokens: {
          accessToken: 'mock_demo_admin_access_token',
          refreshToken: 'mock_demo_admin_refresh_token',
        },
        portal: 'GOBERNACION',
      };

      this.synchronizeSession(adminSession);
      this.dispatcher.navigatePostLogin(adminSession, returnUrl);
      return of(adminSession);
    }

    // 2. Credenciales reales de Base de Datos -> Ejecutar Strategy correspondiente
    const modulo = (context.modulo || '').toUpperCase();
    const portal = context.portal;

    if (portal === 'ENTIDAD_REGISTRO') {
      const entidadStrategy = this.defaultStrategies[0];
      return entidadStrategy.authenticate(credentials, context).pipe(
        tap((result) => {
          this.synchronizeSession(result);
          this.dispatcher.navigatePostLogin(result, returnUrl);
        })
      );
    }

    if (modulo === 'REGISTROS') {
      const registrosStrategy = this.defaultStrategies[1];
      return registrosStrategy.authenticate(credentials, context).pipe(
        tap((result) => {
          this.synchronizeSession(result);
          this.dispatcher.navigatePostLogin(result, returnUrl);
        })
      );
    }

    if (modulo === 'AUTOMOTORES' || modulo === 'DEGUELLO') {
      const coreStrategy = this.defaultStrategies[2];
      return coreStrategy.authenticate(credentials, context).pipe(
        tap((result) => {
          this.synchronizeSession(result);
          this.dispatcher.navigatePostLogin(result, returnUrl);
        })
      );
    }

    // Si es login general unificado: Probar primero la estrategia de Impuesto de Registro (5001) y luego Core (5023)
    const registrosStrategy = this.defaultStrategies[1];
    const coreStrategy = this.defaultStrategies[2];

    return registrosStrategy.authenticate(credentials, { modulo: 'REGISTROS' }).pipe(
      catchError((regErr) => {
        return coreStrategy.authenticate(credentials, { modulo: 'AUTOMOTORES' }).pipe(
          catchError(() => {
            return throwError(() => regErr);
          })
        );
      }),
      tap((result) => {
        this.synchronizeSession(result);
        this.dispatcher.navigatePostLogin(result, returnUrl);
      })
    );
  }

  /**
   * Resuelve la estrategia adecuada mediante el patrón Strategy.
   */
  public resolveStrategy(context: AuthTargetContext): IAuthStrategy {
    const found = this.strategies.find((s) => s.canHandle(context));
    if (!found) {
      // Fallback a Core Gobernación si ninguna estrategia específica responde
      return this.defaultStrategies[this.defaultStrategies.length - 1];
    }
    return found;
  }

  /**
   * Sincroniza el almacenamiento de tokens y los estados reactivos tanto en el contexto global
   * como en los Bounded Contexts específicos (ej: Impuesto de Registro).
   */
  private synchronizeSession(result: AuthSessionResult): void {
    // 1. Sincronización Global Core (AuthStateService y TokenStorageService)
    this.coreTokenStorage.setTokens(result.tokens.accessToken, result.tokens.refreshToken);
    this.coreAuthState.setSession(result.user, result.modulo, result.apiUrl);

    // 2. Sincronización específica de Registro si corresponde
    if (result.modulo === 'REGISTROS' || result.portal === 'ENTIDAD_REGISTRO') {
      this.registrosTokenStorage.setTokens(result.tokens.accessToken, result.tokens.refreshToken);

      if (result.rawData) {
        this.registrosAuthState.setSession(result.rawData as RegistrosUser);
      } else {
        // Adaptación mínima de RegistrosUser a partir del resultado
        const fallbackRegistrosUser: RegistrosUser = {
          id: result.user.id,
          nombre: result.user.nombre,
          email: result.user.email || '',
          roles: result.user.roles,
          tipoPortal: result.portal || 'GOBERNACION'
        };
        this.registrosAuthState.setSession(fallbackRegistrosUser);
      }
    }
  }

  /**
   * Cierra completamente la sesión en todos los contextos (Core + Bounded Contexts)
   * y redirige al login unificado.
   */
  logout(portalRedirect?: string): void {
    this.coreTokenStorage.clearTokens();
    this.coreAuthState.clearSession();
    this.registrosTokenStorage.clearTokens();
    this.registrosAuthState.clearSession();

    const queryParams = portalRedirect ? { portal: portalRedirect } : undefined;
    this.dispatcher.dispatchLogout(queryParams);
  }
}
