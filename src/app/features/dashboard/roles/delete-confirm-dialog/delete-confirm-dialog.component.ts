import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface DeleteConfirmDialogData {
    roleName: string;
}

@Component({
    selector: 'delete-confirm-dialog',
    templateUrl: './delete-confirm-dialog.component.html',
    standalone: true,
    imports: [MatDialogModule, MatButtonModule, MatIconModule],
})
export class DeleteConfirmDialogComponent {
    public readonly dialogRef = inject(MatDialogRef<DeleteConfirmDialogComponent>);
    public readonly data = inject<DeleteConfirmDialogData>(MAT_DIALOG_DATA);
}
