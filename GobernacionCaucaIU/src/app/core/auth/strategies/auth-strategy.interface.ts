import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { TaxModuleType, User } from '../auth.models';

export type AuthTargetProfile = 'GOBERNACION' | 'ENTIDAD_REGISTRO';

export interface AuthCredentials {
  usuario: string;
  clave: string;
}

export interface AuthTargetContext {
  modulo?: TaxModuleType | string;
  portal?: AuthTargetProfile;
}

export interface AuthSessionResult {
  user: User;
  modulo: TaxModuleType;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresAt?: string;
  };
  portal?: AuthTargetProfile;
  apiUrl?: string;
  rawData?: unknown;
}

export interface IAuthStrategy {
  readonly id: string;
  readonly name: string;
  canHandle(context: AuthTargetContext): boolean;
  authenticate(credentials: AuthCredentials, context: AuthTargetContext): Observable<AuthSessionResult>;
}

export const AUTH_STRATEGIES = new InjectionToken<IAuthStrategy[]>('AUTH_STRATEGIES');
