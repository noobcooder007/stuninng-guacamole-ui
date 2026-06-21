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
    selector: 'create-permission',
    templateUrl: './create-permission.component.html',
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
export class CreatePermissionComponent {
    protected readonly Permissions = Permissions;
    public isLoading = signal(false);

    public form = new FormGroup({
        action: new FormControl('', [Validators.required, Validators.pattern(/^[a-z]+$/)]),
        resource: new FormControl('', [Validators.required, Validators.pattern(/^[a-z]+$/)]),
        description: new FormControl('', [Validators.maxLength(200)]),
    });

    private readonly roleService = inject(RoleService);
    private readonly snackBar = inject(MatSnackBar);
    private readonly router = inject(Router);
    private readonly tabService = inject(TabService);

    get permissionName(): string {
        const action = this.form.value.action ?? '';
        const resource = this.form.value.resource ?? '';
        return action && resource ? `${action}:${resource}` : '';
    }

    cancel() {
        const idx = this.tabService.tabs.findIndex(t => t.link === this.router.url);
        if (idx !== -1) this.tabService.removeTab(idx, this.tabService.tabs[idx]);
    }

    submit() {
        if (this.form.invalid) return;
        this.isLoading.set(true);
        const { action, resource, description } = this.form.value;
        const name = `${action}:${resource}`;
        this.roleService.createPermission({ name, description: description || undefined }).subscribe({
            next: () => {
                this.snackBar.open('Permiso creado correctamente', 'Cerrar', { duration: 3000 });
                this.router.navigateByUrl('/permissions');
            },
            error: () => this.isLoading.set(false),
        });
    }
}
