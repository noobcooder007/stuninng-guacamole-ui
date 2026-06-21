import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { HasPermissionPipe } from '@app/shared/pipes/has-permission.pipe';
import { Permissions } from '@app/shared/enums/app-permission.enum';

@Component({
    selector: 'add-instruction',
    templateUrl: 'add-instruction.component.html',
    imports: [
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatIconModule,
        HasPermissionPipe,
    ],
})

export class AddInstructionComponent implements OnInit {
    protected readonly Permissions = Permissions;
    public instructionForm = new FormGroup({
        day: new FormControl(null, [Validators.required]),
        hour: new FormControl(null, [Validators.required]),
        note: new FormControl(null),
    });

    constructor(
        public dialogRef: MatDialogRef<AddInstructionComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any // Recibe lo que el usuario escribió en el input
    ) { }

    ngOnInit(): void {
        if (this.data) {
            this.instructionForm.patchValue(this.data);
        }
    }

    onAccept(value: any) {
        this.dialogRef.close(value);
    }
}