import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { vi } from 'vitest';
import { permissionGuard } from '@app/core/guards/permission.guard';
import { AuthService } from '@app/core/services/auth.service';

const makeRoute = (permission: string | undefined) =>
  ({ data: { permission } } as unknown as ActivatedRouteSnapshot);
const mockState = {} as RouterStateSnapshot;

describe('permissionGuard', () => {
  const routerSpy = { navigateByUrl: vi.fn() };

  const setup = (hasPermission: boolean) => {
    const authSpy = { hasPermission: vi.fn().mockReturnValue(hasPermission) };
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

  it('should return true when the user has the required permission', () => {
    setup(true);
    const result = TestBed.runInInjectionContext(
      () => permissionGuard(makeRoute('ROLES_READ'), mockState)
    );
    expect(result).toBe(true);
    expect(routerSpy.navigateByUrl).not.toHaveBeenCalled();
  });

  it('should return false and navigate to "/" when permission is missing', () => {
    setup(false);
    const result = TestBed.runInInjectionContext(
      () => permissionGuard(makeRoute('ROLES_READ'), mockState)
    );
    expect(result).toBe(false);
    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('should pass the permission from route.data to AuthService', () => {
    const auth = setup(true);
    TestBed.runInInjectionContext(() => permissionGuard(makeRoute('COLLECTORS_CREATE'), mockState));
    expect(auth.hasPermission).toHaveBeenCalledWith('COLLECTORS_CREATE');
  });

  it('should return true when route has no permission defined (undefined)', () => {
    const auth = setup(true);
    auth.hasPermission.mockReturnValue(true);
    const result = TestBed.runInInjectionContext(
      () => permissionGuard(makeRoute(undefined), mockState)
    );
    expect(result).toBe(true);
  });

  it('should allow access for any permission when AuthService returns true (superadministrator bypass)', () => {
    // AuthService.hasPermission returns true for superadministrator regardless of the permission.
    // The guard must respect that decision and not block the route.
    setup(true);
    const result = TestBed.runInInjectionContext(
      () => permissionGuard(makeRoute('void:invoice'), mockState)
    );
    expect(result).toBe(true);
    expect(routerSpy.navigateByUrl).not.toHaveBeenCalled();
  });
});
