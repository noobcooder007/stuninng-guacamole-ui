import { AfterViewInit, Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatAnchor, MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table'
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { BeneficientService, PaginatedMetadata, BeneficientFilters, Beneficient } from '@app/core/services/beneficient.service';
import { GenderPipe } from '@app/shared/pipes/gender.pipe';
import { StatusPipe } from '@app/shared/pipes/status.pipe';
import { TabService } from '@app/core/services/tab.service';

@Component({
    selector: 'beneficient-component',
    templateUrl: 'beneficient.component.html',
    imports: [
        ReactiveFormsModule,
        MatTableModule,
        MatPaginatorModule,
        MatSortModule,
        MatFormFieldModule,
        MatInputModule,
        MatAnchor,
        MatButtonModule,
        MatIcon,
        GenderPipe,
        StatusPipe,
    ],
})

export class BeneficientComponent implements OnInit, AfterViewInit {
    public isLoading = signal(true);
    private initialPaginatedMetadata: PaginatedMetadata = {
        hasNextPage: false,
        hasPreviousPage: false,
        limit: 5,
        page: 1,
        itemCount: 0,
        pageCount: 0
    };
    public pagination = signal<PaginatedMetadata>(this.initialPaginatedMetadata);
    public displayedColumns: string[] = ['title', 'firstname', 'firstLastname', 'secondLastname', 'beneficientNumber', 'genre', 'email', 'maritalStatus', 'rfc', 'status', 'actions'];
    public dataSource = new MatTableDataSource<Beneficient>();
    public searchForm = new FormGroup({
        firstname: new FormControl(''),
        firstLastname: new FormControl(''),
        secondLastname: new FormControl(''),
        city: new FormControl(''),
        state: new FormControl(''),
        zipCode: new FormControl(''),
    });

    private readonly tabService = inject(TabService);
    private readonly beneficientService = inject(BeneficientService);
    @ViewChild(MatSort) sort!: MatSort;

    ngOnInit() {
        this.setupFilters();
        this.loadData();
    }

    ngAfterViewInit(): void {
        this.dataSource.sort = this.sort;
        this.dataSource.sortingDataAccessor = (item: Beneficient, property: string): string | number => {
            switch (property) {
                default: return (item as any)[property];
            }
        };
    }

    private setupFilters() {
        this.searchForm.valueChanges
            .pipe(
                debounceTime(500),
                distinctUntilChanged()
            )
            .subscribe(() => {
                this.pagination.set(this.initialPaginatedMetadata);
                this.loadData();
            });
    }

    loadData(page: number = 1, limit: number = 5) {
        this.isLoading.set(true);
        const filters = this.searchForm.value as BeneficientFilters;
        // Llamar al servicio
        this.beneficientService.getBeneficents(page, limit, filters).subscribe({
            next: (response) => {
                this.dataSource.data = response.data.items;
                this.pagination.set(response.data.meta);
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error al cargar bienhechores:', error);
                this.isLoading.set(false);
            }
        });
    }

    onPageChange(event: PageEvent) {
        this.loadData(event.pageIndex + 1, event.pageSize);
    }

    addBeneficient() {
        this.tabService.openTab({
            id: 'create-beneficient',
            label: 'Añadir bienhechor',
            link: '/beneficients/create',
            permission: 'add:beneficient'
        });
    }

    editBeneficient(id: string) {}

    viewBeneficient(id: string) {}
}
