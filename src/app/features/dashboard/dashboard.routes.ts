import { Routes } from '@angular/router';
import { authGuard } from '@app/core/guards/auth.guard';
import { DashboardLayoutComponent } from '@app/features/dashboard/dashboard-layout.component';

export const DASHBOARD_ROUTES: Routes = [
    {
        path: '',
        component: DashboardLayoutComponent,
        // canActivate: [authGuard],
        children: [
            {
                path: '',
                loadComponent: () => import('./overview/overview.component')
                    .then(m => m.OverviewComponent)
            },
            {
                path: 'collectors',
                loadComponent: () => import('./collector/collector.component')
                    .then(m => m.CollectorComponent)
            },
            {
                path: 'beneficients',
                loadComponent: () => import('./beneficient/beneficient.component')
                    .then(m => m.BeneficientComponent)
            },
            {
                path: 'churches',
                loadComponent: () => import('./church/church.component')
                    .then(c => c.ChurchComponent)
            },
        ]
    }
];
