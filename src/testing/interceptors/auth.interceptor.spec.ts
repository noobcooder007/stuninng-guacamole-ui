import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { authInterceptor } from '@app/core/interceptors/auth.interceptor';
import { AuthService } from '@app/core/services/auth.service';
import { environment } from 'environments/environment.development';

const AUTH_LOGIN = `${environment.apiBaseUrl}/auth/login`;
const AUTH_REFRESH = `${environment.apiBaseUrl}/auth/refresh`;
const AUTH_LOGOUT = `${environment.apiBaseUrl}/auth/logout`;
const API_URL = `${environment.apiBaseUrl}/collectors`;

const makeToken = (extra = 3600000) => ({
  accessToken: 'my-access-token',
  expiresIn: Date.now() + extra,
});

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  const authSpy = {
    getAccessToken: vi.fn().mockReturnValue(null),
    isAccessTokenExpired: vi.fn().mockReturnValue(false),
    refreshtoken: vi.fn().mockReturnValue(of(true)),
    logout: vi.fn().mockReturnValue(of(void 0)),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    authSpy.getAccessToken.mockReturnValue(null);
    authSpy.isAccessTokenExpired.mockReturnValue(false);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authSpy },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('auth endpoints passthrough', () => {
    it('should forward /auth/login with withCredentials and no Authorization header', () => {
      http.post(AUTH_LOGIN, {}).subscribe();
      const req = httpMock.expectOne(AUTH_LOGIN);
      expect(req.request.withCredentials).toBe(true);
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    });

    it('should forward /auth/refresh without adding Authorization header', () => {
      http.post(AUTH_REFRESH, {}).subscribe();
      const req = httpMock.expectOne(AUTH_REFRESH);
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    });

    it('should forward /auth/logout without adding Authorization header', () => {
      http.post(AUTH_LOGOUT, {}).subscribe();
      const req = httpMock.expectOne(AUTH_LOGOUT);
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    });
  });

  describe('non-auth requests without token', () => {
    it('should NOT add Authorization header when no token exists', () => {
      authSpy.getAccessToken.mockReturnValue(null);
      http.get(API_URL).subscribe();
      const req = httpMock.expectOne(API_URL);
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush([]);
    });
  });

  describe('non-auth requests with valid token', () => {
    it('should add Authorization header with Bearer token', () => {
      authSpy.getAccessToken.mockReturnValue(makeToken());
      authSpy.isAccessTokenExpired.mockReturnValue(false);
      http.get(API_URL).subscribe();
      const req = httpMock.expectOne(API_URL);
      expect(req.request.headers.get('Authorization')).toBe('Bearer my-access-token');
      req.flush([]);
    });
  });

  describe('preemptive refresh (token about to expire)', () => {
    it('should trigger refreshtoken before sending when token is expiring', () => {
      authSpy.getAccessToken
        .mockReturnValueOnce(makeToken(10000))  // first call: token exists (expiring)
        .mockReturnValue(makeToken());           // subsequent: new token after refresh
      authSpy.isAccessTokenExpired.mockReturnValue(true);
      authSpy.refreshtoken.mockReturnValue(of(true));

      http.get(API_URL).subscribe();
      expect(authSpy.refreshtoken).toHaveBeenCalled();
      const req = httpMock.expectOne(API_URL);
      req.flush([]);
    });
  });

  describe('reactive refresh on 401', () => {
    it('should trigger refreshtoken and retry when server returns 401', () => {
      authSpy.getAccessToken
        .mockReturnValueOnce(makeToken())  // initial: valid token
        .mockReturnValue(makeToken());     // after refresh: new token
      authSpy.isAccessTokenExpired.mockReturnValue(false);
      authSpy.refreshtoken.mockReturnValue(of(true));

      http.get(API_URL).subscribe();
      const req = httpMock.expectOne(API_URL);
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      expect(authSpy.refreshtoken).toHaveBeenCalled();
      // After refresh, the request is retried
      const retryReq = httpMock.expectOne(API_URL);
      retryReq.flush([]);
    });

    it('should pass through non-401 errors without triggering refresh', () => {
      authSpy.getAccessToken.mockReturnValue(makeToken());
      authSpy.isAccessTokenExpired.mockReturnValue(false);

      http.get(API_URL).subscribe({ error: () => {} });
      const req = httpMock.expectOne(API_URL);
      req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });

      expect(authSpy.refreshtoken).not.toHaveBeenCalled();
    });
  });
});
