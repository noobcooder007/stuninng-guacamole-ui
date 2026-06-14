import { AfterViewInit, Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { Permission, Role, RoleService } from '@app/core/services/role.service';
import { TabService } from '@app/core/services/tab.service';
import { HasPermissionPipe } from '@app/shared/pipes/has-permission.pipe';
import { Permissions } from '@app/shared/enums/app-permission.enum';

@Component({
    selector: 'roles-component',
    templateUrl: './roles.component.html',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        MatTableModule,
        MatPaginatorModule,
        MatSortModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatProgressBarModule,
        MatChipsModule,
        HasPermissionPipe,
    ],
})
export class RolesComponent implements OnInit, AfterViewInit {
    protected readonly Permissions = Permissions;
    public isLoading = signal(true);
    public displayedColumns: string[] = ['name', 'description', 'permissions', 'actions'];
    public dataSource = new MatTableDataSource<Role>();
    public searchControl = new FormControl('');

    @ViewChild(MatSort) sort!: MatSort;
    @ViewChild(MatPaginator) paginator!: MatPaginator;

    private readonly roleService = inject(RoleService);
    private readonly tabService = inject(TabService);

    ngOnInit() {
        this.searchControl.valueChanges
            .pipe(debounceTime(300), distinctUntilChanged())
            .subscribe(value => {
                this.dataSource.filter = (value ?? '').trim().toLowerCase();
            });
        this.loadData();
    }

    ngAfterViewInit() {
        this.dataSource.sort = this.sort;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sortingDataAccessor = (role, property) =>
            property === 'description' ? (role.description ?? '') : (role as any)[property] ?? '';
        this.dataSource.filterPredicate = (role, filter) =>
            role.name.toLowerCase().includes(filter) ||
            (role.description ?? '').toLowerCase().includes(filter);
    }

    loadData() {
        this.isLoading.set(true);
        this.roleService.getRoles().subscribe({
            next: ({ data }) => {
                this.dataSource.data = data ?? [];
                this.isLoading.set(false);
            },
            error: () => this.isLoading.set(false),
        });
    }

    openCreateTab() {
        this.tabService.openTab({
            id: 'create-role',
            label: 'Añadir rol',
            link: '/roles/create',
            permission: '',
        });
    }

    openPermissionsTab(role: Role) {
        this.tabService.openTab({
            id: `role-permissions-${role.id}`,
            label: `Permisos: ${role.name}`,
            link: `/roles/${role.id}/permissions`,
            permission: '',
        });
    }

    deleteRole(role: Role) {
        this.roleService.deleteRole(role.id).subscribe(() => this.loadData());
    }

    getVisiblePermissions(role: Role): Permission[] {
        return (role.permissions ?? []).slice(0, 3);
    }
}
