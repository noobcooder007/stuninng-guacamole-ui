import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

export interface ConfirmDialogData {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
}

@Component({
    selector: 'confirm-dialog',
    imports: [MatDialogModule, MatButtonModule],
    template: `
        <h2 mat-dialog-title>{{ data.title }}</h2>
        <mat-dialog-content>
            <p>{{ data.message }}</p>
        </mat-dialog-content>
        <mat-dialog-actions align="end">
            <button type="button" matButton (click)="dialogRef.close(false)">
                {{ data.cancelLabel ?? 'Cancelar' }}
            </button>
            <button type="button" matButton="filled" (click)="dialogRef.close(true)">
                {{ data.confirmLabel ?? 'Confirmar' }}
            </button>
        </mat-dialog-actions>
    `,
})
export class ConfirmDialogComponent {
    readonly dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);
    readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
}
