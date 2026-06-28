import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CollectorService, CollectorListItem } from '@app/core/services/collector.service';
import { ProcessesService, PeriodStatus } from '@app/core/services/processes.service';
import { Settlement, SettlementsService, RegisterPaymentDto, BulkPaymentDto } from '@app/core/services/settlements.service';
import { HasPermissionPipe } from '@app/shared/pipes/has-permission.pipe';
import { Permissions } from '@app/shared/enums/app-permission.enum';
import { RegisterPaymentDialogComponent, RegisterPaymentDialogData } from './register-payment-dialog.component';
import { BulkPaymentDialogComponent, BulkPaymentDialogData } from './bulk-payment-dialog.component';
import { PaymentHistoryDialogComponent } from './payment-history-dialog.component';

interface SettlementRow extends Settlement {
    collectorName: string;
}

@Component({
    selector: 'app-settlements',
    standalone: true,
    templateUrl: './settlements.component.html',
    imports: [
        CurrencyPipe,
        MatButtonModule,
        MatChipsModule,
        MatDialogModule,
        MatIconModule,
        MatProgressBarModule,
        MatProgressSpinnerModule,
        MatTableModule,
        MatTooltipModule,
        HasPermissionPipe,
    ],
})
export class SettlementsComponent implements OnInit {
    protected readonly Permissions = Permissions;

    private readonly settlementsService = inject(SettlementsService);
    private readonly processesService = inject(ProcessesService);
    private readonly collectorService = inject(CollectorService);
    private readonly dialog = inject(MatDialog);
    private readonly snackbar = inject(MatSnackBar);

    isLoading = signal(true);
    isRegistering = signal<string | null>(null); // settlementId en proceso
    isBulkPaying = signal(false);

    period = signal<PeriodStatus | null>(null);
    rows = signal<SettlementRow[]>([]);

    private collectorMap = new Map<string, string>();

    readonly displayedColumns = [
        'collector', 'totalCollected', 'commission',
        'deductions', 'netCommission', 'paid', 'remaining', 'status', 'actions',
    ];

    readonly pendingRows = computed(() =>
        this.rows().filter(r => r.paymentStatus !== 'PAID')
    );

    readonly totalRemaining = computed(() =>
        this.pendingRows().reduce((sum, r) => sum + r.remainingBalance, 0)
    );

    readonly months = [
        'Enero','Febrero','Marzo','Abril','Mayo','Junio',
        'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
    ];

    ngOnInit(): void {
        this.processesService.getPeriodStatus().subscribe({
            next: ({ data }) => {
                this.period.set(data);
                this.loadSettlements(data.id);
            },
            error: () => {
                this.isLoading.set(false);
                this.snackbar.open('No hay periodo activo', 'Cerrar', { duration: 5000 });
            },
        });
    }

    private loadSettlements(periodId: string): void {
        this.isLoading.set(true);
        this.collectorService.getActiveList().subscribe({
            next: (collectors) => {
                this.collectorMap = new Map(
                    collectors.map((c: CollectorListItem) => [
                        c.id,
                        `${c.firstname} ${c.firstLastname}${c.secondLastname ? ' ' + c.secondLastname : ''}`.trim(),
                    ])
                );
                this.fetchSettlements(periodId);
            },
            error: () => this.fetchSettlements(periodId),
        });
    }

    private fetchSettlements(periodId: string): void {
        this.settlementsService.getSettlements(periodId).subscribe({
            next: (settlements) => {
                this.rows.set(settlements.map(s => ({
                    ...s,
                    collectorName: this.collectorMap.get(s.collectorId) ?? `Colector ${s.collectorId.slice(0, 8)}`,
                })));
                this.isLoading.set(false);
            },
            error: () => this.isLoading.set(false),
        });
    }

    openRegisterPayment(row: SettlementRow): void {
        const data: RegisterPaymentDialogData = {
            collectorName: row.collectorName,
            remainingBalance: row.remainingBalance,
        };
        this.dialog.open(RegisterPaymentDialogComponent, { data, width: '480px', disableClose: true })
            .afterClosed()
            .subscribe((dto: RegisterPaymentDto | undefined) => {
                if (!dto) return;
                this.isRegistering.set(row.id);
                this.settlementsService.registerPayment(row.id, dto).subscribe({
                    next: () => {
                        this.snackbar.open('Pago registrado correctamente', 'Cerrar', { duration: 4000 });
                        this.isRegistering.set(null);
                        this.fetchSettlements(this.period()!.id);
                    },
                    error: () => this.isRegistering.set(null),
                });
            });
    }

    openBulkPayment(): void {
        const data: BulkPaymentDialogData = {
            pendingCount: this.pendingRows().length,
            totalRemaining: this.totalRemaining(),
        };
        this.dialog.open(BulkPaymentDialogComponent, { data, width: '480px', disableClose: true })
            .afterClosed()
            .subscribe((dto: BulkPaymentDto | undefined) => {
                if (!dto) return;
                this.isBulkPaying.set(true);
                this.settlementsService.bulkPayment(this.period()!.id, dto).subscribe({
                    next: () => {
                        this.snackbar.open('Pago masivo registrado correctamente', 'Cerrar', { duration: 4000 });
                        this.isBulkPaying.set(false);
                        this.fetchSettlements(this.period()!.id);
                    },
                    error: () => this.isBulkPaying.set(false),
                });
            });
    }

    openHistory(row: SettlementRow): void {
        this.dialog.open(PaymentHistoryDialogComponent, {
            data: { settlementId: row.id, collectorName: row.collectorName },
            width: '600px',
        });
    }

    statusLabel(status: string): string {
        switch (status) {
            case 'PAID': return 'Pagado';
            case 'PARTIALLY_PAID': return 'Parcial';
            default: return 'Pendiente';
        }
    }

    statusClass(status: string): string {
        switch (status) {
            case 'PAID': return 'bg-green-100 text-green-700';
            case 'PARTIALLY_PAID': return 'bg-yellow-100 text-yellow-700';
            default: return 'bg-blue-100 text-blue-700';
        }
    }

    periodLabel(period: PeriodStatus): string {
        return `${this.months[period.month - 1]} ${period.year}`;
    }

    paymentProgress(row: SettlementRow): number {
        if (row.netCommission === 0) return 100;
        return Math.round((row.totalPaid / row.netCommission) * 100);
    }
}
