import { AfterViewInit, Component, computed, inject, OnInit, signal, ViewChild } from '@angular/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIcon } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Collector, PaginatedMetadata } from '@app/core/services/collector.service';
import { Assignment, AssignmentService } from '@app/core/services/assignment.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SearchCollectorComponent } from './search-collector/search-collector.component';
import { CreateAssignmentDialogComponent } from './create/create-assignment-dialog.component';
import { DatePipe } from '@angular/common';
import { FullnamePipe } from '@app/shared/pipes/fullname.pipe';

type ViewMode = 'activas' | 'huerfanas';

@Component({
    selector: 'assignaments-component',
    templateUrl: './assignments.component.html',
    imports: [
        MatTableModule,
        MatPaginatorModule,
        MatSortModule,
        MatButtonModule,
        MatButtonToggleModule,
        MatDialogModule,
        MatIcon,
        MatProgressBarModule,
        DatePipe,
        FullnamePipe,
    ],
})
export class AssignmentsComponent implements OnInit, AfterViewInit {
    public isLoading = signal(true);
    public viewMode = signal<ViewMode>('activas');
    public selectedCollector = signal<Collector | null>(null);

    private readonly initialPagination: PaginatedMetadata = {
        hasNextPage: false,
        hasPreviousPage: false,
        limit: 5,
        page: 1,
        itemCount: 0,
        pageCount: 0,
    };

    public pagination = signal<PaginatedMetadata>(this.initialPagination);

    public readonly displayedColumns = computed<string[]>(() =>
        this.viewMode() === 'activas'
            ? ['beneficient-fullname', 'collector-fullname', 'updatedAt', 'actions']
            : ['beneficient-fullname', 'updatedAt', 'actions']
    );

    public dataSource = new MatTableDataSource<Assignment>();

    @ViewChild(MatSort) sort!: MatSort;

    private readonly assignmentsService = inject(AssignmentService);
    private readonly dialog = inject(MatDialog);

    ngOnInit() {
        this.loadData(1, this.initialPagination.limit);
    }

    ngAfterViewInit(): void {
        this.dataSource.sort = this.sort;
    }

    onViewModeChange(mode: ViewMode) {
        this.viewMode.set(mode);
        this.selectedCollector.set(null);
        this.pagination.set(this.initialPagination);
        this.dataSource.data = [];
        this.loadData(1, this.initialPagination.limit);
    }

    clearFilter() {
        this.selectedCollector.set(null);
        this.loadData(1, this.pagination().limit);
    }

    loadData(page: number, limit: number, collectorId?: string) {
        this.isLoading.set(true);
        const source$ = this.viewMode() === 'huerfanas'
            ? this.assignmentsService.getOrphanedAssignments(page, limit)
            : this.assignmentsService.getAssignments(page, limit, collectorId ? { collectorId } : {});

        source$.subscribe({
            next: ({ data: { items, meta } }) => {
                this.pagination.set(meta);
                this.dataSource.data = items;
                this.dataSource.sort = this.sort;
                this.isLoading.set(false);
            },
            error: () => this.isLoading.set(false),
        });
    }

    onPageChange(event: PageEvent) {
        this.loadData(event.pageIndex + 1, event.pageSize, this.selectedCollector()?.id);
    }

    addAssignment() {
        const dialogRef = this.dialog.open(CreateAssignmentDialogComponent, {
            minWidth: '80vw',
            maxWidth: '1200px',
            disableClose: true,
            hasBackdrop: true,
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result) this.loadData(1, this.pagination().limit, this.selectedCollector()?.id);
        });
    }

    openAdvancedSearch() {
        const dialogRef = this.dialog.open(SearchCollectorComponent, {
            minWidth: '70vw',
            disableClose: true,
            hasBackdrop: true,
            data: { currentFilter: this.selectedCollector() }
        });
        dialogRef.afterClosed().subscribe((result: Collector) => {
            if (result) {
                this.selectedCollector.set(result);
                this.loadData(1, this.pagination().limit, result.id);
            }
        });
    }
}
