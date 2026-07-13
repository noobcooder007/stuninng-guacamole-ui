import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideAppInitializer, isDevMode, LOCALE_ID, inject } from '@angular/core';
import { provideRouter } from '@angular/router';

import { provideServiceWorker } from '@angular/service-worker';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { SoundFeedbackService } from './core/services/sound-feedback.service';

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
    {
      provide: LOCALE_ID,
      useFactory: getLanguage
    },
    provideAppInitializer(() => inject(SoundFeedbackService).bind()),
  ]
};
