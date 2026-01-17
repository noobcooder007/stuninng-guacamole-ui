// dashboard-layout.component.ts
import { Component, inject, OnDestroy, signal } from '@angular/core';
import { MediaMatcher } from '@angular/cdk/layout';
import { RouterOutlet, RouterLinkWithHref, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';

@Component({
    selector: 'dashboard-layout',
    imports: [
    RouterOutlet,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatListModule,
    RouterLinkWithHref,
    RouterLinkActive
],
    templateUrl: './dashboard-layout.component.html',
    styleUrl: './dashboard-layout.component.scss',
})
export class DashboardLayoutComponent implements OnDestroy {
    protected readonly isMobile = signal(true);

    private readonly _mobileQuery: MediaQueryList;
    private readonly _mobileQueryListener: () => void;

    constructor() {
        const media = inject(MediaMatcher);
        this._mobileQuery = media.matchMedia('(max-width: 600px)');
        this.isMobile.set(this._mobileQuery.matches);
        this._mobileQueryListener = () => this.isMobile.set(this._mobileQuery.matches);
        this._mobileQuery.addEventListener('change', this._mobileQueryListener);
    }

    ngOnDestroy(): void {
        this._mobileQuery.removeEventListener('change', this._mobileQueryListener);
    }

    currentYear = signal(new Date().getFullYear());
    avatarPath = signal('assets/images/profile-pic-female.svg');
    genre = signal<'F' | 'M'>('F');
    toggleAvatarPath(): void {
        this.genre.update((genre) => genre === 'F' ? 'M' : 'F');
        this.avatarPath.set(
            this.genre() === 'F'
                ? 'assets/images/profile-pic-female.svg'
                : 'assets/images/profile-pic-male.svg'
        );

    };
}

