import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { vi } from 'vitest';
import { TabService, Tab } from '@app/core/services/tab.service';
import { AuthService } from '@app/core/services/auth.service';
import { SoundFeedbackService } from '@app/core/services/sound-feedback.service';

const TAB_A: Tab = { id: 'assignments', label: 'Asignaciones', link: '/dashboard/assignments', permission: 'ASSIGNMENTS_READ' };
const TAB_B: Tab = { id: 'collectors', label: 'Colectores', link: '/dashboard/collectors', permission: 'COLLECTORS_READ' };

describe('TabService', () => {
  let service: TabService;
  // navigateByUrl returns a Promise; the service calls .then() on it when adding a new tab
  const routerSpy = { navigateByUrl: vi.fn().mockResolvedValue(true), url: '/dashboard/assignments' };
  const authSpy = { hasPermission: vi.fn().mockReturnValue(true) };
  const soundSpy = { play: vi.fn() };

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        TabService,
        { provide: Router, useValue: routerSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: SoundFeedbackService, useValue: soundSpy },
      ],
    });
    service = TestBed.inject(TabService);
    vi.clearAllMocks();
    routerSpy.navigateByUrl.mockResolvedValue(true);
  });

  describe('openTab', () => {
    it('should add a new tab and navigate to its link', async () => {
      service.openTab(TAB_A);
      await Promise.resolve();
      expect(service.tabs).toContain(TAB_A);
      expect(routerSpy.navigateByUrl).toHaveBeenCalledWith(TAB_A.link);
    });

    it('should not duplicate an existing tab', async () => {
      service.openTab(TAB_A);
      await Promise.resolve();
      service.openTab(TAB_A);
      await Promise.resolve();
      expect(service.tabs.filter(t => t.id === TAB_A.id)).toHaveLength(1);
    });

    it('should navigate even when tab already exists', async () => {
      service.openTab(TAB_A);
      await Promise.resolve();
      vi.clearAllMocks();
      routerSpy.navigateByUrl.mockResolvedValue(true);
      service.openTab(TAB_A);
      expect(routerSpy.navigateByUrl).toHaveBeenCalledWith(TAB_A.link);
    });

    it('should persist tabs in sessionStorage', async () => {
      service.openTab(TAB_A);
      await Promise.resolve();
      const stored = JSON.parse(sessionStorage.getItem('open_tabs')!);
      expect(stored).toHaveLength(1);
      expect(stored[0].id).toBe(TAB_A.id);
    });
  });

  describe('removeTab', () => {
    beforeEach(async () => {
      service.openTab(TAB_A);
      await Promise.resolve();
      service.openTab(TAB_B);
      await Promise.resolve();
      vi.clearAllMocks();
      routerSpy.navigateByUrl.mockResolvedValue(true);
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
      routerSpy.navigateByUrl.mockResolvedValue(true);
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
