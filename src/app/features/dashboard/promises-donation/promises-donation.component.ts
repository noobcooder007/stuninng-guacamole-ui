import { AfterViewInit, Component, inject, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import type { PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSelectModule } from '@angular/material/select';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { TabService } from '@app/core/services/tab.service';
import { PromiseDonation, PromisesDonationFilters, PromisesDonationService } from '@app/core/services/promise-donation.service';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RecurrencePipe } from '@app/shared/pipes/recurrence.pipe';
import { FullnamePipe } from '@app/shared/pipes/fullname.pipe';
import { HasPermissionPipe } from '@app/shared/pipes/has-permission.pipe';
import { Permissions } from '@app/shared/enums/app-permission.enum';
import { EmptyStateComponent } from '@app/shared/components/empty-state/empty-state.component';
import { PaginatedList } from '@app/shared/utils/paginated-list';
import { ListShellComponent, ListTableDirective } from '@app/shared/components/list-shell/list-shell.component';

@Component({
    selector: 'promises-donation-component',
    templateUrl: './promises-donation.component.html',
    imports: [
        ReactiveFormsModule,
        MatTableModule,
        MatSortModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatButtonToggleModule,
        MatSelectModule,
        CurrencyPipe,
        DatePipe,
        RecurrencePipe,
        FullnamePipe,
        HasPermissionPipe,
        EmptyStateComponent,
        ListShellComponent,
        ListTableDirective,
    ],
})
export class PromisesDonationComponent implements OnInit, AfterViewInit {
    protected readonly Permissions = Permissions;
    private readonly list = new PaginatedList<PromiseDonation>();
    protected readonly isLoading = this.list.isLoading;
    protected readonly pagination = this.list.pagination;
    protected readonly dataSource = this.list.dataSource;
    public displayedColumns: string[] = ['fullname', 'beneficientNumber', 'currency', 'method', 'promiseAmount', 'startDate', 'lastDonation', 'nextDonation', 'recurrence'];
    public searchForm = new FormGroup({
        currency: new FormControl(''),
        method: new FormControl(''),
        recurrence: new FormControl(''),
        isActive: new FormControl(null),
    });
    public recurrences: { value: number, label: string }[] = [
        { value: 1, label: 'Mensual' },
        { value: 2, label: 'Bimestral' },
        { value: 3, label: 'Trimestral' },
        { value: 4, label: 'Cuatrimestral' },
        { value: 6, label: 'Semestral' },
        { value: 12, label: 'Anual' },
    ];

    @ViewChild(MatSort) sort!: MatSort;

    private readonly tabService = inject(TabService);
    private readonly promisesService = inject(PromisesDonationService);

    ngOnInit() {
        this.setupFilters();
        this.loadData();
    }

    ngAfterViewInit(): void {
        this.dataSource.sort = this.sort;
        this.dataSource.sortingDataAccessor = (item, property) => {
            switch (property) {
                case 'fullname': return `${item.beneficient?.firstname} ${item.beneficient?.firstLastname} ${item.beneficient?.secondLastname}`;
                case 'beneficientNumber': return item.beneficient?.beneficientNumber;
                default: {
                    const value = item[property as keyof PromiseDonation];
                    return (typeof value === 'string' || typeof value === 'number')
                        ? value
                        : String(value);
                }
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
        const filters = this.searchForm.value as PromisesDonationFilters;
        this.promisesService.getPromisesDonationWithBeneficients(page, limit, filters).subscribe({
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

    openDetail(promise: PromiseDonation) {
        this.tabService.openTab({
            id: `promise-detail-${promise.id}`,
            label: `${promise.beneficient.firstname} ${promise.beneficient.firstLastname}`,
            link: `/promises-donation/${promise.id}`,
            permission: Permissions.VIEW_PROMISE,
        });
    }

    addPromiseDonation() {
        this.tabService.openTab({
            id: 'create-promise-donation',
            label: 'Añadir promesa de donación',
            link: '/promises-donation/create',
            permission: Permissions.ADD_PROMISE,
        });
    }
}
