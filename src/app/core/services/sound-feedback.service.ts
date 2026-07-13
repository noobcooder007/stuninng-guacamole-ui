import { Injectable, computed, signal } from '@angular/core';
import { bind, play, setEnabled, type SoundName } from 'cuelume';

@Injectable({ providedIn: 'root' })
export class SoundFeedbackService {
    private readonly STORAGE_KEY = 'sound_enabled';
    private readonly _enabled = signal<boolean>(this.loadEnabled());
    public readonly enabled = computed(() => this._enabled());

    constructor() {
        setEnabled(this._enabled());
    }

    public setEnabled(value: boolean) {
        this._enabled.set(value);
        localStorage.setItem(this.STORAGE_KEY, String(value));
        setEnabled(value);
    }

    public play(name?: SoundName) {
        play(name);
    }

    public bind(root?: ParentNode) {
        bind(root);
    }

    private loadEnabled(): boolean {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        return saved === null ? true : saved === 'true';
    }
}
