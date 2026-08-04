import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmPrintDialogData {
    filename: string;
    action: 'recibos' | 'carta';
}

@Component({
    selector: 'pdf-preview-dialog',
    standalone: true,
    imports: [MatDialogModule, MatButtonModule, MatIconModule],
    template: `
        <h2 mat-dialog-title class="flex items-center gap-2">
            <mat-icon class="text-[color:var(--mat-sys-error)]">warning</mat-icon>
            {{ data.action === 'recibos' ? 'Confirmar impresión de recibos' : 'Confirmar carta de recibos' }}
        </h2>

        <mat-dialog-content>
            <p class="text-sm">
                Estás a punto de generar <strong>{{ data.filename }}</strong>.
            </p>
            @if (data.action === 'recibos') {
                <p class="text-sm text-[color:var(--mat-sys-error)] mt-2">
                    Después de la primera impresión los recibos quedan marcados como
                    <strong>reimpresión</strong> y llevarán una leyenda adicional en futuras impresiones.
                </p>
            } @else {
                <p class="text-sm text-[color:var(--mat-sys-on-surface-variant)] mt-2">
                    Se generará la carta resumen de los recibos filtrados. Esto no marca los recibos como reimpresión.
                </p>
            }
        </mat-dialog-content>

        <mat-dialog-actions align="end">
            <button type="button" matButton mat-dialog-close>Cancelar</button>
            <button type="button" matButton="filled" (click)="dialogRef.close(true)">
                Confirmar
            </button>
        </mat-dialog-actions>
    `,
})
export class PdfPreviewDialogComponent {
    readonly dialogRef = inject(MatDialogRef<PdfPreviewDialogComponent>);
    readonly data = inject<ConfirmPrintDialogData>(MAT_DIALOG_DATA);
}
