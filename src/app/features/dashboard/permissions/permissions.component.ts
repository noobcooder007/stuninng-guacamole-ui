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
import { MatSnackBar } from '@angular/material/snack-bar';
import { Permission, RoleService } from '@app/core/services/role.service';
import { TabService } from '@app/core/services/tab.service';
import { HasPermissionPipe } from '@app/shared/pipes/has-permission.pipe';
import { Permissions } from '@app/shared/enums/app-permission.enum';

@Component({
    selector: 'permissions-component',
    templateUrl: './permissions.component.html',
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
export class PermissionsComponent implements OnInit, AfterViewInit {
    protected readonly Permissions = Permissions;
    public isLoading = signal(true);
    public displayedColumns: string[] = ['name', 'description', 'actions'];
    public dataSource = new MatTableDataSource<Permission>();
    public searchControl = new FormControl('');

    @ViewChild(MatSort) sort!: MatSort;
    @ViewChild(MatPaginator) paginator!: MatPaginator;

    private readonly roleService = inject(RoleService);
    private readonly tabService = inject(TabService);
    private readonly snackbar = inject(MatSnackBar);

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
        this.dataSource.sortingDataAccessor = (permission, property) =>
            property === 'description' ? (permission.description ?? '') : (permission as any)[property] ?? '';
        this.dataSource.filterPredicate = (permission, filter) =>
            permission.name.toLowerCase().includes(filter) ||
            (permission.description ?? '').toLowerCase().includes(filter);
    }

    loadData() {
        this.isLoading.set(true);
        this.roleService.getPermissions().subscribe({
            next: ({ data }) => {
                this.dataSource.data = data ?? [];
                this.isLoading.set(false);
            },
            error: () => this.isLoading.set(false),
        });
    }

    openCreateTab() {
        this.tabService.openTab({
            id: 'create-permission',
            label: 'Nuevo permiso',
            link: '/permissions/create',
            permission: '',
        });
    }

    deletePermission(permission: Permission) {
        this.roleService.deletePermission(permission.id).subscribe({
            next: () => { this.snackbar.open('Permiso eliminado correctamente', 'Cerrar', { duration: 4000 }); this.loadData(); },
        });
    }

}
