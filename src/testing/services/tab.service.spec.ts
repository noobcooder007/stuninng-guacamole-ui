import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { vi } from 'vitest';
import { TabService, Tab } from '@app/core/services/tab.service';
import { AuthService } from '@app/core/services/auth.service';

const TAB_A: Tab = { id: 'assignments', label: 'Asignaciones', link: '/dashboard/assignments', permission: 'ASSIGNMENTS_READ' };
const TAB_B: Tab = { id: 'collectors', label: 'Colectores', link: '/dashboard/collectors', permission: 'COLLECTORS_READ' };

describe('TabService', () => {
  let service: TabService;
  const routerSpy = { navigateByUrl: vi.fn(), url: '/dashboard/assignments' };
  const authSpy = { hasPermission: vi.fn().mockReturnValue(true) };

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        TabService,
        { provide: Router, useValue: routerSpy },
        { provide: AuthService, useValue: authSpy },
      ],
    });
    service = TestBed.inject(TabService);
    vi.clearAllMocks();
  });

  describe('openTab', () => {
    it('should add a new tab and navigate to its link', () => {
      service.openTab(TAB_A);
      expect(service.tabs).toContain(TAB_A);
      expect(routerSpy.navigateByUrl).toHaveBeenCalledWith(TAB_A.link);
    });

    it('should not duplicate an existing tab', () => {
      service.openTab(TAB_A);
      service.openTab(TAB_A);
      expect(service.tabs.filter(t => t.id === TAB_A.id)).toHaveLength(1);
    });

    it('should navigate even when tab already exists', () => {
      service.openTab(TAB_A);
      vi.clearAllMocks();
      service.openTab(TAB_A);
      expect(routerSpy.navigateByUrl).toHaveBeenCalledWith(TAB_A.link);
    });

    it('should persist tabs in sessionStorage', () => {
      service.openTab(TAB_A);
      const stored = JSON.parse(sessionStorage.getItem('open_tabs')!);
      expect(stored).toHaveLength(1);
      expect(stored[0].id).toBe(TAB_A.id);
    });
  });

  describe('removeTab', () => {
    beforeEach(() => {
      service.openTab(TAB_A);
      service.openTab(TAB_B);
      vi.clearAllMocks();
    });

    it('should remove the tab at the given index', () => {
      service.removeTab(0, TAB_A);
      expect(service.tabs.find(t => t.id === TAB_A.id)).toBeUndefined();
    });

    it('should navigate to the next tab when closing the active tab', () => {
      Object.defineProperty(routerSpy, 'url', { get: () => TAB_A.link, configurable: true });
      service.removeTab(0, TAB_A);
      expect(routerSpy.navigateByUrl).toHaveBeenCalledWith(TAB_B.link);
    });

    it('should navigate to "/" when closing the last remaining tab', () => {
      service.removeTab(1, TAB_B);
      vi.clearAllMocks();
      Object.defineProperty(routerSpy, 'url', { get: () => TAB_A.link, configurable: true });
      service.removeTab(0, TAB_A);
      expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/');
    });

    it('should not navigate when closing a non-active tab', () => {
      Object.defineProperty(routerSpy, 'url', { get: () => TAB_B.link, configurable: true });
      service.removeTab(0, TAB_A);
      expect(routerSpy.navigateByUrl).not.toHaveBeenCalled();
    });
  });

  describe('loadTabs (sessionStorage persistence)', () => {
    it('should restore previously saved tabs from sessionStorage on construction', () => {
      sessionStorage.setItem('open_tabs', JSON.stringify([TAB_A, TAB_B]));
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          TabService,
          { provide: Router, useValue: routerSpy },
          { provide: AuthService, useValue: authSpy },
        ],
      });
      const freshService = TestBed.inject(TabService);
      expect(freshService.tabs).toHaveLength(2);
      expect(freshService.tabs[0].id).toBe(TAB_A.id);
    });

    it('should start with empty tabs when sessionStorage has nothing', () => {
      expect(service.tabs).toHaveLength(0);
    });
  });
});
