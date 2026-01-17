import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthService } from '@app/core/services/auth.service';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isAuthenticated()) {
        return of(true);
    }

    return authService.refreshtoken().pipe(
        switchMap(isRefreshSuccessful => {
            if (isRefreshSuccessful) return of(true);

            router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
            return of(false);

        })
    );
};
