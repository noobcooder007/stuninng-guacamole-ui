import { AfterViewInit, Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIcon } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { PaginatedMetadata } from '@app/core/services/collector.service';
import { TabService } from '@app/core/services/tab.service';
import { PromiseDonation, PromisesDonationFilters, PromisesDonationService } from '@app/core/services/promise-donation.service';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RecurrencePipe } from '@app/shared/pipes/recurrence.pipe';
import { CreatePromiseDonationDialogComponent } from './create/create-promise-donation-dialog.component';

@Component({
    selector: 'promises-donation-component',
    templateUrl: './promises-donation.component.html',
    imports: [
        ReactiveFormsModule,
        MatTableModule,
        MatPaginatorModule,
        MatSortModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatButtonToggleModule,
        MatSelectModule,
        MatDialogModule,
        MatIcon,
        CurrencyPipe,
        DatePipe,
        RecurrencePipe,
    ],
})
export class PromisesDonationComponent implements OnInit, AfterViewInit {
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
    public displayedColumns: string[] = ['currency', 'method', 'promiseAmount', 'startDate', 'lastDonation', 'nextDonation', 'recurrence', 'isActive', 'actions'];
    public dataSource = new MatTableDataSource<PromiseDonation>();
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
    private readonly dialog = inject(MatDialog);

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
        const filters = this.searchForm.value as PromisesDonationFilters;
        this.promisesService.getPromisesDonation(page, limit, filters).subscribe({
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

    addPromiseDonation() {
        const dialogRef = this.dialog.open(CreatePromiseDonationDialogComponent, {
            width: '600px',
            maxHeight: '90vh',
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.loadData();
            }
        });
    }
}
