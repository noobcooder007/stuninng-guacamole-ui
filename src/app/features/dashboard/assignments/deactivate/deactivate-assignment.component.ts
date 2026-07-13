import { AfterViewInit, Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { DatePipe } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, forkJoin, switchMap } from 'rxjs';
import { Assignment, AssignmentService, PaginatedMetadata } from '@app/core/services/assignment.service';
import { CollectorListItem, CollectorService } from '@app/core/services/collector.service';
import { FullnamePipe } from '@app/shared/pipes/fullname.pipe';
import { ConfirmDialogComponent } from '@app/shared/components/confirm-dialog/confirm-dialog.component';
import { HasPermissionPipe } from '@app/shared/pipes/has-permission.pipe';
import { Permissions } from '@app/shared/enums/app-permission.enum';
import { EmptyStateComponent } from '@app/shared/components/empty-state/empty-state.component';

@Component({
    selector: 'deactivate-assignment',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        MatButtonModule,
        MatCheckboxModule,
        MatDialogModule,
        MatFormFieldModule,
        MatAutocompleteModule,
        MatInputModule,
        MatIconModule,
        MatPaginatorModule,
        MatProgressBarModule,
        MatProgressSpinnerModule,
        MatSortModule,
        MatTableModule,
        DatePipe,
        FullnamePipe,
        HasPermissionPipe,
        EmptyStateComponent,
    ],
    templateUrl: './deactivate-assignment.component.html',
})
export class DeactivateAssignmentComponent implements OnInit, AfterViewInit {
    protected readonly Permissions = Permissions;
    private readonly router = inject(Router);
    private readonly assignmentService = inject(AssignmentService);
    private readonly collectorService = inject(CollectorService);
    private readonly dialog = inject(MatDialog);
    private readonly snackbar = inject(MatSnackBar);
    private readonly initialPagination: PaginatedMetadata = {
        hasNextPage: false, hasPreviousPage: false,
        limit: 10, page: 1, itemCount: 0, pageCount: 0,
    };

    public isLoading = signal(false);
    public isDeactivatingSelected = signal(false);
    public deactivatingId = signal<string | null>(null);
    public pagination = signal<PaginatedMetadata>(this.initialPagination);
    public dataSource = new MatTableDataSource<Assignment>();
    public selection = new SelectionModel<Assignment>(true, []);
    public displayedColumns = ['select', 'beneficient-fullname', 'collector-fullname', 'updatedAt', 'actions'];

    @ViewChild(MatSort) sort!: MatSort;

    public collectorCtrl = new FormControl('');
    public filteredCollectors = signal<CollectorListItem[]>([]);
    public selectedCollectorId: string | null = null;

    ngAfterViewInit(): void {
        this.dataSource.sort = this.sort;
        this.dataSource.sortingDataAccessor = (item: Assignment, property: string): string => {
            switch (property) {
                case 'beneficient-fullname':
                    return `${item.beneficient.firstLastname} ${item.beneficient.secondLastname ?? ''} ${item.beneficient.firstname}`.toLowerCase();
                case 'collector-fullname':
                    return `${item.collector.firstLastname} ${item.collector.secondLastname ?? ''} ${item.collector.firstname}`.toLowerCase();
                case 'updatedAt':
                    return item.updatedAt;
                default:
                    return (item as any)[property] ?? '';
            }
        };
    }

    ngOnInit() {
        this.collectorService.getActiveList().subscribe(items => {
            this.filteredCollectors.set(items);
        });
        this.collectorCtrl.valueChanges.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            switchMap(v => this.collectorService.getActiveList(typeof v === 'string' ? v : undefined)),
        ).subscribe(items => this.filteredCollectors.set(items));
        this.loadData();
    }

    displayCollector = (c: CollectorListItem | null) =>
        c ? `${c.firstname} ${c.firstLastname} ${c.secondLastname ?? ''}`.trim() : '';

    onCollectorSelected(collector: CollectorListItem) {
        this.selectedCollectorId = collector.id;
        this.selection.clear();
        this.pagination.set(this.initialPagination);
        this.loadData();
    }

    clearFilter() {
        this.selectedCollectorId = null;
        this.collectorCtrl.reset('');
        this.selection.clear();
        this.pagination.set(this.initialPagination);
        this.loadData();
    }

    loadData(page = 1, limit = 10) {
        this.isLoading.set(true);
        const filters = this.selectedCollectorId ? { collectorId: this.selectedCollectorId } : {};
        this.assignmentService.getAssignments(page, limit, filters).subscribe({
            next: ({ data: { items, meta } }) => {
                this.pagination.set(meta);
                this.dataSource.data = items;
                this.selection.clear();
                this.isLoading.set(false);
            },
            error: () => this.isLoading.set(false),
        });
    }

    onPageChange(event: PageEvent) {
        this.loadData(event.pageIndex + 1, event.pageSize);
    }

    isAllSelected() {
        return this.selection.selected.length === this.dataSource.data.length && this.dataSource.data.length > 0;
    }

    toggleAll() {
        this.isAllSelected()
            ? this.selection.clear()
            : this.dataSource.data.forEach(row => this.selection.select(row));
    }

    deactivateOne(assignment: Assignment) {
        this.dialog.open(ConfirmDialogComponent, {
            data: {
                title: 'Desactivar asignación',
                message: `¿Desactivar la asignación de ${assignment.beneficient.firstname} ${assignment.beneficient.firstLastname}?`,
                confirmLabel: 'Desactivar',
            },
        }).afterClosed().subscribe(confirmed => {
            if (!confirmed) return;
            this.deactivatingId.set(assignment.id);
            this.assignmentService.deactivate(assignment.id).subscribe({
                next: () => {
                    this.snackbar.open('Asignación desactivada correctamente', 'Cerrar', { duration: 4000 });
                    this.deactivatingId.set(null);
                    this.loadData(this.pagination().page, this.pagination().limit);
                },
                error: () => this.deactivatingId.set(null),
            });
        });
    }

    deactivateSelected() {
        const selected = this.selection.selected;
        this.dialog.open(ConfirmDialogComponent, {
            data: {
                title: 'Desactivar asignaciones',
                message: `¿Desactivar las ${selected.length} asignaciones seleccionadas?`,
                confirmLabel: 'Desactivar',
            },
        }).afterClosed().subscribe(confirmed => {
            if (!confirmed) return;
            this.isDeactivatingSelected.set(true);
            forkJoin(selected.map(a => this.assignmentService.deactivate(a.id))).subscribe({
                next: () => {
                    this.snackbar.open(`${selected.length} asignaciones desactivadas correctamente`, 'Cerrar', { duration: 4000 });
                    this.isDeactivatingSelected.set(false);
                    this.loadData(this.pagination().page, this.pagination().limit);
                },
                error: () => this.isDeactivatingSelected.set(false),
            });
        });
    }

    cancel() { this.router.navigate(['/assignments']); }
}
