import { Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';

export type GenerateReceiptsTargetPeriod = 'OPEN' | 'SCHEDULED';

export interface GenerateReceiptsDialogData {
    currentLabel: string;
    nextLabel: string;
}

@Component({
    selector: 'generate-receipts-dialog',
    standalone: true,
    imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatRadioModule],
    template: `
        <h2 mat-dialog-title>Generar recibos</h2>

        <mat-dialog-content>
            <p class="text-sm">
                Elige para qué periodo generar los recibos recurrentes. Esta acción no se puede deshacer.
            </p>
            <mat-radio-group [formControl]="targetPeriod" class="flex flex-col gap-3 pt-3">
                <mat-radio-button value="OPEN">
                    Periodo actual — {{ data.currentLabel }}
                </mat-radio-button>
                <mat-radio-button value="SCHEDULED">
                    Próximo periodo (programado) — {{ data.nextLabel }}
                </mat-radio-button>
            </mat-radio-group>
        </mat-dialog-content>

        <mat-dialog-actions align="end">
            <button type="button" matButton mat-dialog-close>Cancelar</button>
            <button
                type="button"
                matButton="filled"
                (click)="confirm()"
            data-cuelume-press data-cuelume-release
            >
                Generar
            </button>
        </mat-dialog-actions>
    `,
})
export class GenerateReceiptsDialogComponent {
    readonly dialogRef = inject(MatDialogRef<GenerateReceiptsDialogComponent>);
    readonly data = inject<GenerateReceiptsDialogData>(MAT_DIALOG_DATA);

    readonly targetPeriod = new FormControl<GenerateReceiptsTargetPeriod>('OPEN', { nonNullable: true });

    confirm(): void {
        this.dialogRef.close(this.targetPeriod.value);
    }
}
