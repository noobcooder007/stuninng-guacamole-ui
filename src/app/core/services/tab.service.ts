import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@app/core/services/auth.service';
import { SoundFeedbackService } from '@app/core/services/sound-feedback.service';

export interface Tab {
    id: string;
    label: string;
    link: string; // La ruta para el router
    permission: string;
}

@Injectable({ providedIn: 'root' })
export class TabService {
    private readonly STORAGE_KEY = 'open_tabs';
    public tabs: Tab[] = [];

    constructor(
        private router: Router,
        private authService: AuthService,
        private soundFeedbackService: SoundFeedbackService,
    ) {
        this.loadTabs();
    }

    private saveTabs() {
        sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.tabs));
    }

    private loadTabs() {
        const savedTabs = sessionStorage.getItem(this.STORAGE_KEY);
        if (savedTabs) {
            this.tabs = JSON.parse(savedTabs);
            this.tabs.filter(tab => this.authService.hasPermission(tab.permission))
        }
    }

    public openTab(tab: Tab) {
        const exists = this.tabs.find(t => t.id === tab.id);
        if (exists) {
            this.router.navigateByUrl(tab.link);
            return;
        }
        this.router.navigateByUrl(tab.link).then((success) => {
            if (success !== false && !this.tabs.find(t => t.id === tab.id)) {
                this.tabs.push(tab);
                this.saveTabs();
                this.soundFeedbackService.play('bloom');
            }
        });
    }

    public closeAllTabs() {
        this.tabs = [];
        this.saveTabs();
        this.soundFeedbackService.play('droplet');
        this.router.navigateByUrl('/');
    }

    public removeTab(index: number, tab: Tab) {
        const isClosingActive = this.router.url === tab.link;
        this.tabs.splice(index, 1);
        this.saveTabs();
        this.soundFeedbackService.play('droplet');
        if (isClosingActive) {
            const remainingTabs = this.tabs;
            if (remainingTabs.length > 0) {
                const nextIndex = index < remainingTabs.length ? index : remainingTabs.length - 1;
                const nextTab = remainingTabs[nextIndex];
                this.router.navigateByUrl(nextTab.link);
            } else {
                this.router.navigateByUrl('/');
            }
        }
    }
}
