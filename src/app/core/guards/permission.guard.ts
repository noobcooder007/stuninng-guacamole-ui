import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '@app/core/services/auth.service';

export const permissionGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const permission = route.data['permission'] as string | undefined;

    if (authService.hasPermission(permission)) return true;

    router.navigateByUrl('/');
    return false;
};
