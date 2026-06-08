import { ApplicationConfig, provideBrowserGlobalErrorListeners, isDevMode, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';

import { provideServiceWorker } from '@angular/service-worker';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { SpanishPaginatorIntl } from './core/services/paginator-intl.service';

export function getLanguage() {
  return localStorage.getItem('user_lang') || 'es-MX';
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    }),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideNativeDateAdapter(),
    {
      provide: LOCALE_ID,
      useFactory: getLanguage
    },
    {
      provide: MAT_DATE_LOCALE,
      useValue: 'es-MX'
    },
    {
      provide: MatPaginatorIntl,
      useClass: SpanishPaginatorIntl
    },
  ]
};
