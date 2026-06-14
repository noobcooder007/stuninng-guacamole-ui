import { AfterViewInit, Component, computed, ElementRef, inject, OnInit, signal, ViewChild } from '@angular/core';
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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CurrencyPipe } from '@angular/common';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs';
import { PaginatedMetadata } from '@app/core/services/collector.service';
import { MarkAsPaidReceiptDto, Recibo, ReceiptType, RecibosService, ReciboFilters, ValidateReciboData } from '@app/core/services/recibos.service';
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
        MatProgressBarModule,
        MatProgressSpinnerModule,
        MatDividerModule,
        MatDialogModule,
        CurrencyPipe,
    ],
})
export class RecibosRecepcionComponent implements OnInit, AfterViewInit {
    public isLoading = signal(true);
    public isConfirming = signal(false);
    public isAddingFolio = signal(false);

    public queuedReceipts = signal<Recibo[]>([]);
    public queueTotals = computed(() => {
        const totals = new Map<string, number>();
        this.queuedReceipts().forEach(r => totals.set(r.currency, (totals.get(r.currency) ?? 0) + parseFloat(r.amount)));
        return Array.from(totals.entries()).map(([currency, amount]) => ({ currency, amount }));
    });
    public queueFolioSet = computed(() => new Set(this.queuedReceipts().map(r => r.folio)));

    private readonly initialPagination: PaginatedMetadata = {
        hasNextPage: false,
        hasPreviousPage: false,
        limit: 10,
        page: 1,
        itemCount: 0,
        pageCount: 0,
    };

    public pagination = signal<PaginatedMetadata>(this.initialPagination);
    public queueDisplayedColumns = ['folio', 'amount', 'remove'];
    public browseDisplayedColumns = ['folio', 'period', 'amount', 'addToQueue'];
    public dataSource = new MatTableDataSource<Recibo>();

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

    public readonly receiptTypeOptions: { value: ReceiptType; label: string }[] = [
        { value: 'RECURRING', label: 'Recurrentes' },
        { value: 'SPECIAL', label: 'Especiales' },
    ];

    public searchForm = new FormGroup({
        month: new FormControl<string | null>(null),
        year: new FormControl<string | null>(null),
        receiptFolio: new FormControl<string | null>(null),
        receiptType: new FormControl<ReceiptType | null>(null),
    });

    public folioAddControl = new FormControl<string>('', { nonNullable: true });
    private readonly FOLIO_LENGTH = 19;

    @ViewChild(MatSort) sort!: MatSort;
    @ViewChild('folioInput') folioInputRef!: ElementRef<HTMLInputElement>;

    private readonly recibosService = inject(RecibosService);
    private readonly dialog = inject(MatDialog);
    private readonly snackbar = inject(MatSnackBar);

    ngOnInit(): void {
        this.loadRecibos(1, this.initialPagination.limit);
        this.folioAddControl.valueChanges.subscribe(() => {
            if (this.folioAddControl.errors) this.folioAddControl.setErrors(null);
        });

        this.folioAddControl.valueChanges.pipe(
            debounceTime(600),
            distinctUntilChanged(),
            filter(value => value.trim().length === this.FOLIO_LENGTH),
        ).subscribe(() => this.onAddFolioToTable());
    }

    ngAfterViewInit(): void {
        this.dataSource.sort = this.sort;
        setTimeout(() => this.folioInputRef?.nativeElement?.focus(), 0);
    }

    loadRecibos(page: number, limit: number, filters: ReciboFilters = {}): void {
        this.isLoading.set(true);
        this.recibosService.getRecibos(page, limit, { status: 'PENDING', ...filters }).subscribe({
            next: ({ data: { items, meta } }) => {
                this.pagination.set(meta);
                this.dataSource.data = items;
                this.dataSource.sort = this.sort;
                this.isLoading.set(false);
            },
            error: () => this.isLoading.set(false),
        });
    }

    private currentFilters(): ReciboFilters {
        const { month, year, receiptFolio, receiptType } = this.searchForm.value;
        const filters: ReciboFilters = {};
        if (month) filters.month = month;
        if (year) filters.year = year;
        if (receiptFolio) filters.folio = receiptFolio;
        if (receiptType) filters.type = receiptType;
        return filters;
    }

    onSearch(): void {
        this.loadRecibos(1, this.pagination().limit, this.currentFilters());
    }

    onClearFilters(): void {
        this.searchForm.reset();
        this.loadRecibos(1, this.pagination().limit);
    }

    onPageChange(event: PageEvent): void {
        this.loadRecibos(event.pageIndex + 1, event.pageSize, this.currentFilters());
    }

    onAddFolioToTable(): void {
        const folio = this.folioAddControl.value.trim();
        if (!folio || this.isAddingFolio()) return;

        this.folioAddControl.setErrors(null);
        this.isAddingFolio.set(true);

        this.recibosService.validarFolio(folio).subscribe({
            next: ({ data }) => {
                this.isAddingFolio.set(false);
                const error = this.resolveValidationError(data);
                if (error) {
                    this.folioAddControl.setErrors({ [error]: true });
                    this.folioAddControl.markAsTouched();
                    return;
                }
                this.queuedReceipts.update(q => [this.buildQueueRecibo(data), ...q]);
                this.folioAddControl.setValue('');
            },
            error: (err) => {
                this.isAddingFolio.set(false);
                const key = err?.status === 404 ? 'notFound' : 'serverError';
                this.folioAddControl.setErrors({ [key]: true });
                this.folioAddControl.markAsTouched();
            },
        });
    }

    addToQueueFromBrowse(receipt: Recibo): void {
        if (this.queueFolioSet().has(receipt.folio)) {
            this.snackbar.open('El folio ya está en la cola', 'Cerrar', { duration: 3000 });
            return;
        }
        this.queuedReceipts.update(q => [receipt, ...q]);
        this.snackbar.open('Folio agregado a la cola', 'Cerrar', { duration: 2000 });
    }

    removeFromQueue(receipt: Recibo): void {
        this.queuedReceipts.update(q => q.filter(r => r.folio !== receipt.folio));
    }

    confirmarCola(): void {
        if (this.queuedReceipts().length === 0) return;
        this.abrirDialogMetodoPago(this.queuedReceipts());
    }

    periodLabel(month: number): string {
        return this.months[month - 1]?.label ?? '';
    }

    receiptTypeLabel(type?: ReceiptType): string {
        return type === 'SPECIAL' ? 'Especial' : 'Recurrente';
    }

    private resolveValidationError(data: ValidateReciboData): string | null {
        if (!data.valid) return 'notFound';
        if (data.status === 'REPRINT') return 'isReprint';
        if (data.status !== 'PENDING') return 'notFound';
        if (this.queueFolioSet().has(data.folio)) return 'duplicate';
        return null;
    }

    private buildQueueRecibo(data: ValidateReciboData): Recibo {
        return {
            id: '',
            folio: data.folio,
            type: data.type ?? 'RECURRING',
            origin: '',
            status: data.status,
            amount: data.amount,
            currency: data.currency,
            paymentMethod: null,
            externalReference: null,
            promiseDonationId: null,
            periodMonth: 0,
            periodYear: 0,
            beneficientId: '',
            collectorId: '',
            printCount: 0,
            lastPrintedAt: null,
            voidReason: null,
            createdAt: '',
            updatedAt: '',
            paidAt: null,
        };
    }

    private abrirDialogMetodoPago(recibos: Recibo[]): void {
        const dialogRef = this.dialog.open(PaymentMethodDialogComponent, {
            data: { count: recibos.length },
            width: '400px',
        });

        dialogRef.afterClosed().subscribe((paymentMethod: string | undefined) => {
            if (!paymentMethod) return;
            const dto: { receipts: MarkAsPaidReceiptDto[] } = {
                receipts: recibos.map(r => ({ folio: r.folio, paymentMethod })),
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
                    this.queuedReceipts.set([]);
                    this.onSearch();
                },
                error: () => this.isConfirming.set(false),
            });
        });
    }
}
