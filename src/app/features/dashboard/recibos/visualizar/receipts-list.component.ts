import { AfterViewInit, Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CurrencyPipe } from '@angular/common';
import { PaginatedMetadata } from '@app/core/services/collector.service';
import { Recibo, ReceiptType, RecibosService, ReciboFilters } from '@app/core/services/recibos.service';
import { TabService } from '@app/core/services/tab.service';
import { Permissions } from '@app/shared/enums/app-permission.enum';
import { EmptyStateComponent } from '@app/shared/components/empty-state/empty-state.component';

@Component({
    selector: 'receipts-list',
    templateUrl: './receipts-list.component.html',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        MatTableModule,
        MatPaginatorModule,
        MatSortModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatIconModule,
        MatProgressBarModule,
        CurrencyPipe,
        EmptyStateComponent,
    ],
})
export class ReceiptsListComponent implements OnInit, AfterViewInit {
    private readonly recibosService = inject(RecibosService);
    private readonly tabService = inject(TabService);

    isLoading = signal(true);

    private readonly initialPagination: PaginatedMetadata = {
        hasNextPage: false,
        hasPreviousPage: false,
        limit: 10,
        page: 1,
        itemCount: 0,
        pageCount: 0,
    };

    pagination = signal<PaginatedMetadata>(this.initialPagination);
    dataSource = new MatTableDataSource<Recibo>();
    displayedColumns = ['folio', 'type', 'status', 'period', 'amount', 'actions'];

    readonly months = [
        { value: '01', label: 'Enero' },
        { value: '02', label: 'Febrero' },
        { value: '03', label: 'Marzo' },
        { value: '04', label: 'Abril' },
        { value: '05', label: 'Mayo' },
        { value: '06', label: 'Junio' },
        { value: '07', label: 'Julio' },
        { value: '08', label: 'Agosto' },
        { value: '09', label: 'Septiembre' },
        { value: '10', label: 'Octubre' },
        { value: '11', label: 'Noviembre' },
        { value: '12', label: 'Diciembre' },
    ];

    years = Array.from(
        { length: new Date().getFullYear() - 2020 + 1 },
        (_, i) => 2020 + i
    );

    readonly receiptTypeOptions: { value: ReceiptType; label: string }[] = [
        { value: 'RECURRING', label: 'Recurrentes' },
        { value: 'SPECIAL', label: 'Especiales' },
    ];

    readonly statusOptions = [
        { value: 'PENDING', label: 'Pendiente' },
        { value: 'PAID', label: 'Pagado' },
        { value: 'CANCELLED', label: 'Cancelado' },
        { value: 'REPRINT', label: 'Reimpresión' },
    ];

    searchForm = new FormGroup({
        folio: new FormControl<string | null>(null),
        status: new FormControl<string | null>(null),
        receiptType: new FormControl<ReceiptType | null>(null),
        month: new FormControl<string | null>(null),
        year: new FormControl<string | null>(null),
    });

    @ViewChild(MatSort) sort!: MatSort;

    ngOnInit(): void {
        this.loadReceipts(1, this.initialPagination.limit);
    }

    ngAfterViewInit(): void {
        this.dataSource.sort = this.sort;
        this.dataSource.sortingDataAccessor = (item: Recibo, property: string): string | number => {
            switch (property) {
                case 'period': return item.periodYear * 100 + item.periodMonth;
                case 'amount': return parseFloat(item.amount);
                default: return (item as any)[property] ?? '';
            }
        };
    }

    loadReceipts(page: number, limit: number, filters: ReciboFilters = {}): void {
        this.isLoading.set(true);
        this.recibosService.getRecibos(page, limit, filters).subscribe({
            next: ({ data: { items, meta } }) => {
                this.pagination.set(meta);
                this.dataSource.data = items;
                this.isLoading.set(false);
            },
            error: () => this.isLoading.set(false),
        });
    }

    private currentFilters(): ReciboFilters {
        const { folio, status, receiptType, month, year } = this.searchForm.value;
        const filters: ReciboFilters = {};
        if (folio) filters.folio = folio;
        if (status) filters.status = status;
        if (receiptType) filters.type = receiptType;
        if (month) filters.month = month;
        if (year) filters.year = year;
        return filters;
    }

    onSearch(): void {
        this.loadReceipts(1, this.pagination().limit, this.currentFilters());
    }

    onClearFilters(): void {
        this.searchForm.reset();
        this.loadReceipts(1, this.pagination().limit);
    }

    onPageChange(event: PageEvent): void {
        this.loadReceipts(event.pageIndex + 1, event.pageSize, this.currentFilters());
    }

    openDetail(receipt: Recibo): void {
        this.tabService.openTab({
            id: `receipt-${receipt.folio}`,
            label: receipt.folio,
            link: `/receipts/list/${receipt.folio}`,
            permission: Permissions.VIEW_INVOICE,
        });
    }

    periodLabel(month: number): string {
        return this.months[month - 1]?.label ?? '';
    }

    statusLabel(status: string): string {
        return this.statusOptions.find(s => s.value === status)?.label ?? status;
    }

    statusClass(status: string): string {
        switch (status) {
            case 'PAID': return 'bg-green-100 text-green-700';
            case 'CANCELLED': return 'bg-red-100 text-red-700';
            case 'REPRINT': return 'bg-yellow-100 text-yellow-700';
            default: return 'bg-blue-100 text-blue-700';
        }
    }
}
