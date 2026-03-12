import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { registerLocaleData } from '@angular/common';
import localeEsMx from '@angular/common/locales/es-MX';
import localeEn from '@angular/common/locales/en';

registerLocaleData(localeEsMx, 'es-MX');
registerLocaleData(localeEn, 'en');

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
