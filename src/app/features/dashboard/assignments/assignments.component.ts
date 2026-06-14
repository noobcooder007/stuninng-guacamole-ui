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
import { DatePipe } from '@angular/common';
import { FullnamePipe } from '@app/shared/pipes/fullname.pipe';
import { TabService } from '@app/core/services/tab.service';

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
            ? ['beneficient-fullname', 'collector-fullname', 'updatedAt']
            : ['beneficient-fullname', 'updatedAt']
    );

    public dataSource = new MatTableDataSource<Assignment>();

    @ViewChild(MatSort) sort!: MatSort;

    private readonly assignmentsService = inject(AssignmentService);
    private readonly dialog = inject(MatDialog);
    private readonly tabService = inject(TabService);

    ngOnInit() {
        this.loadData(1, this.initialPagination.limit);
    }

    ngAfterViewInit(): void {
        this.dataSource.sort = this.sort;
        this.dataSource.sortingDataAccessor = (item: Assignment, property: string): string => {
            switch (property) {
                case 'beneficient-fullname':
                    return `${item.beneficient.firstname} ${item.beneficient.firstLastname} ${item.beneficient.secondLastname ?? ''}`;
                case 'collector-fullname':
                    return `${item.collector.firstname} ${item.collector.firstLastname} ${item.collector.secondLastname ?? ''}`;
                default:
                    return (item as any)[property] ?? '';
            }
        };
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
            next: ({ data }) => {
                const items: Assignment[] = (data as any)?.items ?? [];
                const meta = (data as any)?.meta;
                this.pagination.set({
                    ...this.initialPagination,
                    ...(meta ?? {}),
                    itemCount: meta?.itemCount ?? items.length,
                });
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
        this.tabService.openTab({
            id: 'add-assignment',
            label: 'Añadir asignación',
            link: '/assignments/create',
            permission: '',
        });
    }

    deactivateAssignment() {
        this.tabService.openTab({
            id: 'deactivate-assignment',
            label: 'Desactivar asignación',
            link: '/assignments/deactivate',
            permission: '',
        });
    }

    reassignAssignment() {
        this.tabService.openTab({
            id: 'reassign-assignment',
            label: 'Reasignar asignación',
            link: '/assignments/reassign',
            permission: '',
        });
    }

    assignOrphans() {
        this.tabService.openTab({
            id: 'assign-orphans',
            label: 'Asignar huérfanas',
            link: '/assignments/assign-orphans',
            permission: '',
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
