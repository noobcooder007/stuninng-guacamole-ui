import { Component, Inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Beneficient, BeneficientFilters, BeneficientService, PaginatedMetadata } from '@app/core/services/beneficient.service';
import { FullnamePipe } from '@app/shared/pipes/fullname.pipe';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
    selector: 'search-beneficient',
    templateUrl: 'search-beneficient.component.html',
    imports: [
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatTableModule,
        MatPaginatorModule,
        MatButtonModule,
        FullnamePipe,
    ],
})

export class SearchBeneficientComponent implements OnInit {
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
    public displayedColumns: string[] = ['beneficientNumber', 'fullname', 'actions'];
    public dataSource = new MatTableDataSource<Beneficient>();
    public searchForm = new FormGroup({
        firstname: new FormControl(''),
        firstLastname: new FormControl(''),
        secondLastname: new FormControl(''),
    });

    @ViewChild(MatSort) sort!: MatSort;

    constructor(
        private beneficientService: BeneficientService,
        public dialogRef: MatDialogRef<SearchBeneficientComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any // Recibe lo que el usuario escribió en el input
    ) {
        const firstname = data.currentFilter && typeof data.currentFilter === 'object' ? data.currentFilter.firstname : data.currentFilter;
        const firstLastname = data.currentFilter && typeof data.currentFilter === 'object' ? data.currentFilter.firstLastname : data.currentFilter;
        const secondLastname = data.currentFilter && typeof data.currentFilter === 'object' ? data.currentFilter.secondLastname : data.currentFilter;
        this.searchForm.patchValue({ firstname: firstname || '' });
        this.searchForm.patchValue({ firstLastname: firstLastname || '' });
        this.searchForm.patchValue({ secondLastname: secondLastname || '' });
    }

    ngOnInit() {
        this.setupFilters();
        this.loadData();
    }

    ngAfterViewInit(): void {
        this.dataSource.sort = this.sort;
        this.dataSource.sortingDataAccessor = (item: Beneficient, property: string): string | number => {
            switch (property) {
                case 'fullname': return `${item.firstname} ${item.firstLastname} ${item.secondLastname}`;
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
        const filters = this.searchForm.value as BeneficientFilters;
        this.beneficientService.getBeneficents(page, limit, filters).subscribe({
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

    onSelect(item: Beneficient) {
        this.dialogRef.close(item); // Retornamos el objeto elegido
    }
}
