import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

export interface Tab {
  id: string;
  label: string;
  link: string; // La ruta para el router
}

@Injectable({ providedIn: 'root' })
export class TabService {
  public tabs: Tab[] = [];
  
  constructor(private router: Router) {}

  public openTab(tab: Tab) {
    const exists = this.tabs.find(t => t.id === tab.id);
    if (!exists) {
      this.tabs.push(tab);
    }
    this.router.navigateByUrl(tab.link);
  }

  public removeTab(index: number, tab: Tab) {
    this.tabs.splice(index, 1);
    if (this.router.url === tab.link) {
        if (this.tabs.length > 0) {
            this.router.navigateByUrl(this.tabs[this.tabs.length-1].link);
        }
        this.router.navigateByUrl('/');
    }
  }
}
