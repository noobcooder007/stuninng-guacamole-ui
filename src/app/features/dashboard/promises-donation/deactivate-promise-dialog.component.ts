import { Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { PromiseDonation } from '@app/core/services/promise-donation.service';
import { FullnamePipe } from '@app/shared/pipes/fullname.pipe';

@Component({
    selector: 'deactivate-promise-dialog',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        MatDialogModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        FullnamePipe,
    ],
    template: `
        <h2 mat-dialog-title>Desactivar promesa de donación</h2>

        <mat-dialog-content class="flex flex-col gap-4 pt-2">
            <p class="text-sm text-[color:var(--mat-sys-on-surface-variant)]">
                Bienhechor: <strong>{{ data.beneficient | fullname }}</strong>
            </p>
            <mat-form-field appearance="outline">
                <mat-label>Motivo</mat-label>
                <textarea matInput [formControl]="reasonCtrl" rows="3" placeholder="Indique el motivo de desactivación…"></textarea>
                @if (reasonCtrl.hasError('required')) {
                    <mat-error>El motivo es requerido</mat-error>
                }
            </mat-form-field>
        </mat-dialog-content>

        <mat-dialog-actions align="end" class="gap-2">
            <button matButton mat-dialog-close>Cancelar</button>
            <button matButton="filled" color="warn" [disabled]="reasonCtrl.invalid" (click)="confirm()">
                Desactivar
            </button>
        </mat-dialog-actions>
    `,
})
export class DeactivatePromiseDialogComponent {
    readonly data: PromiseDonation = inject(MAT_DIALOG_DATA);
    private readonly dialogRef = inject(MatDialogRef<DeactivatePromiseDialogComponent>);

    readonly reasonCtrl = new FormControl('', [Validators.required, Validators.minLength(3)]);

    confirm(): void {
        if (this.reasonCtrl.invalid) return;
        this.dialogRef.close(this.reasonCtrl.value!.trim());
    }
}
