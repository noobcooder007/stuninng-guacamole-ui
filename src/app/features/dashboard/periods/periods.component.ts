import { Component, inject, OnInit, signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PeriodStatus, ProcessesService } from '@app/core/services/processes.service';
import { ConfirmDialogComponent } from '@app/shared/confirm-dialog/confirm-dialog.component';
import { PeriodStatusEnum } from '@app/shared/enums/period-status.enum';
import { HasPermissionPipe } from '@app/shared/pipes/has-permission.pipe';
import { Permissions } from '@app/shared/enums/app-permission.enum';
import { apiErrorMessage } from '@app/shared/utils/api-error';

@Component({
    selector: 'app-periods',
    standalone: true,
    templateUrl: './periods.component.html',
    styleUrl: './periods.component.scss',
    imports: [
        MatFormFieldModule,
        MatSelectModule,
        MatButtonModule,
        MatIconModule,
        MatCardModule,
        MatChipsModule,
        MatDialogModule,
        MatProgressSpinnerModule,
        ReactiveFormsModule,
        HasPermissionPipe,
    ],
})
export class PeriodsComponent implements OnInit {
    protected readonly Permissions = Permissions;
    private readonly processesService = inject(ProcessesService);
    private readonly dialog = inject(MatDialog);
    private readonly snackbar = inject(MatSnackBar);

    public readonly PeriodStatusEnum = PeriodStatusEnum;
    public isProcessing = signal(false);
    public periodStatus = signal<PeriodStatus | null>(null);
    public isTogglingPeriod = signal(false);
    public isLoadingPeriod = signal(true);
    public isGeneratingReport = signal(false);
    public isGeneratingSettlement = signal(false);
    public currentYear = new Date().getFullYear();
    public years: number[] = [];

    public readonly months = [
        { value: '01', label: 'Enero' },
        { value: '02', label: 'Febrero' },
        { value: '03', label: 'Marzo' },
        { value: '04', label: 'Abril' },
        { value: '05', label: 'Mayo' },
        { value: '06', label: 'Junio' },
        { value: '07', label: 'Julio' },
        { value: '08', label: 'Agosto' },
        { value: '09', label: 'Septiembre' },
        { value: '10', label: 'Octubre' },
        { value: '11', label: 'Noviembre' },
        { value: '12', label: 'Diciembre' },
    ];

    public periodReportsForm = new FormGroup({
        month: new FormControl('', Validators.required),
        year: new FormControl<number | string>('', Validators.required),
    });

    ngOnInit(): void {
        this.generateYears();
        this.setCurrentMonth();
        this.loadPeriodStatus();
    }

    private generateYears(): void {
        for (let i = this.currentYear - 5; i <= this.currentYear + 5; i++) {
            this.years.push(i);
        }
    }

    private setCurrentMonth(): void {
        const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
        this.periodReportsForm.patchValue({ month: currentMonth, year: this.currentYear.toString() });
    }

    loadPeriodStatus(): void {
        this.isLoadingPeriod.set(true);
        this.processesService.getPeriodStatus().subscribe({
            next: (res) => {
                if (res.data) {
                    this.applyPeriodStatus(res.data);
                    return;
                }
                this.loadLastClosedPeriod();
            },
            error: (err) => {
                this.periodStatus.set(null);
                this.isLoadingPeriod.set(false);
                if (err?.status !== 404) {
                    this.snackbar.open(apiErrorMessage(err, 'Error al obtener el estado del periodo'), 'Cerrar', { duration: 5000 });
                }
            },
        });
    }

    private loadLastClosedPeriod(): void {
        this.processesService.getLastClosedPeriod().subscribe({
            next: (res) => {
                if (res.data) {
                    this.applyPeriodStatus(res.data);
                    return;
                }
                this.periodStatus.set(null);
                this.isLoadingPeriod.set(false);
            },
            error: () => {
                this.periodStatus.set(null);
                this.isLoadingPeriod.set(false);
            },
        });
    }

    private applyPeriodStatus(period: PeriodStatus): void {
        this.periodStatus.set(period);
        this.isLoadingPeriod.set(false);
        const month = period.month.toString().padStart(2, '0');
        const year = period.year.toString();
        this.periodReportsForm.patchValue({ month, year });
    }

    togglePeriod(): void {
        const isOpen = this.periodStatus()?.status === PeriodStatusEnum.OPEN;
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            data: {
                title: isOpen ? 'Cerrar periodo' : 'Abrir periodo',
                message: isOpen
                    ? '¿Estás seguro de que deseas cerrar el periodo actual? Esta acción afectará todos los procesos activos.'
                    : '¿Estás seguro de que deseas abrir un nuevo periodo?',
                confirmLabel: isOpen ? 'Cerrar periodo' : 'Abrir periodo',
            },
        });

        dialogRef.afterClosed().subscribe((confirmed: boolean) => {
            if (!confirmed) return;
            this.isTogglingPeriod.set(true);
            const action$ = isOpen
                ? this.processesService.closePeriod()
                : this.processesService.openPeriod();

            action$.subscribe({
                next: () => {
                    this.snackbar.open(
                        isOpen ? 'Periodo cerrado correctamente' : 'Periodo abierto correctamente',
                        'Cerrar',
                        { duration: 5000 }
                    );
                    this.loadPeriodStatus();
                    this.isTogglingPeriod.set(false);
                },
                error: (err) => {
                    this.snackbar.open(apiErrorMessage(err, 'Error al cambiar el estado del periodo'), 'Cerrar', { duration: 5000 });
                    this.isTogglingPeriod.set(false);
                },
            });
        });
    }

    generarRecibos(): void {
        const period = this.periodStatus();
        if (!period) return;
        const monthLabel = this.months[period.month - 1]?.label ?? '';
        this.dialog.open(ConfirmDialogComponent, {
            data: {
                title: 'Generar recibos',
                message: `¿Generar recibos para ${monthLabel} ${period.year}? Esta acción no se puede deshacer.`,
                confirmLabel: 'Generar',
            },
        }).afterClosed().subscribe((confirmed: boolean) => {
            if (!confirmed) return;
            this.isProcessing.set(true);
            this.processesService.startReceiptsGenerationProcess({
                month: period.month.toString().padStart(2, '0'),
                year: period.year.toString(),
            }).subscribe({
                next: () => {
                    this.snackbar.open('Recibos generados correctamente', 'Cerrar', { duration: 5000 });
                    this.isProcessing.set(false);
                },
                error: (err) => {
                    this.snackbar.open(apiErrorMessage(err, 'Error al generar los recibos'), 'Cerrar', { duration: 7000 });
                    this.isProcessing.set(false);
                },
            });
        });
    }

    generarReportePeriodo(): void {
        if (this.periodReportsForm.invalid) return;
        const month = parseInt(this.periodReportsForm.value.month!, 10);
        const year = parseInt(this.periodReportsForm.value.year!.toString(), 10);
        this.isGeneratingReport.set(true);
        this.processesService.collectionPeriodReportPdf(month, year).subscribe({
            next: (blob) => {
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank');
                this.isGeneratingReport.set(false);
            },
            error: () => this.isGeneratingReport.set(false),
        });
    }

    generarCartasLiquidacion(): void {
        const periodId = this.periodStatus()?.id;
        if (!periodId) return;
        this.isGeneratingSettlement.set(true);
        this.processesService.settlementLettersPdf(periodId).subscribe({
            next: (blob) => {
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank');
                this.isGeneratingSettlement.set(false);
            },
            error: () => this.isGeneratingSettlement.set(false),
        });
    }

}
