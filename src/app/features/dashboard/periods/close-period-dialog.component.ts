import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
    selector: 'close-period-dialog',
    standalone: true,
    imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
    template: `
        <h2 mat-dialog-title>Cerrar periodo</h2>

        <mat-dialog-content>
            <p class="text-sm">
                Esta acción afectará todos los procesos activos y no se puede deshacer.
            </p>
            <form [formGroup]="form" class="pt-2">
                <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
                    <mat-label>Tipo de cambio (USD → MXN)</mat-label>
                    <input matInput type="number" formControlName="exchangeRateUsdToMxn" min="0.0001" step="0.0001" />
                    @if (form.get('exchangeRateUsdToMxn')?.hasError('required')) {
                        <mat-error>El tipo de cambio es obligatorio</mat-error>
                    }
                    @if (form.get('exchangeRateUsdToMxn')?.hasError('min')) {
                        <mat-error>Debe ser mayor a 0</mat-error>
                    }
                </mat-form-field>
            </form>
        </mat-dialog-content>

        <mat-dialog-actions align="end">
            <button type="button" matButton mat-dialog-close>Cancelar</button>
            <button
                type="button"
                matButton="filled"
                [disabled]="form.invalid"
                (click)="confirm()"
            data-cuelume-press data-cuelume-release
            >
                Cerrar periodo
            </button>
        </mat-dialog-actions>
    `,
})
export class ClosePeriodDialogComponent {
    readonly dialogRef = inject(MatDialogRef<ClosePeriodDialogComponent>);

    readonly form = new FormGroup({
        exchangeRateUsdToMxn: new FormControl<number | null>(null, [Validators.required, Validators.min(0.0001)]),
    });

    confirm(): void {
        if (this.form.invalid) return;
        this.dialogRef.close(this.form.value.exchangeRateUsdToMxn);
    }
}
