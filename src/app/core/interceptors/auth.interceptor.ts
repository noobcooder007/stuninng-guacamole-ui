import {
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from 'environments/environment';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { AuthService } from '@app/core/services/auth.service';

const AUTH_ENDPOINTS = [
  `${environment.apiBaseUrl}/auth/login`,
  `${environment.apiBaseUrl}/auth/refresh`,
  `${environment.apiBaseUrl}/auth/logout`,
];

let isRefreshing = false;
const refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> => {
  const authService = inject(AuthService);

  // 1. Excluir endpoints de auth para evitar bucles infinitos
  if (AUTH_ENDPOINTS.some(url => req.url.includes(url))) {
    return next(req.clone({ withCredentials: true }));
  }

  // 2. Lógica PREVENTIVA: ¿El token va a expirar pronto?
  // Usamos un margen de 30 segundos (threshold)
  if (authService.getAccessToken() && authService.isAccessTokenExpired(30)) {
    return handle401Error(req, next, authService); // Disparamos el refresco antes de la petición
  }

  // 3. Si el token parece válido, procedemos
  let request = req.clone({ withCredentials: true });
  const token = authService.getAccessToken()?.accessToken;
  if (token) {
    request = addTokenHeader(request, token);
  }

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      // 4. Lógica REACTIVA: Si falló la predicción del frontend y el server dio 401
      if (error.status === 401) {
        return handle401Error(request, next, authService);
      }
      return throwError(() => error);
    })
  );
};

function addTokenHeader(request: HttpRequest<any>, token: string) {
  return request.clone({
    setHeaders: { Authorization: `Bearer ${token}` }
  });
}

function handle401Error(request: HttpRequest<any>, next: HttpHandlerFn, authService: AuthService) {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return authService.refreshtoken().pipe( // Usamos el método que creamos antes
      switchMap(() => {
        isRefreshing = false;
        const newAccessToken = authService.getAccessToken()?.accessToken;
        refreshTokenSubject.next(newAccessToken);
        
        return next(addTokenHeader(request, newAccessToken!));
      }),
      catchError((err) => {
        isRefreshing = false;
        authService.logout();
        return throwError(() => err);
      })
    );
  } else {
    // Si ya hay un refresco en curso, esperamos al nuevo token
    return refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(token => next(addTokenHeader(request, token)))
    );
  }
}
