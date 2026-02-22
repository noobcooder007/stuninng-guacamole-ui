import { AfterViewInit, Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AddCollectorComponent } from './add/add-collector.component';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { Collector, CollectorFilters, CollectorService, PaginatedMetadata } from '@app/core/services/collector.service';

@Component({
    selector: 'collector-component',
    templateUrl: './collector.component.html',
    imports: [
        ReactiveFormsModule,
        MatTableModule,
        MatPaginatorModule,
        MatSortModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIcon,
    ],
})
export class CollectorComponent implements OnInit, AfterViewInit {
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
    public displayedColumns: string[] = ['noColector', 'nombre', 'rfc', 'telefono', 'email', 'actions'];
    public dataSource = new MatTableDataSource<Collector>();
    public searchForm = new FormGroup({
        nombre: new FormControl(''),
        apPaterno: new FormControl(''),
        apMaterno: new FormControl(''),
        noColector: new FormControl(''),
    });

    @ViewChild(MatSort) sort!: MatSort;

    private readonly collectorService = inject(CollectorService);
    readonly addCollectorDialog = inject(MatDialog);

    ngOnInit() {
        this.setupFilters();
        this.loadData();
    }

    ngAfterViewInit(): void {
        this.dataSource.sort = this.sort;
    }

    private setupFilters() {
        this.searchForm.valueChanges.pipe(debounceTime(500), distinctUntilChanged()).subscribe(() => {
            this.pagination.set(this.initialPaginatedMetadata);
            this.loadData();
        });
    }

    loadData(page: number = 1, limit: number = 5) {
        this.isLoading.set(true);
        const filters = this.searchForm.value as CollectorFilters;
        this.collectorService.getCollectors(page, limit, filters).subscribe({
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
        this.loadData(event.pageIndex + 1, event.pageSize);
    }

    addCollector() {
        this.addCollectorDialog.open(AddCollectorComponent, {
            width: '600px',
            maxHeight: '80vh',
            disableClose: true,
            autoFocus: false,
        });
    }
}
