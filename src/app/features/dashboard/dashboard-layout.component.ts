import { Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { MediaMatcher } from '@angular/cdk/layout';
import { RouterOutlet, RouterLinkWithHref, RouterLinkActive, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '@app/core/services/auth.service';
import { Permissions } from '@app/shared/enums/app-permission.enum';
import { Tab, TabService } from '@app/core/services/tab.service';
import { HasPermissionPipe } from '@app/shared/pipes/has-permission.pipe';
import { ConfirmDialogComponent } from '@app/shared/confirm-dialog/confirm-dialog.component';
import { OverviewComponent } from "./overview/overview.component";

export interface NavItem {
    id: string;
    label: string;
    icon: string;
    route: string;
    permission: string;
}

export interface NavCategory {
    name: string;
    icon: string;
    items: NavItem[];
}

export const MENU_CONFIG: NavCategory[] = [
    {
        name: 'Directorios',
        icon: 'person_search',
        items: [
            {
                id: 'churches',
                label: 'Iglesias',
                icon: 'church',
                route: '/churches',
                permission: Permissions.VIEW_CHURCH,
            },
            {
                id: 'collectors',
                label: 'Colectores',
                icon: 'groups',
                route: '/collectors',
                permission: Permissions.VIEW_COLLECTOR,
            },
            {
                id: 'beneficients',
                label: 'Bienhechores',
                icon: 'volunteer_activism',
                route: '/beneficients',
                permission: Permissions.VIEW_BENEFICIENT,
            },
        ],
    },
    {
        name: 'Operaciones',
        icon: 'sync',
        items: [
            {
                id: 'assignments',
                label: 'Asignaciones',
                icon: 'assignment',
                route: '/assignments',
                permission: Permissions.VIEW_ASSIGNMENT,
            },
            {
                id: 'promises-donation',
                label: 'Promesas de donación',
                icon: 'loyalty',
                route: '/promises-donation',
                permission: Permissions.VIEW_PROMISE,
            },
            {
                id: 'periods',
                label: 'Períodos',
                icon: 'calendar_month',
                route: '/periods',
                permission: Permissions.VIEW_PROCESS,
            },
            {
                id: 'settlements',
                label: 'Liquidaciones',
                icon: 'account_balance_wallet',
                route: '/settlements',
                permission: Permissions.VIEW_SETTLEMENT,
            },
        ],
    },
    {
        name: 'Recibos',
        icon: 'receipt',
        items: [
            {
                id: 'print-receipts',
                label: 'Impresión de Recibos',
                icon: 'print',
                route: '/receipts',
                permission: Permissions.PRINT_INVOICE,
            },
            {
                id: 'special-receipts',
                label: 'Recibos Especiales',
                icon: 'description',
                route: '/receipts/specials',
                permission: Permissions.ADD_INVOICE,
            },
            {
                id: 'receipts-received',
                label: 'Recepción de Recibos',
                icon: 'task_alt',
                route: '/receipts/received',
                permission: Permissions.VIEW_INVOICE,
            },
            {
                id: 'receipts-list',
                label: 'Consulta de Recibos',
                icon: 'manage_search',
                route: '/receipts/list',
                permission: Permissions.VIEW_INVOICE,
            },
        ],
    },
    {
        name: 'Reportes',
        icon: 'bar_chart',
        items: [
            {
                id: 'reports-general',
                label: 'Reportes Generales',
                icon: 'assessment',
                route: '/reports',
                permission: Permissions.VIEW_REPORT,
            },
        ],
    },
    {
        name: 'Administración',
        icon: 'admin_panel_settings',
        items: [
            {
                id: 'users',
                label: 'Usuarios',
                icon: 'group',
                route: '/users',
                permission: Permissions.VIEW_USER,
            },
            {
                id: 'roles',
                label: 'Roles',
                icon: 'manage_accounts',
                route: '/roles',
                permission: Permissions.VIEW_ROLE,
            },
            {
                id: 'permissions',
                label: 'Permisos',
                icon: 'lock',
                route: '/permissions',
                permission: Permissions.VIEW_PERMISSION,
            },
        ],
    },
];

@Component({
    selector: 'dashboard-layout',
    imports: [
    RouterOutlet,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatListModule,
    MatExpansionModule,
    MatTabsModule,
    MatTooltipModule,
    RouterLinkWithHref,
    RouterLinkActive,
    HasPermissionPipe,
    OverviewComponent,
],
    templateUrl: './dashboard-layout.component.html',
})
export class DashboardLayoutComponent implements OnDestroy {
    public readonly categories = MENU_CONFIG;
    public currentRoute: string = '';
    protected readonly isMobile = signal(false);
    protected readonly authService = inject(AuthService);
    protected readonly currentUser = computed(() => this.authService.getAuthenticatedUser());

    private readonly _mobileQuery: MediaQueryList;
    private readonly _mobileQueryListener: () => void;

    private readonly snackbar = inject(MatSnackBar);

    constructor(
        public readonly tabService: TabService,
        public readonly router: Router,
        private readonly dialog: MatDialog,
    ) {
        const media = inject(MediaMatcher);
        this._mobileQuery = media.matchMedia('(max-width: 600px)');
        this.isMobile.set(this._mobileQuery.matches);
        this._mobileQueryListener = () => this.isMobile.set(this._mobileQuery.matches);
        this._mobileQuery.addEventListener('change', this._mobileQueryListener);
        this.router.events.subscribe(() => {
            this.currentRoute = this.router.url;
        });
    }

    ngOnDestroy(): void {
        this._mobileQuery.removeEventListener('change', this._mobileQueryListener);
    }

    currentYear = signal(new Date().getFullYear());
    protected readonly avatarPath = computed(() => {
        const gender = this.currentUser()?.gender;
        if (gender === 'MALE') return 'assets/images/profile-pic-male.svg';
        if (gender === 'FEMALE') return 'assets/images/profile-pic-female.svg';
        return 'assets/images/profile-pic-female.svg';
    });

    public logout(): void {
        this.dialog.open(ConfirmDialogComponent, {
            data: {
                title: 'Cerrar sesión',
                message: '¿Estás seguro de que deseas cerrar sesión?',
                confirmLabel: 'Cerrar sesión',
            },
        }).afterClosed().subscribe((confirmed) => {
            if (!confirmed) return;
            this.authService.logout().subscribe(() => {
                this.snackbar.open('Sesión cerrada con éxito', 'Cerrar', { duration: 4000 });
                this.router.navigateByUrl('/auth/login');
            });
        });
    }

    public closeAllTabs(): void {
        this.dialog.open(ConfirmDialogComponent, {
            data: {
                title: 'Cerrar todas las pestañas',
                message: '¿Estás seguro de que deseas cerrar todas las pestañas abiertas?',
                confirmLabel: 'Cerrar todas',
            },
        }).afterClosed().subscribe((confirmed) => {
            if (!confirmed) return;
            this.tabService.closeAllTabs();
        });
    }

    public selectItem(item: NavItem) {
        this.tabService.openTab({
            id: item.id,
            label: item.label,
            link: item.route,
            permission: item.permission,
        });
    }

    public onMenuItemClick(item: NavItem, sidenav: MatSidenav) {
        if (!this.authService.hasPermission(item.permission)) return;
        this.selectItem(item);
        sidenav.close();
    }

    public closeTab(index: number, event: Event, tab: Tab) {
        event.preventDefault();
        event.stopImmediatePropagation();
        this.tabService.removeTab(index, tab);
    }
}

