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
                    .then(m => m.OverviewComponent),
            },
            {
                path: 'collectors',
                loadComponent: () => import('./collector/collector.component')
                    .then(m => m.CollectorComponent),
            },
            {
                path: 'collectors/create',
                loadComponent: () => import('./collector/create/create-collector.component')
                    .then(m => m.CreateCollectorComponent),
            },
            {
                path: 'beneficients',
                loadComponent: () => import('./beneficient/beneficient.component')
                    .then(m => m.BeneficientComponent),
            },
            {
                path: 'beneficients/create',
                loadComponent: () => import('./beneficient/create/create-beneficient.component')
                    .then(m => m.CreateBeneficientComponent),
            },
            {
                path: 'beneficents/:id',
                loadComponent: () => import('./beneficient/detail/beneficient-detail.component')
                    .then(m => m.BeneficientDetailComponent),
            },
            {
                path: 'churches',
                loadComponent: () => import('./church/church.component')
                    .then(c => c.ChurchComponent),
            },
            {
                path: 'churches/create',
                loadComponent: () => import('./church/create/create-church.component')
                    .then(c => c.CreateChurchComponent),
            },
            {
                path: 'receipts/specials',
                loadComponent: () => import('./recibos/especiales/recibos-especiales.component')
                    .then(m => m.RecibosEspecialesComponent),
            },
            {
                path: 'receipts',
                loadComponent: () => import('./recibos/impresion/impresion-recibos.component')
                    .then(m => m.ImpresionRecibosComponent),
            },
            {
                path: 'reports/collector',
                loadComponent: () => import('./collector/reportes/colector-reportes.component')
                    .then(m => m.ColectorReportesComponent),
            },
            {
                path: 'reports',
                loadComponent: () => import('./collector/reportes/reports.component')
                    .then(m => m.ReportsComponent),
            },
            {
                path: 'processes',
                loadComponent: () => import('./processes/processes.component')
                    .then(m => m.ProcessesComponent),
            },
            {
                path: 'uploads',
                loadComponent: () => import('./uploads/uploads.component')
                    .then(m => m.UploadsComponent),
            },
        ]
    }
];
