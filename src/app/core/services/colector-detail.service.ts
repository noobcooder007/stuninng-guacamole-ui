import { Injectable, signal } from '@angular/core';
import { Colector } from './colector.service';

@Injectable({ providedIn: 'root' })
export class ColectorDetailService {
    private selectedColector = signal<Colector | null>(null);

    setColector(colector: Colector) {
        this.selectedColector.set(colector);
    }

    getColector(): Colector | null {
        return this.selectedColector();
    }
}
