import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Observable } from 'rxjs';
import {
    CollectorInstructions,
    PromiseDonationDetail,
    PromisesDonationService,
    RecurrenceCode,
    UpdateAmountDto,
    WeeklyScheduleItem,
} from '@app/core/services/promise-donation.service';
import { BeneficientDetail, BeneficientService } from '@app/core/services/beneficient.service';
import { ConfirmDialogComponent } from '@app/shared/components/confirm-dialog/confirm-dialog.component';
import { HasPermissionPipe } from '@app/shared/pipes/has-permission.pipe';
import { FullnamePipe } from '@app/shared/pipes/fullname.pipe';
import { HourPipe } from '@app/shared/pipes/hour.pipe';
import { RecurrencePipe } from '@app/shared/pipes/recurrence.pipe';
import { Permissions } from '@app/shared/enums/app-permission.enum';
import { AddInstructionComponent } from '../add-instruction/add-instruction.component';
import { DeactivatePromiseDialogComponent } from '../deactivate-promise-dialog.component';

@Component({
    selector: 'promise-donation-detail',
    standalone: true,
    templateUrl: './promise-donation-detail.component.html',
    imports: [
        ReactiveFormsModule,
        CurrencyPipe,
        DatePipe,
        MatButtonModule,
        MatDialogModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatProgressBarModule,
        MatProgressSpinnerModule,
        MatSelectModule,
        MatTableModule,
        FullnamePipe,
        HourPipe,
        RecurrencePipe,
        HasPermissionPipe,
    ],
})
export class PromiseDonationDetailComponent implements OnInit {
    protected readonly Permissions = Permissions;

    private readonly route = inject(ActivatedRoute);
    private readonly promisesService = inject(PromisesDonationService);
    private readonly beneficientService = inject(BeneficientService);
    private readonly dialog = inject(MatDialog);
    private readonly snackbar = inject(MatSnackBar);

    promise = signal<PromiseDonationDetail | null>(null);
    beneficient = signal<BeneficientDetail | null>(null);
    isLoading = signal(true);
    isSaving = signal(false);
    editingSection = signal<string | null>(null);

    readonly recurrenceOptions: { value: RecurrenceCode; label: string }[] = [
        { value: 'MONTHLY',       label: 'Mensual' },
        { value: 'BIMONTHLY',     label: 'Bimestral' },
        { value: 'QUARTERLY',     label: 'Trimestral' },
        { value: 'QUADRIMONTHLY', label: 'Cuatrimestral' },
        { value: 'SEMIANNUAL',    label: 'Semestral' },
        { value: 'ANNUAL',        label: 'Anual' },
    ];

    amountForm = new FormGroup({
        promiseAmount: new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
        currency: new FormControl<'MXN' | 'USD'>('MXN', [Validators.required]),
    });

    recurrenceForm = new FormGroup({
        recurrence: new FormControl<RecurrenceCode | null>(null, [Validators.required]),
    });

    editInstructions: CollectorInstructions = { weeklySchedule: [], generalObservations: '' };
    readonly instructionsDataSource = new MatTableDataSource<WeeklyScheduleItem>();
    readonly instructionColumns = ['day', 'hour', 'note', 'actions'];
    readonly observationsCtrl = new FormControl('');

    ngOnInit() { this.loadData(); }

    private loadData(): void {
        const id = this.route.snapshot.paramMap.get('id')!;
        this.isLoading.set(true);
        this.promisesService.getById(id).subscribe({
            next: (r) => {
                this.promise.set(r.data);
                this.beneficientService.getBeneficent(r.data.beneficientId).subscribe({
                    next: (b) => { this.beneficient.set(b.data); this.isLoading.set(false); },
                    error: () => this.isLoading.set(false),
                });
            },
            error: () => this.isLoading.set(false),
        });
    }

    // ── Sección edición ───────────────────────────────────────────────────────

    startEdit(section: string): void {
        const p = this.promise();
        if (!p) return;
        this.editingSection.set(section);

        if (section === 'amount') {
            this.amountForm.patchValue({ promiseAmount: +p.promiseAmount, currency: p.currency });
        } else if (section === 'recurrence') {
            this.recurrenceForm.patchValue({ recurrence: this.toRecurrenceCode(p.recurrence) });
        } else if (section === 'instructions') {
            this.editInstructions = p.instructions
                ? { ...p.instructions, weeklySchedule: [...p.instructions.weeklySchedule] }
                : { weeklySchedule: [], generalObservations: '' };
            this.instructionsDataSource.data = this.editInstructions.weeklySchedule;
            this.observationsCtrl.setValue(this.editInstructions.generalObservations);
        }
    }

    cancelEdit(): void { this.editingSection.set(null); }

    saveAmount(): void {
        if (this.amountForm.invalid) return;
        const v = this.amountForm.value;
        this.persist('amount', this.promisesService.patchAmount(this.promise()!.id, {
            promiseAmount: v.promiseAmount!,
            currency: v.currency!,
        } as UpdateAmountDto));
    }

    saveRecurrence(): void {
        if (this.recurrenceForm.invalid) return;
        this.persist('recurrence', this.promisesService.patchRecurrence(this.promise()!.id, {
            recurrence: this.recurrenceForm.value.recurrence!,
        }));
    }

    saveInstructions(): void {
        this.editInstructions.generalObservations = this.observationsCtrl.value ?? '';
        this.persist('instructions', this.promisesService.patchInstructions(this.promise()!.id, {
            instructions: this.editInstructions,
        }));
    }

    private persist(section: string, request: Observable<void>): void {
        this.isSaving.set(true);
        request.subscribe({
            next: () => {
                this.isSaving.set(false);
                this.snackbar.open('Cambios guardados correctamente', 'Cerrar', { duration: 4000 });
                this.editingSection.set(null);
                this.loadData();
            },
            error: () => this.isSaving.set(false),
        });
    }

    // ── Instrucciones ─────────────────────────────────────────────────────────

    addInstruction(): void {
        this.dialog.open(AddInstructionComponent, { minWidth: '480px', disableClose: true })
            .afterClosed().subscribe((item: WeeklyScheduleItem | undefined) => {
                if (!item) return;
                const exists = this.editInstructions.weeklySchedule
                    .some(s => s.day === item.day && s.hours === item.hours);
                if (exists) return;
                this.editInstructions.weeklySchedule.push(item);
                this.instructionsDataSource.data = [...this.editInstructions.weeklySchedule];
            });
    }

    editInstruction(index: number): void {
        const current = this.editInstructions.weeklySchedule[index];
        this.dialog.open(AddInstructionComponent, { data: current, minWidth: '480px', disableClose: true })
            .afterClosed().subscribe((item: WeeklyScheduleItem | undefined) => {
                if (!item) return;
                this.editInstructions.weeklySchedule[index] = item;
                this.instructionsDataSource.data = [...this.editInstructions.weeklySchedule];
            });
    }

    removeInstruction(index: number): void {
        this.editInstructions.weeklySchedule.splice(index, 1);
        this.instructionsDataSource.data = [...this.editInstructions.weeklySchedule];
    }

    // ── Estado ────────────────────────────────────────────────────────────────

    deactivate(): void {
        const p = this.promise();
        const b = this.beneficient();
        if (!p) return;
        this.dialog.open(DeactivatePromiseDialogComponent, {
            data: { ...p, beneficient: b },
            width: '480px',
            disableClose: true,
        }).afterClosed().subscribe((reason: string | undefined) => {
            if (!reason) return;
            this.isSaving.set(true);
            this.promisesService.deactivate(p.id, reason).subscribe({
                next: () => {
                    this.isSaving.set(false);
                    this.snackbar.open('Promesa de donación desactivada correctamente', 'Cerrar', { duration: 4000 });
                    this.loadData();
                },
                error: () => this.isSaving.set(false),
            });
        });
    }

    reactivate(): void {
        const p = this.promise();
        const b = this.beneficient();
        if (!p) return;
        this.dialog.open(ConfirmDialogComponent, {
            data: {
                title: 'Reactivar promesa de donación',
                message: `¿Reactivar la promesa de ${b?.firstname ?? ''} ${b?.firstLastname ?? ''}?`,
                confirmLabel: 'Reactivar',
            },
        }).afterClosed().subscribe((confirmed: boolean) => {
            if (!confirmed) return;
            this.isSaving.set(true);
            this.promisesService.reactivate(p.id).subscribe({
                next: () => {
                    this.isSaving.set(false);
                    this.snackbar.open('Promesa de donación reactivada correctamente', 'Cerrar', { duration: 4000 });
                    this.loadData();
                },
                error: () => this.isSaving.set(false),
            });
        });
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private toRecurrenceCode(n: number): RecurrenceCode {
        const map: Record<number, RecurrenceCode> = {
            1: 'MONTHLY', 2: 'BIMONTHLY', 3: 'QUARTERLY',
            4: 'QUADRIMONTHLY', 6: 'SEMIANNUAL', 12: 'ANNUAL',
        };
        return map[n] ?? 'MONTHLY';
    }
}
