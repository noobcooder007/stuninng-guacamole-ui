import { AfterViewInit, Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SelectionModel } from '@angular/cdk/collections';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { PaginatedMetadata } from '@app/core/services/collector.service';
import { MarkAsPaidReceiptDto, Recibo, RecibosService, ReciboFilters } from '@app/core/services/recibos.service';
import { FullnamePipe } from '@app/shared/pipes/fullname.pipe';
import { ConfirmDialogComponent } from '@app/shared/confirm-dialog/confirm-dialog.component';
import { PaymentMethodDialogComponent } from './payment-method-dialog.component';

@Component({
    selector: 'recibos-recepcion',
    templateUrl: './recibos-recepcion.component.html',
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
        MatCheckboxModule,
        MatProgressBarModule,
        MatDialogModule,
        CurrencyPipe,
        DatePipe,
        FullnamePipe,
    ],
})
export class RecibosRecepcionComponent implements OnInit, AfterViewInit {
    public isLoading = signal(true);
    public isConfirming = signal(false);

    private readonly initialPagination: PaginatedMetadata = {
        hasNextPage: false,
        hasPreviousPage: false,
        limit: 10,
        page: 1,
        itemCount: 0,
        pageCount: 0,
    };

    public pagination = signal<PaginatedMetadata>(this.initialPagination);
    public displayedColumns = ['select', 'receiptFolio', 'beneficient', 'collector', 'amount', 'date', 'actions'];
    public dataSource = new MatTableDataSource<Recibo>();
    public selection = new SelectionModel<Recibo>(true, []);

    public readonly months = [
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

    public years = Array.from(
        { length: new Date().getFullYear() - 2020 + 1 },
        (_, i) => 2020 + i
    );

    public searchForm = new FormGroup({
        month: new FormControl<string | null>(null),
        year: new FormControl<string | null>(null),
        receiptFolio: new FormControl<string | null>(null),
    });

    public folioAddControl = new FormControl<string>('', { nonNullable: true });
    public isAddingFolio = signal(false);

    @ViewChild(MatSort) sort!: MatSort;

    private readonly recibosService = inject(RecibosService);
    private readonly dialog = inject(MatDialog);
    private readonly snackbar = inject(MatSnackBar);

    ngOnInit(): void {
        this.loadRecibos(1, this.initialPagination.limit);
        this.folioAddControl.valueChanges.subscribe(() => {
            if (this.folioAddControl.errors) {
                this.folioAddControl.setErrors(null);
            }
        });
    }

    ngAfterViewInit(): void {
        this.dataSource.sort = this.sort;
    }

    loadRecibos(page: number, limit: number, filters: ReciboFilters = {}): void {
        this.isLoading.set(true);
        this.selection.clear();
        this.recibosService.getRecibos(page, limit, filters).subscribe({
            next: ({ data: { items, meta } }) => {
                this.pagination.set(meta);
                this.dataSource.data = items;
                this.dataSource.sort = this.sort;
                this.isLoading.set(false);
            },
            error: () => this.isLoading.set(false),
        });
    }

    onSearch(): void {
        const { month, year, receiptFolio } = this.searchForm.value;
        const filters: ReciboFilters = {};
        if (month) filters.month = month;
        if (year) filters.year = year;
        if (receiptFolio) filters.receiptFolio = receiptFolio;
        this.loadRecibos(1, this.pagination().limit, filters);
    }

    onClearFilters(): void {
        this.searchForm.reset();
        this.loadRecibos(1, this.pagination().limit);
    }

    onPageChange(event: PageEvent): void {
        const { month, year, receiptFolio } = this.searchForm.value;
        const filters: ReciboFilters = {};
        if (month) filters.month = month;
        if (year) filters.year = year;
        if (receiptFolio) filters.receiptFolio = receiptFolio;
        this.loadRecibos(event.pageIndex + 1, event.pageSize, filters);
    }

    isAllSelected(): boolean {
        return this.selection.selected.length === this.dataSource.data.length;
    }

    toggleAllRows(): void {
        if (this.isAllSelected()) {
            this.selection.clear();
        } else {
            this.dataSource.data.forEach(row => this.selection.select(row));
        }
    }

    onAddFolioToTable(): void {
        const folio = this.folioAddControl.value.trim();
        if (!folio || this.isAddingFolio()) return;

        this.folioAddControl.setErrors(null);
        this.isAddingFolio.set(true);

        this.recibosService.getRecibos(1, 1, { receiptFolio: folio }).subscribe({
            next: ({ data: { items } }) => {
                this.isAddingFolio.set(false);

                if (items.length === 0) {
                    this.folioAddControl.setErrors({ notFound: true });
                    this.folioAddControl.markAsTouched();
                    return;
                }

                const receipt = items[0];

                if (receipt.isReprint) {
                    this.folioAddControl.setErrors({ isReprint: true });
                    this.folioAddControl.markAsTouched();
                    return;
                }

                const alreadyInTable = this.dataSource.data.some(r => r.receiptFolio === receipt.receiptFolio);
                if (alreadyInTable) {
                    this.folioAddControl.setErrors({ duplicate: true });
                    this.folioAddControl.markAsTouched();
                    return;
                }

                this.dataSource.data = [receipt, ...this.dataSource.data];
                this.selection.select(receipt);
                this.folioAddControl.setValue('');
            },
            error: () => {
                this.isAddingFolio.set(false);
                this.folioAddControl.setErrors({ serverError: true });
                this.folioAddControl.markAsTouched();
            },
        });
    }

    confirmarIndividual(recibo: Recibo): void {
        this.abrirDialogMetodoPago([recibo]);
    }

    confirmarSeleccionados(): void {
        this.abrirDialogMetodoPago(this.selection.selected);
    }

    private abrirDialogMetodoPago(recibos: Recibo[]): void {
        const dialogRef = this.dialog.open(PaymentMethodDialogComponent, {
            data: { count: recibos.length },
            width: '400px',
        });

        dialogRef.afterClosed().subscribe((paymentMethod: string | undefined) => {
            if (!paymentMethod) return;
            const dto: { receipts: MarkAsPaidReceiptDto[] } = {
                receipts: recibos.map(r => ({ receiptFolio: r.receiptFolio, paymentMethod })),
            };
            this.isConfirming.set(true);
            this.recibosService.marcarComoPagados(dto).subscribe({
                next: () => {
                    this.snackbar.open(
                        `${recibos.length} recibo(s) marcado(s) como pagado(s)`,
                        'Cerrar',
                        { duration: 5000 }
                    );
                    this.isConfirming.set(false);
                    this.onSearch();
                },
                error: () => this.isConfirming.set(false),
            });
        });
    }
}
