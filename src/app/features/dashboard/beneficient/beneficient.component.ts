import { AfterViewInit, Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import type { PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table'
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { BeneficientService, BeneficientFilters, Beneficient } from '@app/core/services/beneficient.service';
import { GenderPipe } from '@app/shared/pipes/gender.pipe';
import { StatusPipe } from '@app/shared/pipes/status.pipe';
import { TabService } from '@app/core/services/tab.service';
import { HasPermissionPipe } from '@app/shared/pipes/has-permission.pipe';
import { Permissions } from '@app/shared/enums/app-permission.enum';
import { EmptyStateComponent } from '@app/shared/components/empty-state/empty-state.component';
import { PaginatedList } from '@app/shared/utils/paginated-list';
import { ListShellComponent, ListTableDirective } from '@app/shared/components/list-shell/list-shell.component';

@Component({
    selector: 'beneficient-component',
    templateUrl: 'beneficient.component.html',
    imports: [
        ReactiveFormsModule,
        MatTableModule,
        MatSortModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        GenderPipe,
        StatusPipe,
        HasPermissionPipe,
        EmptyStateComponent,
        ListShellComponent,
        ListTableDirective,
    ],
})

export class BeneficientComponent implements OnInit, AfterViewInit {
    protected readonly Permissions = Permissions;
    private readonly list = new PaginatedList<Beneficient>();
    protected readonly isLoading = this.list.isLoading;
    protected readonly pagination = this.list.pagination;
    protected readonly dataSource = this.list.dataSource;
    public displayedColumns: string[] = ['title', 'firstname', 'firstLastname', 'secondLastname', 'beneficientNumber', 'genre', 'email', 'rfc', 'status'];
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
    isGeneratingRegistro = signal(false);

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
                this.list.resetPagination();
                this.loadData();
            });
    }

    loadData(page: number = 1, limit: number = 5) {
        this.list.startLoading();
        const filters = this.searchForm.value as BeneficientFilters;
        this.beneficientService.getBeneficents(page, limit, filters).subscribe({
            next: (response) => this.list.onSuccess(response.data.items, response.data.meta),
            error: () => this.list.onError()
        });
    }

    onPageChange(event: PageEvent) {
        const { page, limit } = this.list.paramsFromEvent(event);
        this.loadData(page, limit);
    }

    addBeneficient() {
        this.tabService.openTab({
            id: 'create-beneficient',
            label: 'Añadir bienhechor',
            link: '/beneficients/create',
            permission: 'add:beneficient'
        });
    }

    openDetail(row: Beneficient) {
        this.tabService.openTab({
            id: `beneficient-${row.id}`,
            label: `${row.firstname} ${row.firstLastname}`,
            link: `/beneficents/${row.id}`,
            permission: 'view:beneficient'
        });
    }

    generarRegistro(): void {
        this.isGeneratingRegistro.set(true);
        this.beneficientService.registroPdf().subscribe({
            next: (blob) => {
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank');
                this.isGeneratingRegistro.set(false);
            },
            error: () => this.isGeneratingRegistro.set(false),
        });
    }

}
