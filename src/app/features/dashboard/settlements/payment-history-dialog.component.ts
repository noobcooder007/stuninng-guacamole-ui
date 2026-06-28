import { Component, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SettlementsService, SettlementPayment } from '@app/core/services/settlements.service';

export interface PaymentHistoryDialogData {
    settlementId: string;
    collectorName: string;
}

@Component({
    selector: 'payment-history-dialog',
    standalone: true,
    imports: [
        CurrencyPipe,
        DatePipe,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
    ],
    template: `
        <h2 mat-dialog-title>Historial de pagos — {{ data.collectorName }}</h2>

        <mat-dialog-content class="pt-2">
            @if (isLoading()) {
                <div class="flex justify-center py-8">
                    <mat-spinner diameter="36" />
                </div>
            } @else if (!payments().length) {
                <div class="flex flex-col items-center gap-2 py-10 text-[color:var(--mat-sys-on-surface-variant)]">
                    <mat-icon class="!text-5xl !w-12 !h-12 opacity-40">payments</mat-icon>
                    <span class="text-sm">Sin pagos registrados</span>
                </div>
            } @else {
                <div class="flex flex-col divide-y divide-[color:var(--mat-sys-outline-variant)]">
                    @for (p of payments(); track p.id) {
                        <div class="py-3 flex items-start justify-between gap-4">
                            <div class="flex flex-col gap-0.5">
                                <span class="text-sm font-semibold">
                                    {{ p.amount | currency:'MXN':'symbol':'1.2-2' }}
                                </span>
                                <span class="text-xs text-[color:var(--mat-sys-on-surface-variant)]">
                                    {{ p.paymentMethod === 'CASH' ? 'Efectivo' : 'Transferencia' }}
                                    @if (p.reference) { · {{ p.reference }} }
                                </span>
                                @if (p.notes) {
                                    <span class="text-xs text-[color:var(--mat-sys-on-surface-variant)] italic">
                                        {{ p.notes }}
                                    </span>
                                }
                            </div>
                            <span class="text-xs text-[color:var(--mat-sys-on-surface-variant)] shrink-0">
                                {{ p.paidAt | date:'dd/MM/yyyy' }}
                            </span>
                        </div>
                    }
                </div>
            }
        </mat-dialog-content>

        <mat-dialog-actions align="end">
            <button matButton mat-dialog-close>Cerrar</button>
        </mat-dialog-actions>
    `,
})
export class PaymentHistoryDialogComponent implements OnInit {
    readonly data: PaymentHistoryDialogData = inject(MAT_DIALOG_DATA);
    private readonly settlementsService = inject(SettlementsService);

    isLoading = signal(true);
    payments = signal<SettlementPayment[]>([]);

    ngOnInit(): void {
        this.settlementsService.getPaymentHistory(this.data.settlementId).subscribe({
            next: (data) => { this.payments.set(data); this.isLoading.set(false); },
            error: () => this.isLoading.set(false),
        });
    }
}
