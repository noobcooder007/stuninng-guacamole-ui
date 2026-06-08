import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { Permission, RoleService } from '@app/core/services/role.service';

interface SelectablePermission extends Permission {
    selected: boolean;
}

interface PermissionGroup {
    module: string;
    permissions: SelectablePermission[];
}

@Component({
    selector: 'role-permissions',
    templateUrl: './role-permissions.component.html',
    host: { class: 'block h-full' },
    imports: [
        FormsModule,
        MatButtonModule,
        MatCheckboxModule,
        MatProgressBarModule,
        MatProgressSpinnerModule,
        MatDividerModule,
    ],
})
export class RolePermissionsComponent implements OnInit {
    private readonly roleService = inject(RoleService);
    private readonly snackBar = inject(MatSnackBar);
    private readonly route = inject(ActivatedRoute);

    public isLoading = signal(true);
    public isSaving = signal(false);
    public roleName = signal('');
    public roleId = '';
    public permissionGroups = signal<PermissionGroup[]>([]);

    public selectedCount = computed(() =>
        this.permissionGroups().reduce(
            (total, group) => total + group.permissions.filter(p => p.selected).length,
            0
        )
    );

    ngOnInit() {
        this.roleId = this.route.snapshot.paramMap.get('id') ?? '';
        forkJoin({
            allPermissions: this.roleService.getPermissions(),
            role: this.roleService.getRoleById(this.roleId),
        }).subscribe({
            next: ({ allPermissions, role }) => {
                this.roleName.set(role.data.name);
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
        const count = group.permissions.filter(p => p.selected).length;
        return count > 0 && count < group.permissions.length;
    }

    getGroupSelectedCount(group: PermissionGroup): number {
        return group.permissions.filter(p => p.selected).length;
    }

    toggleGroup(group: PermissionGroup, checked: boolean) {
        group.permissions.forEach(p => (p.selected = checked));
        this.permissionGroups.update(groups => [...groups]);
    }

    togglePermission(permission: SelectablePermission) {
        permission.selected = !permission.selected;
        this.permissionGroups.update(groups => [...groups]);
    }

    save() {
        this.isSaving.set(true);
        const permissionIds = this.permissionGroups()
            .flatMap(g => g.permissions.filter(p => p.selected).map(p => p.id));

        this.roleService.assignPermissionsToRole(this.roleId, { permissionIds }).subscribe({
            next: () => {
                this.snackBar.open('Permisos guardados correctamente', 'Cerrar', { duration: 3000 });
                this.isSaving.set(false);
            },
            error: () => this.isSaving.set(false),
        });
    }
}
