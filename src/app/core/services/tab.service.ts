import { ChangeDetectorRef, Injectable } from '@angular/core';
import { Router } from '@angular/router';

export interface Tab {
    id: string;
    label: string;
    link: string; // La ruta para el router
}

@Injectable({ providedIn: 'root' })
export class TabService {
    private readonly STORAGE_KEY = 'open_tabs';
    public tabs: Tab[] = [];

    constructor(
        private router: Router,
        // private cd: ChangeDetectorRef
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
        }
    }

    public openTab(tab: Tab) {
        const exists = this.tabs.find(t => t.id === tab.id);
        if (!exists) {
            this.tabs.push(tab);
            this.saveTabs();
        }
        this.router.navigateByUrl(tab.link);
    }

    public removeTab(index: number, tab: Tab) {
        const isClosingActive = this.router.url === tab.link;
        this.tabs.splice(index, 1);
        this.saveTabs();
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
