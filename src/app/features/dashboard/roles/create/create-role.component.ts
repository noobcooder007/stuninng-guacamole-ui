import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { RoleService } from '@app/core/services/role.service';
import { TabService } from '@app/core/services/tab.service';
import { HasPermissionPipe } from '@app/shared/pipes/has-permission.pipe';
import { Permissions } from '@app/shared/enums/app-permission.enum';

@Component({
    selector: 'create-role',
    templateUrl: './create-role.component.html',
    imports: [
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        HasPermissionPipe,
    ],
})
export class CreateRoleComponent {
    protected readonly Permissions = Permissions;
    public isLoading = signal(false);

    public form = new FormGroup({
        name: new FormControl('', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]),
        description: new FormControl('', [Validators.maxLength(200)]),
    });

    private readonly roleService = inject(RoleService);
    private readonly snackBar = inject(MatSnackBar);
    private readonly router = inject(Router);
    private readonly tabService = inject(TabService);

    cancel() {
        const idx = this.tabService.tabs.findIndex(t => t.link === this.router.url);
        if (idx !== -1) this.tabService.removeTab(idx, this.tabService.tabs[idx]);
    }

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
