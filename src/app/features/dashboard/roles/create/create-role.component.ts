import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { RoleService } from '@app/core/services/role.service';

@Component({
    selector: 'create-role',
    templateUrl: './create-role.component.html',
    imports: [
        ReactiveFormsModule,
        RouterLink,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
    ],
})
export class CreateRoleComponent {
    public isLoading = signal(false);

    public form = new FormGroup({
        name: new FormControl('', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]),
        description: new FormControl('', [Validators.maxLength(200)]),
    });

    private readonly roleService = inject(RoleService);
    private readonly snackBar = inject(MatSnackBar);
    private readonly router = inject(Router);

    submit() {
        if (this.form.invalid) return;
        this.isLoading.set(true);
        const { name, description } = this.form.value;
        this.roleService.createRole({ name: name!, description: description || undefined }).subscribe({
            next: () => {
                this.snackBar.open('Rol creado correctamente', 'Cerrar', { duration: 3000 });
                this.router.navigateByUrl('/roles');
            },
            error: () => this.isLoading.set(false),
        });
    }
}
