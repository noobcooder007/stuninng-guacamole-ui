import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class BeneficientDetailService {
    selectedBeneficent = signal<any>(null);

    setBeneficent(beneficent: any) {
        this.selectedBeneficent.set(beneficent);
    }

    getBeneficent() {
        return this.selectedBeneficent();
    }
}
