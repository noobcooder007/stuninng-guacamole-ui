import { AfterViewInit, ChangeDetectorRef, Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { catchError, debounceTime, delay, distinctUntilChanged, map, of, startWith, switchMap } from 'rxjs';
import { Collector, CollectorFilters, CollectorService, PaginatedMetadata } from '@app/core/services/collector.service';
import { Assignment, AssignmentFilters, AssignmentService } from '@app/core/services/assignment.service';
import { TabService } from '@app/core/services/tab.service';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SearchCollectorComponent } from './search-collector/search-collector.component';
import { CreateAssignmentDialogComponent } from './create/create-assignment-dialog.component';
import { DatePipe } from '@angular/common';
import { FullnamePipe } from '@app/shared/pipes/fullname.pipe';

@Component({
    selector: 'assignaments-component',
    templateUrl: './assignments.component.html',
    imports: [
        ReactiveFormsModule,
        MatTableModule,
        MatPaginatorModule,
        MatSortModule,
        MatFormFieldModule,
        MatInputModule,
        MatAutocompleteModule,
        MatButtonModule,
        MatDialogModule,
        MatIcon,
        DatePipe,
        FullnamePipe,
    ],
})
export class AssignmentsComponent implements OnInit, AfterViewInit {
    public isLoading = signal(true);
    private initialPaginatedMetadata: PaginatedMetadata = {
        hasNextPage: false,
        hasPreviousPage: false,
        limit: 5,
        page: 1,
        itemCount: 0,
        pageCount: 0,
    };
    public pagination = signal<PaginatedMetadata>(this.initialPaginatedMetadata);
    public displayedColumns: string[] = ['beneficient-fullname', 'collector-fullname', 'updatedAt'];
    public dataSource = new MatTableDataSource<Assignment>();
    public searchForm = new FormGroup({
        collectorId: new FormControl<Collector | string | null>(null, [Validators.required]),
    });

    @ViewChild(MatSort) sort!: MatSort;
    @ViewChild(MatAutocompleteTrigger) autocompleteTrigger!: MatAutocompleteTrigger;

    private readonly tabService = inject(TabService);
    private readonly assignmentsService = inject(AssignmentService);
    private readonly collectorService = inject(CollectorService);
    private readonly advancedSearchDialog = inject(MatDialog);
    collectorList = signal<Collector[]>([]);

    ngOnInit() {
        this.loadCollectors();
    }

    ngAfterViewInit(): void {
        this.dataSource.sort = this.sort;
    }

    loadCollectors() {
        this.searchForm.get('collectorId')?.valueChanges.pipe(
            startWith(''),
            debounceTime(300),
            distinctUntilChanged(),
            switchMap(value => {
                const searchTerm = typeof value === 'string'
                    ? value
                    : typeof value === 'object' ? value?.firstname || '' : '';
                const filters: CollectorFilters = {
                    firstname: searchTerm,
                };
                if (searchTerm === '') this.dataSource.data = [];
                if (typeof value !== 'object') {
                    return this.collectorService.getCollectors(1, 5, filters).pipe(
                        map((response) => response.data.items),
                        catchError(() => of([])),
                        delay(0)
                    );
                }
                return of([]);
            })
        ).subscribe(collectors => this.collectorList.set(collectors));
    }

    onCollectorSelected(event: MatAutocompleteSelectedEvent) {
        const selectedCollector = event.option.value
        if (selectedCollector && selectedCollector.id) {
            this.loadAssignments(this.pagination().page + 1, this.pagination().limit, selectedCollector.id);
        }
    }

    loadAssignments(page: number, limit: number, collectorId: string) {
        if (this.searchForm.invalid) return;
        const filter: AssignmentFilters = {
            collectorId
        };
        this.isLoading.set(true);
        this.assignmentsService.getAssignments(page, limit, filter).subscribe({
            next: ({ data: { items, meta } }) => {
                this.pagination.set(meta);
                this.isLoading.set(false);
                this.dataSource.data = items;
                this.dataSource.sort = this.sort;
            },
            error: () => this.isLoading.set(false),
        });
    }

    onPageChange(event: PageEvent) {
        this.pagination.update((meta) => ({ ...meta, page: event.pageIndex + 1, limit: event.pageSize }));
        const collectorCtrl = this.searchForm.get('collectorId');
        if (typeof collectorCtrl?.value === 'object') {
            const collectorId = collectorCtrl.value!.id;
            this.loadAssignments(event.pageIndex + 1, event.pageSize, collectorId);
        }
    }

    addAssignment() {
        const dialogRef = this.advancedSearchDialog.open(CreateAssignmentDialogComponent, {
            minWidth: '80vw',
            maxWidth: '1200px',
            disableClose: true,
            hasBackdrop: true,
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                // Manejar respuesta si es necesario
            }
        });
    }

    displayFn(collector: Collector) {
        return collector && `${collector.firstname} ${collector.firstLastname} ${collector.secondLastname ?? ''}`;
    }

    openAdvancedSearch() {
        if (this.autocompleteTrigger) this.autocompleteTrigger.closePanel();
        const dialogRef = this.advancedSearchDialog.open(SearchCollectorComponent, {
            minWidth: '70vw',
            disableClose: true,
            hasBackdrop: true,
            data: { currentFilter: this.searchForm.get('collectorId')?.value }
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.searchForm.patchValue({ collectorId: result });
                const collectorCtrl = this.searchForm.get('collectorId');
                collectorCtrl?.setValue(result);
                collectorCtrl?.markAsDirty();
                collectorCtrl?.updateValueAndValidity();
                this.loadAssignments(this.pagination().page, this.pagination().limit, result.id);
            }
        });
    }
}
