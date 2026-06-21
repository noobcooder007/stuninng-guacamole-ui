import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { Assignment, AssignmentService, PaginatedMetadata } from '@app/core/services/assignment.service';
import { CollectorListItem, CollectorService } from '@app/core/services/collector.service';
import { FullnamePipe } from '@app/shared/pipes/fullname.pipe';
import { HasPermissionPipe } from '@app/shared/pipes/has-permission.pipe';
import { Permissions } from '@app/shared/enums/app-permission.enum';

@Component({
    selector: 'assign-orphans',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        MatAutocompleteModule,
        MatButtonModule,
        MatCheckboxModule,
        MatFormFieldModule,
        MatIconModule,
        MatTooltipModule,
        MatInputModule,
        MatPaginatorModule,
        MatProgressBarModule,
        MatProgressSpinnerModule,
        MatTableModule,
        DatePipe,
        FullnamePipe,
        HasPermissionPipe,
    ],
    templateUrl: './assign-orphans.component.html',
})
export class AssignOrphansComponent implements OnInit {
    protected readonly Permissions = Permissions;
    private readonly router = inject(Router);
    private readonly assignmentService = inject(AssignmentService);
    private readonly collectorService = inject(CollectorService);

    private readonly initialPagination: PaginatedMetadata = {
        hasNextPage: false, hasPreviousPage: false,
        limit: 10, page: 1, itemCount: 0, pageCount: 0,
    };

    public isLoading = signal(false);
    public isSaving = signal(false);
    public pagination = signal<PaginatedMetadata>(this.initialPagination);
    public dataSource = new MatTableDataSource<Assignment>();
    public selection = new SelectionModel<Assignment>(true, []);
    public displayedColumns = ['select', 'beneficient-fullname', 'updatedAt'];

    public collectorCtrl = new FormControl('');
    public filteredCollectors = signal<CollectorListItem[]>([]);
    public selectedCollector: CollectorListItem | null = null;

    ngOnInit() {
        this.collectorService.getActiveList().subscribe(items => this.filteredCollectors.set(items));

        this.collectorCtrl.valueChanges.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            switchMap(v => this.collectorService.getActiveList(typeof v === 'string' ? v || undefined : undefined)),
        ).subscribe(items => this.filteredCollectors.set(items));

        this.loadData();
    }

    displayCollector = (c: CollectorListItem | null) =>
        c ? `${c.firstname} ${c.firstLastname} ${c.secondLastname ?? ''}`.trim() : '';

    onCollectorSelected(collector: CollectorListItem) {
        this.selectedCollector = collector;
    }

    clearCollector() {
        this.selectedCollector = null;
        this.collectorCtrl.reset('');
    }

    loadData(page = 1, limit = 10) {
        this.isLoading.set(true);
        this.assignmentService.getOrphanedAssignments(page, limit).subscribe({
            next: ({ data }) => {
                const items: Assignment[] = (data as any)?.items ?? [];
                const meta = (data as any)?.meta;
                this.pagination.set({
                    ...this.initialPagination,
                    ...(meta ?? {}),
                    itemCount: meta?.itemCount ?? items.length,
                });
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

    get canAssign(): boolean {
        return this.selectedCollector !== null && this.selection.hasValue();
    }

    assign() {
        if (!this.canAssign) return;
        this.isSaving.set(true);
        this.assignmentService.create({
            collectorId: this.selectedCollector!.id,
            beneficientsIds: this.selection.selected.map(a => a.beneficient.id),
        }).subscribe({
            next: () => {
                this.isSaving.set(false);
                this.loadData(this.pagination().page, this.pagination().limit);
            },
            error: () => this.isSaving.set(false),
        });
    }

    cancel() { this.router.navigate(['/assignments']); }
}
