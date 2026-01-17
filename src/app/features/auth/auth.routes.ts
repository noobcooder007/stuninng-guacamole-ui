import { Routes } from '@angular/router';
import { AuthLayoutComponent } from '@app/features/auth/auth-layout.component';

export const AUTH_ROUTES: Routes = [
    {
        path: '',
        component: AuthLayoutComponent,
        children: [
            {
                path: 'login',
                loadComponent: () => import('@app/features/auth/login/login.component')
                    .then(m => m.LoginComponent)
            },
            {
                path: '',
                redirectTo: 'login',
                pathMatch: 'full'
            }
        ]
    }
];
