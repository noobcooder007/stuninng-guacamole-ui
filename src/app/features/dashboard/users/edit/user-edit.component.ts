import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { UserService } from '@app/core/services/user.service';
import { HasPermissionPipe } from '@app/shared/pipes/has-permission.pipe';
import { Permissions } from '@app/shared/enums/app-permission.enum';
import { ConfirmDialogComponent } from '@app/shared/confirm-dialog/confirm-dialog.component';

@Component({
    selector: 'user-edit',
    templateUrl: './user-edit.component.html',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        MatButtonModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatTooltipModule,
        MatProgressSpinnerModule,
        HasPermissionPipe,
    ],
})
export class UserEditComponent implements OnInit {
    protected readonly Permissions = Permissions;

    public userId = '';
    public currentUsername = '';
    public isActive = signal(true);
    public editingUsername = signal(false);

    public isSavingUsername = signal(false);
    public isSavingPassword = signal(false);
    public isTogglingStatus = signal(false);
    public showPassword = signal(false);

    public usernameForm = new FormGroup({
        username: new FormControl('', [
            Validators.required,
            Validators.minLength(4),
            Validators.maxLength(50),
            Validators.pattern(/^[a-zA-Z0-9]+$/),
        ]),
    });

    public passwordForm = new FormGroup({
        newPassword: new FormControl('', [
            Validators.required,
            Validators.minLength(6),
            Validators.maxLength(50),
        ]),
    });

    private readonly route = inject(ActivatedRoute);
    private readonly userService = inject(UserService);
    private readonly snackBar = inject(MatSnackBar);
    private readonly dialog = inject(MatDialog);

    ngOnInit() {
        this.userId = this.route.snapshot.params['id'];
        this.currentUsername = this.route.snapshot.queryParams['username'] ?? '';
        this.isActive.set(this.route.snapshot.queryParams['isActive'] === 'true');
        this.usernameForm.controls.username.setValue(this.currentUsername);
    }

    startEditUsername() {
        this.usernameForm.controls.username.setValue(this.currentUsername);
        this.editingUsername.set(true);
    }

    cancelEditUsername() {
        this.editingUsername.set(false);
        this.usernameForm.controls.username.setValue(this.currentUsername);
    }

    togglePasswordVisibility() {
        this.showPassword.update(v => !v);
    }

    submitUsername() {
        if (this.usernameForm.invalid) return;
        const username = this.usernameForm.value.username!;
        if (username === this.currentUsername) {
            this.editingUsername.set(false);
            return;
        }
        this.isSavingUsername.set(true);
        this.userService.updateUsername(this.userId, username).subscribe({
            next: () => {
                this.currentUsername = username;
                this.editingUsername.set(false);
                this.snackBar.open('Nombre de usuario actualizado', 'Cerrar', { duration: 3000 });
                this.isSavingUsername.set(false);
            },
            error: () => this.isSavingUsername.set(false),
        });
    }

    submitPassword() {
        if (this.passwordForm.invalid) return;
        this.isSavingPassword.set(true);
        this.userService.updatePassword(this.userId, this.passwordForm.value.newPassword!).subscribe({
            next: () => {
                this.passwordForm.reset();
                this.snackBar.open('Contraseña actualizada correctamente', 'Cerrar', { duration: 3000 });
                this.isSavingPassword.set(false);
            },
            error: () => this.isSavingPassword.set(false),
        });
    }

    toggleStatus() {
        const active = this.isActive();
        this.dialog.open(ConfirmDialogComponent, {
            data: {
                title: active ? 'Desactivar usuario' : 'Activar usuario',
                message: `¿Estás seguro de que deseas ${active ? 'desactivar' : 'activar'} a <strong>${this.currentUsername}</strong>?`,
                confirmLabel: active ? 'Desactivar' : 'Activar',
            },
        }).afterClosed().subscribe(confirmed => {
            if (!confirmed) return;
            this.isTogglingStatus.set(true);
            this.userService.updateStatus(this.userId, !active).subscribe({
                next: () => {
                    this.isActive.set(!active);
                    this.snackBar.open(`Usuario ${!active ? 'activado' : 'desactivado'} correctamente`, 'Cerrar', { duration: 3000 });
                    this.isTogglingStatus.set(false);
                },
                error: () => this.isTogglingStatus.set(false),
            });
        });
    }
}
