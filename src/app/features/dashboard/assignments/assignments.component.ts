import { AfterViewInit, Component, computed, inject, OnInit, signal, ViewChild } from '@angular/core';
import type { PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, filter, switchMap } from 'rxjs';
import { CollectorListItem, CollectorService } from '@app/core/services/collector.service';
import { Assignment, AssignmentService } from '@app/core/services/assignment.service';
import { DatePipe } from '@angular/common';
import { FullnamePipe } from '@app/shared/pipes/fullname.pipe';
import { TabService } from '@app/core/services/tab.service';
import { HasPermissionPipe } from '@app/shared/pipes/has-permission.pipe';
import { Permissions } from '@app/shared/enums/app-permission.enum';
import { EmptyStateComponent } from '@app/shared/components/empty-state/empty-state.component';
import { PaginatedList } from '@app/shared/utils/paginated-list';
import { ListShellComponent, ListTableDirective } from '@app/shared/components/list-shell/list-shell.component';

type ViewMode = 'activas' | 'huerfanas';

@Component({
    selector: 'assignaments-component',
    templateUrl: './assignments.component.html',
    imports: [
        MatTableModule,
        MatSortModule,
        MatButtonModule,
        MatButtonToggleModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatAutocompleteModule,
        MatTooltipModule,
        ReactiveFormsModule,
        DatePipe,
        FullnamePipe,
        HasPermissionPipe,
        EmptyStateComponent,
        ListShellComponent,
        ListTableDirective,
    ],
})
export class AssignmentsComponent implements OnInit, AfterViewInit {
    protected readonly Permissions = Permissions;
    private readonly list = new PaginatedList<Assignment>();
    protected readonly isLoading = this.list.isLoading;
    protected readonly pagination = this.list.pagination;
    protected readonly dataSource = this.list.dataSource;
    public viewMode = signal<ViewMode>('activas');
    public selectedCollector = signal<CollectorListItem | null>(null);

    public collectorCtrl = new FormControl('');
    public filteredCollectors = signal<CollectorListItem[]>([]);
    public isLoadingCollectors = signal(false);

    displayCollector = (option: CollectorListItem | null) =>
        option ? `${option.firstname} ${option.firstLastname} ${option.secondLastname ?? ''}`.trim() : '';

    public readonly displayedColumns = computed<string[]>(() =>
        this.viewMode() === 'activas'
            ? ['beneficient-fullname', 'collector-fullname', 'updatedAt']
            : ['beneficient-fullname', 'updatedAt']
    );

    @ViewChild(MatSort) sort!: MatSort;

    private readonly assignmentsService = inject(AssignmentService);
    private readonly collectorService = inject(CollectorService);
    private readonly tabService = inject(TabService);

    ngOnInit() {
        this.loadData(1, this.list.pagination().limit);
        this.setupCollectorSearch();
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
        this.collectorCtrl.reset('');
        this.list.resetPagination();
        this.dataSource.data = [];
        this.loadData(1, 5);
    }

    clearFilter() {
        this.selectedCollector.set(null);
        this.collectorCtrl.reset('');
        this.loadData(1, this.pagination().limit);
    }

    private setupCollectorSearch() {
        this.isLoadingCollectors.set(true);
        this.collectorService.getActiveList().subscribe({
            next: items => {
                this.filteredCollectors.set(items);
                this.isLoadingCollectors.set(false);
            },
            error: () => this.isLoadingCollectors.set(false),
        });

        this.collectorCtrl.valueChanges.pipe(
            filter(v => typeof v === 'string'),
            debounceTime(300),
            distinctUntilChanged(),
            switchMap(v => {
                const term = (v as string).trim();
                this.isLoadingCollectors.set(true);
                return this.collectorService.getActiveList(term || undefined);
            }),
        ).subscribe({
            next: items => {
                this.filteredCollectors.set(items);
                this.isLoadingCollectors.set(false);
            },
            error: () => this.isLoadingCollectors.set(false),
        });
    }

    onCollectorSelected(option: CollectorListItem) {
        this.selectedCollector.set(option);
        this.loadData(1, this.pagination().limit, option.id);
    }

    loadData(page: number, limit: number, collectorId?: string) {
        this.list.startLoading();
        const source$ = this.viewMode() === 'huerfanas'
            ? this.assignmentsService.getOrphanedAssignments(page, limit)
            : this.assignmentsService.getAssignments(page, limit, collectorId ? { collectorId } : {});

        source$.subscribe({
            next: ({ data }) => {
                const items: Assignment[] = (data as any)?.items ?? [];
                const meta = (data as any)?.meta ?? { hasNextPage: false, hasPreviousPage: false, limit: 5, page: 1, itemCount: items.length, pageCount: 1 };
                this.list.onSuccess(items, meta);
                this.dataSource.sort = this.sort;
            },
            error: () => this.list.onError(),
        });
    }

    onPageChange(event: PageEvent) {
        const { page, limit } = this.list.paramsFromEvent(event);
        this.loadData(page, limit, this.selectedCollector()?.id);
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
}
