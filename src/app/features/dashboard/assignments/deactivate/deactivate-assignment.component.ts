import { Component, inject, OnInit, signal } from '@angular/core';
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
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, forkJoin, switchMap } from 'rxjs';
import { Assignment, AssignmentService, PaginatedMetadata } from '@app/core/services/assignment.service';
import { CollectorListItem, CollectorService } from '@app/core/services/collector.service';
import { FullnamePipe } from '@app/shared/pipes/fullname.pipe';
import { ConfirmDialogComponent } from '@app/shared/components/confirm-dialog/confirm-dialog.component';
import { HasPermissionPipe } from '@app/shared/pipes/has-permission.pipe';
import { Permissions } from '@app/shared/enums/app-permission.enum';

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
        MatTableModule,
        DatePipe,
        FullnamePipe,
        HasPermissionPipe,
    ],
    templateUrl: './deactivate-assignment.component.html',
})
export class DeactivateAssignmentComponent implements OnInit {
    protected readonly Permissions = Permissions;
    private readonly router = inject(Router);
    private readonly assignmentService = inject(AssignmentService);
    private readonly collectorService = inject(CollectorService);
    private readonly dialog = inject(MatDialog);
    private readonly initialPagination: PaginatedMetadata = {
        hasNextPage: false, hasPreviousPage: false,
        limit: 10, page: 1, itemCount: 0, pageCount: 0,
    };

    public isLoading = signal(false);
    public pagination = signal<PaginatedMetadata>(this.initialPagination);
    public dataSource = new MatTableDataSource<Assignment>();
    public selection = new SelectionModel<Assignment>(true, []);
    public displayedColumns = ['select', 'beneficient-fullname', 'collector-fullname', 'updatedAt', 'actions'];

    public collectorCtrl = new FormControl('');
    public filteredCollectors = signal<CollectorListItem[]>([]);
    public selectedCollectorId: string | null = null;

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
            this.assignmentService.deactivate(assignment.id).subscribe({
                next: () => {
                    this.loadData(this.pagination().page, this.pagination().limit);
                },
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
            forkJoin(selected.map(a => this.assignmentService.deactivate(a.id))).subscribe({
                next: () => {
                    this.loadData(this.pagination().page, this.pagination().limit);
                },
            });
        });
    }

    cancel() { this.router.navigate(['/assignments']); }
}
