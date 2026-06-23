import { AfterViewInit, Component, inject, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import type { PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { Collector, CollectorFilters, CollectorService } from '@app/core/services/collector.service';
import { TabService } from '@app/core/services/tab.service';
import { FullnamePipe } from '@app/shared/pipes/fullname.pipe';
import { HasPermissionPipe } from '@app/shared/pipes/has-permission.pipe';
import { Permissions } from '@app/shared/enums/app-permission.enum';
import { EmptyStateComponent } from '@app/shared/components/empty-state/empty-state.component';
import { PaginatedList } from '@app/shared/utils/paginated-list';
import { ListShellComponent, ListTableDirective } from '@app/shared/components/list-shell/list-shell.component';

@Component({
    selector: 'collector-component',
    templateUrl: './collector.component.html',
    imports: [
        ReactiveFormsModule,
        MatTableModule,
        MatSortModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        FullnamePipe,
        HasPermissionPipe,
        EmptyStateComponent,
        ListShellComponent,
        ListTableDirective,
    ],
})
export class CollectorComponent implements OnInit, AfterViewInit {
    protected readonly Permissions = Permissions;
    private readonly list = new PaginatedList<Collector>();
    protected readonly isLoading = this.list.isLoading;
    protected readonly pagination = this.list.pagination;
    protected readonly dataSource = this.list.dataSource;
    public displayedColumns: string[] = ['profile', 'fullname', 'nss', 'phoneNumber', 'telephoneNumber', 'commissionPercent'];
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
            this.list.resetPagination();
            this.loadData();
        });
    }

    loadData(page: number = 1, limit: number = 5) {
        this.list.startLoading();
        const filters = this.searchForm.value as CollectorFilters;
        this.collectorService.getCollectors(page, limit, filters).subscribe({
            next: ({ data: { items, meta } }) => {
                this.list.onSuccess(items, meta);
                this.dataSource.sort = this.sort;
            },
            error: () => this.list.onError(),
        });
    }

    onPageChange(event: PageEvent) {
        const { page, limit } = this.list.paramsFromEvent(event);
        this.loadData(page, limit);
    }

    addCollector() {
        this.tabService.openTab({
            id: 'add-collector',
            label: 'Añadir colector',
            link: '/collectors/create',
            permission: 'add:collector'
        });
    }

    openDetail(row: Collector) {
        this.tabService.openTab({
            id: `collector-${row.id}`,
            label: `${row.firstname} ${row.firstLastname}`,
            link: `/collectors/${row.id}`,
            permission: 'view:collector'
        });
    }
}
