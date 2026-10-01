import { ApplicationConfig, provideBrowserGlobalErrorListeners, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeEsCo from '@angular/common/locales/es-CO';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { registrosAuthInterceptor } from './features/registros/core/interceptors/registros-auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { AUTH_STRATEGIES } from './core/auth/strategies/auth-strategy.interface';
import { RegistrosEntidadesAuthStrategy } from './core/auth/strategies/registros-entidades-auth.strategy';
import { RegistrosGobernacionAuthStrategy } from './core/auth/strategies/registros-gobernacion-auth.strategy';
import { CoreGobernacionAuthStrategy } from './core/auth/strategies/core-gobernacion-auth.strategy';

registerLocaleData(localeEsCo);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor, registrosAuthInterceptor, errorInterceptor])
    ),
    { provide: LOCALE_ID, useValue: 'es-CO' },
    { provide: AUTH_STRATEGIES, useClass: RegistrosEntidadesAuthStrategy, multi: true },
    { provide: AUTH_STRATEGIES, useClass: RegistrosGobernacionAuthStrategy, multi: true },
    { provide: AUTH_STRATEGIES, useClass: CoreGobernacionAuthStrategy, multi: true },
  ]
};
