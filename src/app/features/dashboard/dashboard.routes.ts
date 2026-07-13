import { Routes } from '@angular/router';
import { authGuard } from '@app/core/guards/auth.guard';
import { permissionGuard } from '@app/core/guards/permission.guard';
import { DashboardLayoutComponent } from '@app/features/dashboard/dashboard-layout.component';
import { Permissions } from '@app/shared/enums/app-permission.enum';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { SpanishPaginatorIntl } from '@app/core/services/paginator-intl.service';

export const DASHBOARD_ROUTES: Routes = [
    {
        path: '',
        component: DashboardLayoutComponent,
        canActivate: [authGuard],
        providers: [
            provideNativeDateAdapter(),
            { provide: MAT_DATE_LOCALE, useValue: 'es-MX' },
            { provide: MatPaginatorIntl, useClass: SpanishPaginatorIntl },
        ],
        children: [
            {
                path: '',
                loadComponent: () => import('./overview/overview.component')
                    .then(m => m.OverviewComponent),
            },
            {
                path: 'collectors',
                canActivate: [permissionGuard],
                data: { permission: Permissions.VIEW_COLLECTOR },
                loadComponent: () => import('./collector/collector.component')
                    .then(m => m.CollectorComponent),
            },
            {
                path: 'collectors/create',
                canActivate: [permissionGuard],
                data: { permission: Permissions.ADD_COLLECTOR },
                loadComponent: () => import('./collector/create/create-collector.component')
                    .then(m => m.CreateCollectorComponent),
            },
            {
                path: 'collectors/:id',
                canActivate: [permissionGuard],
                data: { permission: Permissions.VIEW_COLLECTOR },
                loadComponent: () => import('./collector/detail/colector-detail.component')
                    .then(m => m.ColectorDetailComponent),
            },
            {
                path: 'beneficients',
                canActivate: [permissionGuard],
                data: { permission: Permissions.VIEW_BENEFICIENT },
                loadComponent: () => import('./beneficient/beneficient.component')
                    .then(m => m.BeneficientComponent),
            },
            {
                path: 'beneficients/create',
                canActivate: [permissionGuard],
                data: { permission: Permissions.ADD_BENEFICIENT },
                loadComponent: () => import('./beneficient/create/create-beneficient.component')
                    .then(m => m.CreateBeneficientComponent),
            },
            {
                path: 'beneficents/:id',
                canActivate: [permissionGuard],
                data: { permission: Permissions.VIEW_BENEFICIENT },
                loadComponent: () => import('./beneficient/detail/beneficient-detail.component')
                    .then(m => m.BeneficientDetailComponent),
            },
            {
                path: 'churches',
                canActivate: [permissionGuard],
                data: { permission: Permissions.VIEW_CHURCH },
                loadComponent: () => import('./church/church.component')
                    .then(c => c.ChurchComponent),
            },
            {
                path: 'churches/create',
                canActivate: [permissionGuard],
                data: { permission: Permissions.ADD_CHURCH },
                loadComponent: () => import('./church/create/create-church.component')
                    .then(c => c.CreateChurchComponent),
            },
            {
                path: 'churches/:id',
                canActivate: [permissionGuard],
                data: { permission: Permissions.VIEW_CHURCH },
                loadComponent: () => import('./church/detail/church-detail.component')
                    .then(m => m.ChurchDetailComponent),
            },
            {
                path: 'receipts/specials',
                canActivate: [permissionGuard],
                data: { permission: Permissions.ADD_INVOICE },
                loadComponent: () => import('./recibos/especiales/recibos-especiales.component')
                    .then(m => m.RecibosEspecialesComponent),
            },
            {
                path: 'assignments',
                canActivate: [permissionGuard],
                data: { permission: Permissions.VIEW_ASSIGNMENT },
                loadComponent: () => import('./assignments/assignments.component')
                    .then(m => m.AssignmentsComponent),
            },
            {
                path: 'assignments/create',
                canActivate: [permissionGuard],
                data: { permission: Permissions.ADD_ASSIGNMENT },
                loadComponent: () => import('./assignments/create/create-assignment.component')
                    .then(m => m.CreateAssignmentComponent),
            },
            {
                path: 'assignments/deactivate',
                canActivate: [permissionGuard],
                data: { permission: Permissions.DELETE_ASSIGNMENT },
                loadComponent: () => import('./assignments/deactivate/deactivate-assignment.component')
                    .then(m => m.DeactivateAssignmentComponent),
            },
            {
                path: 'assignments/reassign',
                canActivate: [permissionGuard],
                data: { permission: Permissions.EDIT_ASSIGNMENT },
                loadComponent: () => import('./assignments/reassign/reassign-assignment.component')
                    .then(m => m.ReassignAssignmentComponent),
            },
            {
                path: 'assignments/assign-orphans',
                canActivate: [permissionGuard],
                data: { permission: Permissions.ADD_ASSIGNMENT },
                loadComponent: () => import('./assignments/assign-orphans/assign-orphans.component')
                    .then(m => m.AssignOrphansComponent),
            },
            {
                path: 'promises-donation',
                canActivate: [permissionGuard],
                data: { permission: Permissions.VIEW_PROMISE },
                loadComponent: () => import('./promises-donation/promises-donation.component')
                    .then((m) => m.PromisesDonationComponent)
            },
            {
                path: 'promises-donation/create',
                canActivate: [permissionGuard],
                data: { permission: Permissions.ADD_PROMISE },
                loadComponent: () => import('./promises-donation/create/create-promise-donation.component')
                    .then((m) => m.CreatePromiseDonationComponent)
            },
            {
                path: 'promises-donation/:id',
                canActivate: [permissionGuard],
                data: { permission: Permissions.VIEW_PROMISE },
                loadComponent: () => import('./promises-donation/detail/promise-donation-detail.component')
                    .then((m) => m.PromiseDonationDetailComponent)
            },
            {
                path: 'receipts',
                canActivate: [permissionGuard],
                data: { permission: Permissions.PRINT_INVOICE },
                loadComponent: () => import('./recibos/impresion/impresion-recibos.component')
                    .then(m => m.ImpresionRecibosComponent),
            },
            {
                path: 'receipts/received',
                canActivate: [permissionGuard],
                data: { permission: Permissions.VIEW_INVOICE },
                loadComponent: () => import('./recibos/recepcion/recibos-recepcion.component')
                    .then(m => m.RecibosRecepcionComponent),
            },
            {
                path: 'receipts/list',
                canActivate: [permissionGuard],
                data: { permission: Permissions.VIEW_INVOICE },
                loadComponent: () => import('./recibos/visualizar/receipts-list.component')
                    .then(m => m.ReceiptsListComponent),
            },
            {
                path: 'receipts/list/:folio',
                canActivate: [permissionGuard],
                data: { permission: Permissions.VIEW_INVOICE },
                loadComponent: () => import('./recibos/detail/receipt-detail.component')
                    .then(m => m.ReceiptDetailComponent),
            },
            {
                path: 'reports',
                canActivate: [permissionGuard],
                data: { permission: Permissions.VIEW_REPORT },
                loadComponent: () => import('./collector/reportes/reports.component')
                    .then(m => m.ReportsComponent),
            },
            {
                path: 'periods',
                canActivate: [permissionGuard],
                data: { permission: Permissions.VIEW_PROCESS },
                loadComponent: () => import('./periods/periods.component')
                    .then(m => m.PeriodsComponent),
            },
            {
                path: 'settlements',
                canActivate: [permissionGuard],
                data: { permission: Permissions.VIEW_SETTLEMENT },
                loadComponent: () => import('./settlements/settlements.component')
                    .then(m => m.SettlementsComponent),
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
            {
                path: 'users',
                canActivate: [permissionGuard],
                data: { permission: Permissions.VIEW_USER },
                loadComponent: () => import('./users/users.component')
                    .then(m => m.UsersComponent),
            },
            {
                path: 'users/:id/edit',
                canActivate: [permissionGuard],
                data: { permission: Permissions.EDIT_USER },
                loadComponent: () => import('./users/edit/user-edit.component')
                    .then(m => m.UserEditComponent),
            },
        ]
    }
];
