import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { SoundFeedbackService } from '@app/core/services/sound-feedback.service';

const cuelumeMock = vi.hoisted(() => ({
  play: vi.fn(),
  bind: vi.fn(),
  setEnabled: vi.fn(),
}));

vi.mock('cuelume', () => cuelumeMock);

// The Angular test runner provides a broken localStorage via --localstorage-file.
// We replace it with an in-memory stub for every test.
const _store: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string): string | null => _store[key] ?? null,
  setItem: (key: string, value: string): void => { _store[key] = value; },
  removeItem: (key: string): void => { delete _store[key]; },
  clear: (): void => { Object.keys(_store).forEach(k => delete _store[k]); },
};

describe('SoundFeedbackService', () => {
  let service: SoundFeedbackService;

  beforeEach(() => {
    Object.keys(_store).forEach(k => delete _store[k]);
    vi.stubGlobal('localStorage', localStorageMock);
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [SoundFeedbackService] });
    service = TestBed.inject(SoundFeedbackService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should be enabled by default when localStorage has no preference', () => {
    expect(service.enabled()).toBe(true);
    expect(cuelumeMock.setEnabled).toHaveBeenCalledWith(true);
  });

  it('should restore a previously saved disabled preference on construction', () => {
    localStorage.setItem('sound_enabled', 'false');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [SoundFeedbackService] });
    const freshService = TestBed.inject(SoundFeedbackService);

    expect(freshService.enabled()).toBe(false);
    expect(cuelumeMock.setEnabled).toHaveBeenCalledWith(false);
  });

  it('should update the signal, persist to localStorage, and notify cuelume on setEnabled', () => {
    service.setEnabled(false);

    expect(service.enabled()).toBe(false);
    expect(localStorage.getItem('sound_enabled')).toBe('false');
    expect(cuelumeMock.setEnabled).toHaveBeenCalledWith(false);
  });

  it('should delegate play() to cuelume', () => {
    service.play('success');

    expect(cuelumeMock.play).toHaveBeenCalledWith('success');
  });

  it('should delegate bind() to cuelume', () => {
    const root = document.createElement('div');
    service.bind(root);

    expect(cuelumeMock.bind).toHaveBeenCalledWith(root);
  });
});
