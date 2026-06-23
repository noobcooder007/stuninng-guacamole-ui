import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

export interface CancelReceiptDialogData {
    folio: string;
}

export interface CancelReceiptDialogResult {
    reason: string;
}

@Component({
    selector: 'cancel-receipt-dialog',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        MatDialogModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
    ],
    template: `
        <h2 mat-dialog-title class="flex items-center gap-2">
            <mat-icon class="text-red-500">cancel</mat-icon>
            Cancelar recibo
        </h2>

        <mat-dialog-content class="flex flex-col gap-4 pt-2">
            <p class="text-sm text-[color:var(--mat-sys-on-surface-variant)]">
                Esta acción es <strong>irreversible</strong>. El recibo
                <strong class="font-mono">{{ data.folio }}</strong> quedará cancelado permanentemente.
            </p>

            <form [formGroup]="form" class="flex flex-col gap-4">
                <mat-form-field appearance="outline">
                    <mat-label>Motivo de cancelación</mat-label>
                    <textarea
                        matInput
                        formControlName="reason"
                        rows="3"
                        placeholder="Describe el motivo de la cancelación..."
                    ></textarea>
                    @if (form.get('reason')?.hasError('required')) {
                        <mat-error>El motivo es requerido</mat-error>
                    }
                </mat-form-field>

                <mat-form-field appearance="outline">
                    <mat-label>Escribe el folio para confirmar</mat-label>
                    <input
                        matInput
                        formControlName="folioConfirm"
                        [placeholder]="data.folio"
                        autocomplete="off"
                    />
                    @if (form.get('folioConfirm')?.dirty && form.get('folioConfirm')?.value !== data.folio) {
                        <mat-error>El folio no coincide</mat-error>
                    }
                </mat-form-field>
            </form>
        </mat-dialog-content>

        <mat-dialog-actions align="end" class="gap-2">
            <button matButton mat-dialog-close>Cancelar</button>
            <button
                matButton="filled"
                color="warn"
                [disabled]="!canConfirm"
                (click)="confirm()"
            >
                Confirmar cancelación
            </button>
        </mat-dialog-actions>
    `,
})
export class CancelReceiptDialogComponent {
    readonly data: CancelReceiptDialogData = inject(MAT_DIALOG_DATA);
    private readonly dialogRef = inject(MatDialogRef<CancelReceiptDialogComponent>);

    form = new FormGroup({
        reason: new FormControl('', [Validators.required]),
        folioConfirm: new FormControl('', [Validators.required]),
    });

    get canConfirm(): boolean {
        return (
            this.form.get('reason')!.valid &&
            this.form.get('folioConfirm')!.value === this.data.folio
        );
    }

    confirm(): void {
        if (!this.canConfirm) return;
        const result: CancelReceiptDialogResult = { reason: this.form.get('reason')!.value! };
        this.dialogRef.close(result);
    }
}
