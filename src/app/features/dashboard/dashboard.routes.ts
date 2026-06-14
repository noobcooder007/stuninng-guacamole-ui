import { Routes } from '@angular/router';
import { authGuard } from '@app/core/guards/auth.guard';
import { permissionGuard } from '@app/core/guards/permission.guard';
import { DashboardLayoutComponent } from '@app/features/dashboard/dashboard-layout.component';
import { Permissions } from '@app/shared/enums/app-permission.enum';

export const DASHBOARD_ROUTES: Routes = [
    {
        path: '',
        component: DashboardLayoutComponent,
        canActivate: [authGuard],
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
                path: 'assignments',
                loadComponent: () => import('./assignments/assignments.component')
                    .then(m => m.AssignmentsComponent),
            },
            {
                path: 'assignments/create',
                loadComponent: () => import('./assignments/create/create-assignment.component')
                    .then(m => m.CreateAssignmentComponent),
            },
            {
                path: 'assignments/deactivate',
                loadComponent: () => import('./assignments/deactivate/deactivate-assignment.component')
                    .then(m => m.DeactivateAssignmentComponent),
            },
            {
                path: 'assignments/reassign',
                loadComponent: () => import('./assignments/reassign/reassign-assignment.component')
                    .then(m => m.ReassignAssignmentComponent),
            },
            {
                path: 'assignments/assign-orphans',
                loadComponent: () => import('./assignments/assign-orphans/assign-orphans.component')
                    .then(m => m.AssignOrphansComponent),
            },
            {
                path: 'promises-donation',
                loadComponent: () => import('./promises-donation/promises-donation.component')
                    .then((m) => m.PromisesDonationComponent)
            },
            {
                path: 'promises-donation/create',
                loadComponent: () => import('./promises-donation/create/create-promise-donation.component')
                    .then((m) => m.CreatePromiseDonationComponent)
            },
            {
                path: 'receipts',
                loadComponent: () => import('./recibos/impresion/impresion-recibos.component')
                    .then(m => m.ImpresionRecibosComponent),
            },
            {
                path: 'receipts/received',
                loadComponent: () => import('./recibos/recepcion/recibos-recepcion.component')
                    .then(m => m.RecibosRecepcionComponent),
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
            {
                path: 'roles',
                canActivate: [permissionGuard],
                data: { permission: Permissions.VIEW_ROLE },
                loadComponent: () => import('./roles/roles.component')
                    .then(m => m.RolesComponent),
            },
            {
                path: 'roles/create',
                canActivate: [permissionGuard],
                data: { permission: Permissions.ADD_ROLE },
                loadComponent: () => import('./roles/create/create-role.component')
                    .then(m => m.CreateRoleComponent),
            },
            {
                path: 'roles/:id/permissions',
                canActivate: [permissionGuard],
                data: { permission: Permissions.MANAGE_ROLE },
                loadComponent: () => import('./roles/permissions/role-permissions.component')
                    .then(m => m.RolePermissionsComponent),
            },
            {
                path: 'permissions',
                canActivate: [permissionGuard],
                data: { permission: Permissions.VIEW_PERMISSION },
                loadComponent: () => import('./permissions/permissions.component')
                    .then(m => m.PermissionsComponent),
            },
            {
                path: 'permissions/create',
                canActivate: [permissionGuard],
                data: { permission: Permissions.ADD_PERMISSION },
                loadComponent: () => import('./permissions/create/create-permission.component')
                    .then(m => m.CreatePermissionComponent),
            },
        ]
    }
];
