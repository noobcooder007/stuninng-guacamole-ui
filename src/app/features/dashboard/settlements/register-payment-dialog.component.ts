import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { CurrencyPipe } from '@angular/common';
import { RegisterPaymentDto, PaymentMethod } from '@app/core/services/settlements.service';

export interface RegisterPaymentDialogData {
    collectorName: string;
    remainingBalance: number;
}

@Component({
    selector: 'register-payment-dialog',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        CurrencyPipe,
        MatDialogModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule,
    ],
    template: `
        <h2 mat-dialog-title>Registrar pago</h2>

        <mat-dialog-content class="flex flex-col gap-4 pt-2">
            <p class="text-sm text-[color:var(--mat-sys-on-surface-variant)]">
                Colector: <strong>{{ data.collectorName }}</strong> —
                Saldo pendiente: <strong>{{ data.remainingBalance | currency:'MXN':'symbol':'1.2-2' }}</strong>
            </p>

            <form [formGroup]="form" class="flex flex-col gap-4">
                <div class="flex gap-3">
                    <mat-form-field appearance="outline" class="flex-1">
                        <mat-label>Monto</mat-label>
                        <input matInput type="number" formControlName="amount"
                               min="0.01" [max]="data.remainingBalance" step="0.01" />
                        @if (form.get('amount')?.hasError('required')) {
                            <mat-error>Requerido</mat-error>
                        }
                        @if (form.get('amount')?.hasError('max')) {
                            <mat-error>No puede exceder el saldo pendiente</mat-error>
                        }
                        @if (form.get('amount')?.hasError('min')) {
                            <mat-error>Debe ser mayor a 0</mat-error>
                        }
                    </mat-form-field>

                    <mat-form-field appearance="outline" style="width:160px">
                        <mat-label>Método</mat-label>
                        <mat-select formControlName="paymentMethod">
                            @for (m of paymentMethods; track m.value) {
                                <mat-option [value]="m.value">{{ m.label }}</mat-option>
                            }
                        </mat-select>
                    </mat-form-field>
                </div>

                <mat-form-field appearance="outline">
                    <mat-label>Fecha de pago</mat-label>
                    <input matInput [matDatepicker]="picker" formControlName="paidAt" />
                    <mat-datepicker-toggle matIconSuffix [for]="picker" />
                    <mat-datepicker #picker />
                    @if (form.get('paidAt')?.hasError('required')) {
                        <mat-error>Requerido</mat-error>
                    }
                </mat-form-field>

                @if (isTransfer()) {
                    <mat-form-field appearance="outline">
                        <mat-label>Referencia</mat-label>
                        <input matInput formControlName="reference" placeholder="TRF-00123" />
                    </mat-form-field>
                }

                <mat-form-field appearance="outline">
                    <mat-label>Notas (opcional)</mat-label>
                    <textarea matInput formControlName="notes" rows="2"></textarea>
                </mat-form-field>
            </form>
        </mat-dialog-content>

        <mat-dialog-actions align="end" class="gap-2">
            <button matButton mat-dialog-close>Cancelar</button>
            <button matButton="filled" [disabled]="form.invalid" (click)="confirm()">
                Registrar pago
            </button>
        </mat-dialog-actions>
    `,
})
export class RegisterPaymentDialogComponent {
    readonly data: RegisterPaymentDialogData = inject(MAT_DIALOG_DATA);
    private readonly dialogRef = inject(MatDialogRef<RegisterPaymentDialogComponent>);

    readonly paymentMethods: { value: PaymentMethod; label: string }[] = [
        { value: 'CASH', label: 'Efectivo' },
        { value: 'TRANSFER', label: 'Transferencia' },
    ];

    form = new FormGroup({
        amount: new FormControl<number | null>(null, [
            Validators.required,
            Validators.min(0.01),
            Validators.max(this.data.remainingBalance),
        ]),
        paymentMethod: new FormControl<PaymentMethod>('CASH', Validators.required),
        paidAt: new FormControl<Date | null>(new Date(), Validators.required),
        reference: new FormControl(''),
        notes: new FormControl(''),
    });

    isTransfer(): boolean {
        return this.form.get('paymentMethod')?.value === 'TRANSFER';
    }

    confirm(): void {
        if (this.form.invalid) return;
        const { amount, paymentMethod, paidAt, reference, notes } = this.form.value;
        const dto: RegisterPaymentDto = {
            amount: amount!,
            paymentMethod: paymentMethod!,
            paidAt: paidAt!.toISOString(),
            ...(reference?.trim() ? { reference: reference.trim() } : {}),
            ...(notes?.trim() ? { notes: notes.trim() } : {}),
        };
        this.dialogRef.close(dto);
    }
}
