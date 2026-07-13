import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface ConfirmDialogData {
    title: string;
    message: string;
    confirmLabel?: string;
}

@Component({
    selector: 'confirm-dialog',
    standalone: true,
    imports: [MatDialogModule, MatButtonModule],
    template: `
        <h2 mat-dialog-title>{{ data.title }}</h2>
        <mat-dialog-content>{{ data.message }}</mat-dialog-content>
        <mat-dialog-actions align="end">
            <button matButton [mat-dialog-close]="false">Cancelar</button>
            <button matButton="filled" color="warn" [mat-dialog-close]="true">
                {{ data.confirmLabel ?? 'Confirmar' }}
            </button>
        </mat-dialog-actions>
    `,
})
export class ConfirmDialogComponent {
    readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
}
