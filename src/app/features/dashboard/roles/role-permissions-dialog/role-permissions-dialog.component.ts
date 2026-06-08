import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { Permission, Role, RoleService } from '@app/core/services/role.service';

export interface RolePermissionsDialogData {
    role: Role;
}

interface SelectablePermission extends Permission {
    selected: boolean;
}

interface PermissionGroup {
    module: string;
    permissions: SelectablePermission[];
}

@Component({
    selector: 'role-permissions-dialog',
    templateUrl: './role-permissions-dialog.component.html',
    standalone: true,
    imports: [
        FormsModule,
        MatDialogModule,
        MatButtonModule,
        MatCheckboxModule,
        MatProgressSpinnerModule,
        MatProgressBarModule,
        MatDividerModule,
    ],
})
export class RolePermissionsDialogComponent implements OnInit {
    public readonly dialogRef = inject(MatDialogRef<RolePermissionsDialogComponent>);
    public readonly data = inject<RolePermissionsDialogData>(MAT_DIALOG_DATA);
    private readonly roleService = inject(RoleService);
    private readonly snackBar = inject(MatSnackBar);

    public isLoading = signal(true);
    public isSaving = signal(false);
    public permissionGroups = signal<PermissionGroup[]>([]);

    public selectedCount = computed(() =>
        this.permissionGroups().reduce(
            (total, group) => total + group.permissions.filter(p => p.selected).length,
            0
        )
    );

    ngOnInit() {
        forkJoin({
            allPermissions: this.roleService.getPermissions(),
            role: this.roleService.getRoleById(this.data.role.id),
        }).subscribe({
            next: ({ allPermissions, role }) => {
                const assignedIds = new Set(role.data.permissions.map(p => p.id));
                const selectablePermissions: SelectablePermission[] = allPermissions.data.map(p => ({
                    ...p,
                    selected: assignedIds.has(p.id),
                }));
                this.permissionGroups.set(this.groupByModule(selectablePermissions));
                this.isLoading.set(false);
            },
            error: () => this.isLoading.set(false),
        });
    }

    private groupByModule(permissions: SelectablePermission[]): PermissionGroup[] {
        const map = new Map<string, SelectablePermission[]>();
        for (const p of permissions) {
            const mod = p.module ?? 'General';
            if (!map.has(mod)) map.set(mod, []);
            map.get(mod)!.push(p);
        }
        return Array.from(map.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([module, permissions]) => ({ module, permissions }));
    }

    isGroupAllChecked(group: PermissionGroup): boolean {
        return group.permissions.length > 0 && group.permissions.every(p => p.selected);
    }

    isGroupIndeterminate(group: PermissionGroup): boolean {
        const checkedCount = group.permissions.filter(p => p.selected).length;
        return checkedCount > 0 && checkedCount < group.permissions.length;
    }

    toggleGroup(group: PermissionGroup, checked: boolean) {
        group.permissions.forEach(p => (p.selected = checked));
        this.permissionGroups.update(groups => [...groups]);
    }

    togglePermission(permission: SelectablePermission) {
        permission.selected = !permission.selected;
        this.permissionGroups.update(groups => [...groups]);
    }

    getGroupSelectedCount(group: PermissionGroup): number {
        return group.permissions.filter(p => p.selected).length;
    }

    save() {
        this.isSaving.set(true);
        const permissionIds = this.permissionGroups()
            .flatMap(g => g.permissions.filter(p => p.selected).map(p => p.id));

        this.roleService.assignPermissionsToRole(this.data.role.id, { permissionIds }).subscribe({
            next: () => {
                this.snackBar.open('Permisos guardados correctamente', 'Cerrar', { duration: 3000 });
                this.dialogRef.close(true);
            },
            error: () => this.isSaving.set(false),
        });
    }
}
