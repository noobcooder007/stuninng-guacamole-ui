import { Injectable } from '@angular/core';
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

    constructor(private router: Router) {
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
        this.tabs.splice(index, 1);
        this.saveTabs();
        if (this.router.url === tab.link) {
            if (this.tabs.length > 0) {
                this.router.navigateByUrl(this.tabs[this.tabs.length - 1].link);
            }
            this.router.navigateByUrl('/');
        }
    }
}
