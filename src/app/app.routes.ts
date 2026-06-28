import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'auth',
        loadChildren: () => import('@app/features/auth/auth.routes')
        .then(m => m.AUTH_ROUTES)
    },
    {
        path: '',
        loadChildren: () => import('@app/features/dashboard/dashboard.routes')
        .then(m => m.DASHBOARD_ROUTES)
    },
    {
        path: '**',
        loadComponent: () => import('@app/shared/components/not-found/not-found.component')
            .then(m => m.NotFoundComponent)
    }
];
