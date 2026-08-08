import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Recibo, RecibosService } from '@app/core/services/recibos.service';
import { HasPermissionPipe } from '@app/shared/pipes/has-permission.pipe';
import { Permissions } from '@app/shared/enums/app-permission.enum';
import { ConfirmDialogComponent } from '@app/shared/confirm-dialog/confirm-dialog.component';
import {
    CancelReceiptDialogComponent,
    CancelReceiptDialogResult,
} from './cancel-receipt-dialog.component';

@Component({
    selector: 'receipt-detail',
    standalone: true,
    templateUrl: './receipt-detail.component.html',
    imports: [
        CurrencyPipe,
        DatePipe,
        MatButtonModule,
        MatCardModule,
        MatChipsModule,
        MatDialogModule,
        MatIconModule,
        MatProgressBarModule,
        MatProgressSpinnerModule,
        MatTooltipModule,
        HasPermissionPipe,
    ],
})
export class ReceiptDetailComponent implements OnInit {
    protected readonly Permissions = Permissions;

    private readonly route = inject(ActivatedRoute);
    private readonly recibosService = inject(RecibosService);
    private readonly dialog = inject(MatDialog);
    private readonly snackbar = inject(MatSnackBar);

    receipt = signal<Recibo | null>(null);
    isLoading = signal(true);
    isCancelling = signal(false);
    isReprinting = signal(false);

    private readonly monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ];

    private readonly statusMap: Record<string, string> = {
        PENDING: 'Pendiente',
        PAID: 'Pagado',
        VOID: 'Cancelado',
        REPRINT: 'Reimpresión',
    };

    ngOnInit(): void {
        const folio = this.route.snapshot.paramMap.get('folio')!;
        this.loadReceipt(folio);
    }

    private loadReceipt(folio: string): void {
        this.isLoading.set(true);
        this.recibosService.getRecibo(folio).subscribe({
            next: ({ data }) => { this.receipt.set(data); this.isLoading.set(false); },
            error: () => this.isLoading.set(false),
        });
    }

    openCancelDialog(): void {
        const r = this.receipt();
        if (!r || r.status === 'PAID' || r.status === 'CANCELLED') return;

        this.dialog
            .open(CancelReceiptDialogComponent, {
                data: { folio: r.folio },
                width: '480px',
                disableClose: true,
            })
            .afterClosed()
            .subscribe((result: CancelReceiptDialogResult | undefined) => {
                if (!result) return;
                this.isCancelling.set(true);
                this.recibosService.cancelarRecibo(r.folio, result.reason).subscribe({
                    next: () => {
                        this.snackbar.open('Recibo cancelado correctamente', 'Cerrar', { duration: 5000 });
                        this.isCancelling.set(false);
                        this.loadReceipt(r.folio);
                    },
                    error: () => this.isCancelling.set(false),
                });
            });
    }

    openReprintDialog(): void {
        const r = this.receipt();
        if (!r) return;

        this.dialog
            .open(ConfirmDialogComponent, {
                data: {
                    title: 'Reimprimir recibo',
                    message: `¿Generar de nuevo el PDF del folio ${r.folio}?`,
                    confirmLabel: 'Reimprimir',
                },
            })
            .afterClosed()
            .subscribe((confirmed: boolean) => {
                if (!confirmed) return;
                this.isReprinting.set(true);
                this.recibosService.reimprimirRecibo(r.folio).subscribe({
                    next: (blob) => {
                        window.open(URL.createObjectURL(blob), '_blank');
                        this.isReprinting.set(false);
                        this.loadReceipt(r.folio);
                    },
                    error: () => this.isReprinting.set(false),
                });
            });
    }

    statusLabel(status: string): string {
        return this.statusMap[status] ?? status;
    }

    statusClass(status: string): string {
        switch (status) {
            case 'PAID': return 'bg-green-100 text-green-700';
            case 'VOID': return 'bg-red-100 text-red-700';
            case 'REPRINT': return 'bg-yellow-100 text-yellow-700';
            default: return 'bg-blue-100 text-blue-700';
        }
    }

    periodLabel(month: number, year: number): string {
        return `${this.monthNames[month - 1] ?? ''} ${year}`;
    }
}
