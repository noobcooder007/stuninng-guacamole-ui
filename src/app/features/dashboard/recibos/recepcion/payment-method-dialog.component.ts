import { Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

export interface PaymentMethodDialogData {
    count: number;
}

@Component({
    selector: 'payment-method-dialog',
    imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatSelectModule],
    template: `
        <h2 mat-dialog-title>Confirmar recepción</h2>
        <mat-dialog-content>
            <p>{{ data.count > 1 ? data.count + ' recibos seleccionados' : '1 recibo seleccionado' }}</p>
            <mat-form-field appearance="outline" class="w-full">
                <mat-label>Método de pago</mat-label>
                <mat-select [formControl]="paymentMethodCtrl">
                    @for (method of paymentMethods; track method.value) {
                        <mat-option [value]="method.value">{{ method.label }}</mat-option>
                    }
                </mat-select>
            </mat-form-field>
        </mat-dialog-content>
        <mat-dialog-actions align="end">
            <button type="button" matButton (click)="dialogRef.close()">Cancelar</button>
            <button
                type="button"
                matButton="filled"
                [disabled]="paymentMethodCtrl.invalid"
                (click)="confirm()"
            >
                Confirmar
            </button>
        </mat-dialog-actions>
    `,
})
export class PaymentMethodDialogComponent {
    readonly dialogRef = inject(MatDialogRef<PaymentMethodDialogComponent>);
    readonly data = inject<PaymentMethodDialogData>(MAT_DIALOG_DATA);

    paymentMethodCtrl = new FormControl<string>('', Validators.required);

    readonly paymentMethods = [
        { value: 'CASH', label: 'Efectivo' },
        { value: 'TRANSFER', label: 'Transferencia' },
        { value: 'CARD', label: 'Tarjeta' },
        { value: 'CHECK', label: 'Cheque' },
    ];

    confirm(): void {
        if (this.paymentMethodCtrl.valid) {
            this.dialogRef.close(this.paymentMethodCtrl.value);
        }
    }
}
