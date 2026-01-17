import { Routes } from '@angular/router';
import { NotFoundComponent } from '@app/shared/components/not-found/not-found.component';

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
        component: NotFoundComponent
    }
];
