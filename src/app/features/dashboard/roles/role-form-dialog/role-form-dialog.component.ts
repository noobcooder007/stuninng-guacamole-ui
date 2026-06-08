import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CreateRoleDto, Role, RoleService, UpdateRoleDto } from '@app/core/services/role.service';

export interface RoleFormDialogData {
    role?: Role;
}

@Component({
    selector: 'role-form-dialog',
    templateUrl: './role-form-dialog.component.html',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        MatDialogModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatProgressSpinnerModule,
    ],
})
export class RoleFormDialogComponent implements OnInit {
    public readonly dialogRef = inject(MatDialogRef<RoleFormDialogComponent>);
    public readonly data = inject<RoleFormDialogData>(MAT_DIALOG_DATA);
    private readonly roleService = inject(RoleService);
    private readonly snackBar = inject(MatSnackBar);

    public isLoading = signal(false);
    public isEditMode = !!this.data?.role;

    public form = new FormGroup({
        name: new FormControl('', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]),
        description: new FormControl('', [Validators.maxLength(200)]),
    });

    ngOnInit() {
        if (this.data?.role) {
            this.form.patchValue({
                name: this.data.role.name,
                description: this.data.role.description ?? '',
            });
        }
    }

    submit() {
        if (this.form.invalid) return;
        this.isLoading.set(true);
        const { name, description } = this.form.value;

        if (this.isEditMode) {
            const dto: UpdateRoleDto = { name: name!, description: description || undefined };
            this.roleService.updateRole(this.data.role!.id, dto).subscribe({
                next: () => {
                    this.snackBar.open('Rol actualizado correctamente', 'Cerrar', { duration: 3000 });
                    this.dialogRef.close(true);
                },
                error: () => this.isLoading.set(false),
            });
        } else {
            const dto: CreateRoleDto = { name: name!, description: description || undefined };
            this.roleService.createRole(dto).subscribe({
                next: () => {
                    this.snackBar.open('Rol creado correctamente', 'Cerrar', { duration: 3000 });
                    this.dialogRef.close(true);
                },
                error: () => this.isLoading.set(false),
            });
        }
    }
}
