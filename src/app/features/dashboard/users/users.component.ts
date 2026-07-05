import { AfterViewInit, Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { User, UserService } from '@app/core/services/user.service';
import { TabService } from '@app/core/services/tab.service';
import { Permissions } from '@app/shared/enums/app-permission.enum';

@Component({
    selector: 'users-component',
    templateUrl: './users.component.html',
    standalone: true,
    imports: [
        DatePipe,
        ReactiveFormsModule,
        MatTableModule,
        MatPaginatorModule,
        MatSortModule,
        MatTabsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatProgressBarModule,
        MatTooltipModule,
    ],
})
export class UsersComponent implements OnInit, AfterViewInit {
    public isLoading = signal(true);
    public displayedColumns = ['username', 'role', 'gender', 'status', 'createdAt'];
    public dataSource = new MatTableDataSource<User>();
    public searchControl = new FormControl('');
    public uniqueRoles: string[] = [];

    @ViewChild(MatSort) sort!: MatSort;
    @ViewChild(MatPaginator) paginator!: MatPaginator;

    private allUsers: User[] = [];
    private activeRole: string | null = null;

    private readonly userService = inject(UserService);
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
        this.dataSource.sortingDataAccessor = (user, property) => {
            switch (property) {
                case 'username': return user.username.toLowerCase();
                case 'role': return user.role.toLowerCase();
                case 'createdAt': return user.createdAt;
                default: return (user as any)[property] ?? '';
            }
        };
        this.dataSource.filterPredicate = (user, filter) =>
            user.username.toLowerCase().includes(filter);
    }

    loadData() {
        this.isLoading.set(true);
        this.userService.getUsers().subscribe({
            next: (users) => {
                this.allUsers = users;
                this.uniqueRoles = [...new Set(users.map(u => u.role))].sort();
                this.applyRoleFilter();
                this.isLoading.set(false);
            },
            error: () => this.isLoading.set(false),
        });
    }

    onTabChange(event: MatTabChangeEvent) {
        this.activeRole = event.index === 0 ? null : this.uniqueRoles[event.index - 1];
        this.applyRoleFilter();
    }

    private applyRoleFilter() {
        this.dataSource.data = this.activeRole
            ? this.allUsers.filter(u => u.role === this.activeRole)
            : this.allUsers;
        this.dataSource.filter = (this.searchControl.value ?? '').trim().toLowerCase();
    }

    formatRole(role: string): string {
        return role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, ' ');
    }

    openEditTab(user: User) {
        this.tabService.openTab({
            id: `user-edit-${user.id}`,
            label: `Editar: ${user.username}`,
            link: `/users/${user.id}/edit?username=${encodeURIComponent(user.username)}&isActive=${user.isActive}`,
            permission: Permissions.EDIT_USER,
        });
    }
}
