import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

export interface SpecialReceiptWarningDialogData {
    message: string;
}

@Component({
    selector: 'special-receipt-warning-dialog',
    standalone: true,
    imports: [MatDialogModule, MatButtonModule, MatIconModule],
    template: `
        <h2 mat-dialog-title class="flex items-center gap-2">
            <mat-icon class="text-[color:var(--mat-sys-error)]">warning</mat-icon>
            Recibo creado, PDF no generado
        </h2>
        <mat-dialog-content>
            <p class="text-sm">{{ data.message }}</p>
        </mat-dialog-content>
        <mat-dialog-actions align="end">
            <button type="button" matButton="filled" (click)="dialogRef.close()" data-cuelume-press data-cuelume-release>
                Entendido
            </button>
        </mat-dialog-actions>
    `,
})
export class SpecialReceiptWarningDialogComponent {
    readonly dialogRef = inject(MatDialogRef<SpecialReceiptWarningDialogComponent>);
    readonly data = inject<SpecialReceiptWarningDialogData>(MAT_DIALOG_DATA);
}
