import { AfterViewInit, Component, inject, OnInit, signal, ViewChild } from '@angular/core';
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
import { TabService } from '@app/core/services/tab.service';
import { FullnamePipe } from '@app/shared/pipes/fullname.pipe';

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
        FullnamePipe,
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
    public displayedColumns: string[] = ['profile', 'fullname', 'nss', 'phoneNumber', 'telephoneNumber', 'commissionPercent', 'actions'];
    public dataSource = new MatTableDataSource<Collector>();
    public searchForm = new FormGroup({
        firstname: new FormControl(''),
        firstLastname: new FormControl(''),
        secondLastname: new FormControl(''),
        city: new FormControl(''),
        state: new FormControl(''),
        zipCode: new FormControl(''),
    });

    @ViewChild(MatSort) sort!: MatSort;

    private readonly tabService = inject(TabService);
    private readonly collectorService = inject(CollectorService);

    ngOnInit() {
        this.setupFilters();
        this.loadData();
    }

    ngAfterViewInit(): void {
        this.dataSource.sort = this.sort;
        this.dataSource.sortingDataAccessor = (item: Collector, property: string): string | number => {
            switch (property) {
                case 'fullname': return `${item.firstname} ${item.firstLastname} ${item.secondLastname}`;
                case 'nss': return item.nss ?? item.maskedNSS;
                case 'phoneNumber': return item.phoneNumber ?? item.maskedPhoneNumber;
                case 'telephoneNumber': return item.telephoneNumber ?? item.maskedTelephoneNumber;
                case 'commissionPercent': return item.paymentData.commissionPercent;
                default: return (item as any)[property];
            }
        };
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
        this.tabService.openTab({
            id: 'add-collector',
            label: 'Añadir colector',
            link: '/collectors/create',
            permission: 'add:collector'
        });
    }
}
