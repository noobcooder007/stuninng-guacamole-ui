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
                path: 'beneficents-detail',
                loadComponent: () => import('./beneficient/detail/beneficent-detail.component')
                    .then(m => m.BeneficientDetailComponent)
            },
            {
                path: 'churches',
                loadComponent: () => import('./church/church.component')
                    .then(c => c.ChurchComponent)
            },
            {
                path: 'colectores',
                loadComponent: () => import('./colector/colector.component')
                    .then(m => m.ColectorComponent)
            },
            {
                path: 'colectores/reportes',
                loadComponent: () => import('./colector/reportes/colector-reportes.component')
                    .then(m => m.ColectorReportesComponent)
            },
            {
                path: 'recibos/impresion',
                loadComponent: () => import('./recibos/impresion/impresion-recibos.component')
                    .then(m => m.ImpresionRecibosComponent)
            },
            {
                path: 'recibos/especiales',
                loadComponent: () => import('./recibos/especiales/recibos-especiales.component')
                    .then(m => m.RecibosEspecialesComponent)
            },
        ]
    }
];
