import { HasPermissionPipe } from '@app/shared/pipes/has-permission.pipe';
import { AuthService } from '@app/core/services/auth.service';

const mockAuthService = {
  hasPermission: (permission: string | undefined) => false,
} as unknown as AuthService;

describe('HasPermissionPipe', () => {
  let pipe: HasPermissionPipe;

  beforeEach(() => {
    pipe = new HasPermissionPipe(mockAuthService);
  });

  it('should return true when AuthService grants the permission', () => {
    mockAuthService.hasPermission = () => true;
    expect(pipe.transform('COLLECTORS_CREATE')).toBe(true);
  });

  it('should return false when AuthService denies the permission', () => {
    mockAuthService.hasPermission = () => false;
    expect(pipe.transform('COLLECTORS_CREATE')).toBe(false);
  });

  it('should return true when permission is undefined', () => {
    mockAuthService.hasPermission = (p) => p === undefined;
    expect(pipe.transform(undefined)).toBe(true);
  });
});
