import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { vi } from 'vitest';
import { AuthService, AuthResponse } from '@app/core/services/auth.service';
import { environment } from 'environments/environment.development';

// Payload decodes to: {"rights":["PERM_A","PERM_B"],"gender":"MALE"}
// jwt-decode only reads the payload; the fake signature is ignored.
const FAKE_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
  '.eyJyaWdodHMiOlsiUEVSTV9BIiwiUEVSTV9CIl0sImdlbmRlciI6Ik1BTEUifQ' +
  '.fake-signature';

function buildAuthResponse(expiresIn = Date.now() + 3600000, role = 'ADMIN'): AuthResponse {
  return {
    statusCode: 200,
    data: {
      user: { username: 'jmtejeda', role },
      tokens: {
        accessToken: FAKE_JWT,
        expiresIn,
        refreshToken: 'fake-refresh',
        refreshExpiresIn: Date.now() + 86400000,
        sessionId: 'session-abc',
      },
    },
    timestamp: new Date().toISOString(),
  };
}

// The Angular test runner provides a broken localStorage via --localstorage-file.
// We replace it with an in-memory stub for every test.
const _store: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string): string | null => _store[key] ?? null,
  setItem: (key: string, value: string): void => { _store[key] = value; },
  removeItem: (key: string): void => { delete _store[key]; },
  clear: (): void => { Object.keys(_store).forEach(k => delete _store[k]); },
};

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  const snackBarSpy = { open: vi.fn() };

  beforeEach(() => {
    Object.keys(_store).forEach(k => delete _store[k]);
    vi.stubGlobal('localStorage', localStorageMock);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatSnackBar, useValue: snackBarSpy },
      ],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  describe('initial state', () => {
    it('should start as not-authenticated', () => {
      expect(service.authStatus()).toBe('not-authenticated');
    });

    it('isAuthenticated should return false when no token', () => {
      expect(service.isAuthenticated()).toBe(false);
    });

    it('isLoading should return false initially', () => {
      expect(service.isLoading()).toBe(false);
    });
  });

  describe('authStatus checking', () => {
    it('should return "checking" while a login request is in-flight', () => {
      service.login({ username: 'u', password: 'p' }).subscribe();
      expect(service.authStatus()).toBe('checking');
      httpMock.expectOne(`${environment.apiBaseUrl}/auth/login`).flush(buildAuthResponse());
    });
  });

  describe('handleAuthSuccess', () => {
    it('should set authenticated status', () => {
      service.handleAuthSuccess(buildAuthResponse());
      expect(service.authStatus()).toBe('authenticated');
    });

    it('should store sessionId and refreshExpiresIn in localStorage', () => {
      service.handleAuthSuccess(buildAuthResponse());
      expect(localStorageMock.getItem('sessionId')).toBe('session-abc');
      expect(localStorageMock.getItem('refreshExpiresIn')).toBeTruthy();
    });

    it('should expose the authenticated user', () => {
      service.handleAuthSuccess(buildAuthResponse());
      const user = service.getAuthenticatedUser();
      expect(user?.username).toBe('jmtejeda');
      expect(user?.role).toBe('ADMIN');
    });

    it('should return true', () => {
      expect(service.handleAuthSuccess(buildAuthResponse())).toBe(true);
    });
  });

  describe('hasPermission', () => {
    beforeEach(() => service.handleAuthSuccess(buildAuthResponse()));

    it('should return true for a granted permission', () => {
      expect(service.hasPermission('PERM_A')).toBe(true);
      expect(service.hasPermission('PERM_B')).toBe(true);
    });

    it('should return false for a missing permission', () => {
      expect(service.hasPermission('PERM_C')).toBe(false);
    });

    it('should return true when permission is undefined', () => {
      expect(service.hasPermission(undefined)).toBe(true);
    });

    describe('superadministrator bypass', () => {
      beforeEach(() => {
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          providers: [
            AuthService,
            provideHttpClient(),
            provideHttpClientTesting(),
            { provide: MatSnackBar, useValue: snackBarSpy },
          ],
        });
        service = TestBed.inject(AuthService);
        httpMock = TestBed.inject(HttpTestingController);
        service.handleAuthSuccess(buildAuthResponse(Date.now() + 3600000, 'superadministrator'));
      });

      it('should return true for any permission', () => {
        expect(service.hasPermission('PERM_C')).toBe(true);
        expect(service.hasPermission('void:invoice')).toBe(true);
        expect(service.hasPermission('delete:everything')).toBe(true);
      });

      it('should return true when permission is undefined', () => {
        expect(service.hasPermission(undefined)).toBe(true);
      });
    });
  });

  describe('isAuthenticated', () => {
    it('should return true after handleAuthSuccess', () => {
      service.handleAuthSuccess(buildAuthResponse());
      expect(service.isAuthenticated()).toBe(true);
    });
  });

  describe('isAccessTokenExpired', () => {
    it('should return true when no token is set', () => {
      expect(service.isAccessTokenExpired()).toBe(true);
    });

    it('should return false when token expires far in the future', () => {
      service.handleAuthSuccess(buildAuthResponse(Date.now() + 3600000));
      expect(service.isAccessTokenExpired(30)).toBe(false);
    });

    it('should return true when token is about to expire within threshold', () => {
      service.handleAuthSuccess(buildAuthResponse(Date.now() + 10000));
      expect(service.isAccessTokenExpired(30)).toBe(true);
    });
  });

  describe('login', () => {
    it('should POST to /auth/login trimming credentials and return true on success', () => {
      let result: boolean | undefined;
      service.login({ username: ' user ', password: ' pass ' }).subscribe(v => (result = v));

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ username: 'user', password: 'pass' });
      req.flush(buildAuthResponse());

      expect(result).toBe(true);
    });

    it('should return false on error', () => {
      let result: boolean | undefined;
      service.login({ username: 'user', password: 'wrong' }).subscribe(v => (result = v));

      httpMock.expectOne(`${environment.apiBaseUrl}/auth/login`)
        .flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      expect(result).toBe(false);
    });
  });

  describe('logout', () => {
    it('should POST to /auth/logout and clear auth state', () => {
      service.handleAuthSuccess(buildAuthResponse());
      expect(service.authStatus()).toBe('authenticated');

      service.logout().subscribe();
      const req = httpMock.expectOne(`${environment.apiBaseUrl}/auth/logout`);
      expect(req.request.method).toBe('POST');
      req.flush(null);

      expect(service.authStatus()).toBe('not-authenticated');
      expect(service.getAccessToken()).toBeNull();
    });
  });

  describe('refreshtoken', () => {
    it('should POST to /auth/refresh and return true on success', () => {
      let result: boolean | undefined;
      service.refreshtoken().subscribe(v => (result = v));

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/auth/refresh`);
      expect(req.request.method).toBe('POST');
      req.flush(buildAuthResponse());

      expect(result).toBe(true);
      expect(service.authStatus()).toBe('authenticated');
    });

    it('should return false on error', () => {
      let result: boolean | undefined;
      service.refreshtoken().subscribe(v => (result = v));

      httpMock.expectOne(`${environment.apiBaseUrl}/auth/refresh`)
        .flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      expect(result).toBe(false);
    });
  });
});
