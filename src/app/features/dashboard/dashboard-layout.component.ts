import { Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { MediaMatcher } from '@angular/cdk/layout';
import { RouterOutlet, RouterLinkWithHref, RouterLinkActive, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';
import { AuthService } from '@app/core/services/auth.service';
import { Tab, TabService } from '@app/core/services/tab.service';
import { HasPermissionPipe } from '@app/shared/pipes/has-permission.pipe';
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
                permission: '',
            },
            {
                id: 'colectores',
                label: 'Colectores',
                icon: 'groups',
                route: '/collectors',
                permission: '',
            },
            {
                id: 'beneficients',
                label: 'Bienhechores',
                icon: 'volunteer_activism',
                route: '/beneficients',
                permission: '',
            },
        ],
    },
    {
        name: 'Colectores',
        icon: 'assessment',
        items: [
            {
                id: 'assignments',
                label: 'Asignaciones',
                icon: 'assignment',
                route: '/assignments',
                permission: '',
            },
            {
                id: 'colectores-reportes',
                label: 'Reportes',
                icon: 'bar_chart',
                route: '/reports/collector',
                permission: '',
            },
        ],
    },
    {
        name: 'Bienhechores',
        icon: 'volunteer_activism',
        items: [
            {
                id: 'promises-donation',
                label: 'Promesas de donación',
                icon: 'loyalty',
                route: '/promises-donation',
                permission: '',
            },
        ]
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
                permission: '',
            },
            {
                id: 'special-receipts',
                label: 'Recibos Especiales',
                icon: 'description',
                route: '/receipts/specials',
                permission: '',
            },
        ],
    },
    {
        name: 'Procesos',
        icon: 'autorenew',
        items: [
            {
                id: 'processes',
                label: 'Procesos',
                icon: 'play_circle',
                route: '/processes',
                permission: '',
            },
        ],
    },
    {
        name: 'Reportes',
        icon: 'document_scanner',
        items: [
            {
                id: 'reports-general',
                label: 'Reportes Generales',
                icon: 'assessment',
                route: '/reports',
                permission: '',
            },
            {
                id: 'reports-collector',
                label: 'Reportes Colectores',
                icon: 'bar_chart',
                route: '/reports/collector',
                permission: '',
            },
        ],
    },
    {
        name: 'Cargas',
        icon: 'cloud_upload',
        items: [
            {
                id: 'upload-deposits',
                label: 'Carga Depósito',
                icon: 'upload_file',
                route: '/uploads',
                permission: '',
            },
            {
                id: 'upload-information',
                label: 'Carga Información',
                icon: 'upload_file',
                route: '/uploads',
                permission: '',
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
    RouterLinkWithHref,
    RouterLinkActive,
    HasPermissionPipe,
    OverviewComponent
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

    constructor(
        public readonly tabService: TabService,
        public readonly router: Router,
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

    public selectItem(item: NavItem) {
        this.tabService.openTab({
            id: item.id,
            label: item.label,
            link: item.route,
            permission: item.permission,
        });
    }

    public closeTab(index: number, event: Event, tab: Tab) {
        event.preventDefault();
        event.stopImmediatePropagation();
        this.tabService.removeTab(index, tab);
    }
}

