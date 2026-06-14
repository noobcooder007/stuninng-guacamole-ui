import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { of } from 'rxjs';
import { lastValueFrom, Observable } from 'rxjs';
import { vi } from 'vitest';
import { authGuard } from '@app/core/guards/auth.guard';
import { AuthService } from '@app/core/services/auth.service';

const mockRoute = {} as ActivatedRouteSnapshot;
const mockState = { url: '/dashboard/assignments' } as RouterStateSnapshot;

describe('authGuard', () => {
  const routerSpy = { navigate: vi.fn() };

  const setup = (isAuthenticated: boolean, refreshResult = false) => {
    const authSpy = {
      isAuthenticated: vi.fn().mockReturnValue(isAuthenticated),
      refreshtoken: vi.fn().mockReturnValue(of(refreshResult)),
    };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });
    return authSpy;
  };

  afterEach(() => vi.clearAllMocks());

  it('should return true immediately when already authenticated', async () => {
    setup(true);
    const result = await lastValueFrom(
      TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState)) as Observable<boolean>
    );
    expect(result).toBe(true);
  });

  it('should NOT call refreshtoken when already authenticated', async () => {
    const auth = setup(true);
    await lastValueFrom(
      TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState)) as Observable<boolean>
    );
    expect(auth.refreshtoken).not.toHaveBeenCalled();
  });

  it('should return true after a successful token refresh', async () => {
    setup(false, true);
    const result = await lastValueFrom(
      TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState)) as Observable<boolean>
    );
    expect(result).toBe(true);
  });

  it('should navigate to /auth/login with returnUrl when refresh fails', async () => {
    setup(false, false);
    const result = await lastValueFrom(
      TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState)) as Observable<boolean>
    );
    expect(result).toBe(false);
    expect(routerSpy.navigate).toHaveBeenCalledWith(
      ['/auth/login'],
      { queryParams: { returnUrl: '/dashboard/assignments' } }
    );
  });
});
