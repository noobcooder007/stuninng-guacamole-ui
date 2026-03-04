import { AfterViewInit, Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { BeneficientService, Beneficient, BeneficientFilters, PaginatedMetadata } from '@app/core/services/beneficient.service';

@Component({
    selector: 'app-recibos-especiales',
    standalone: true,
    templateUrl: './recibos-especiales.component.html',
    imports: [
        ReactiveFormsModule,
        MatTableModule,
        MatPaginatorModule,
        MatSortModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIcon,
    ],
})
export class RecibosEspecialesComponent implements OnInit, AfterViewInit {
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
    public displayedColumns: string[] = ['noBienhechor', 'nombre', 'razonSocial', 'persona', 'activo', 'actions'];
    public dataSource = new MatTableDataSource<Beneficient>();
    public searchForm = new FormGroup({
        nombre: new FormControl(''),
        apPaterno: new FormControl(''),
        apMaterno: new FormControl(''),
        tipoPersona: new FormControl(''),
        razonSocial: new FormControl(''),
    });

    readonly dialog = inject(MatDialog);
    readonly beneficientService = inject(BeneficientService);
    @ViewChild(MatSort) sort!: MatSort;

    ngOnInit() {
        this.setupFilters();
        this.loadData();
    }

    ngAfterViewInit(): void {
        this.dataSource.sort = this.sort;
        this.dataSource.sortingDataAccessor = (item: Beneficient, property: string): string | number => {
            switch (property) {
                // case 'noBienhechor': return item.noBienhechor;
                // case 'nombre': return item.nombre;
                // case 'razonSocial': return item.razonSocial;
                // case 'persona': return item.persona;
                // case 'activo': return item.activo ? 'Sí' : 'No';
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
        // Para recibos especiales, probablemente necesitaríamos un endpoint diferente
        // Por ahora usamos beneficents como ejemplo
        this.beneficientService.getBeneficents(page, limit, filters).subscribe({
            next: (response) => {
                // Filtrar solo aquellos que tienen recibos especiales
                this.dataSource.data = response.data.items;
                this.pagination.set(response.data.meta);
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error al cargar recibos especiales:', error);
                this.isLoading.set(false);
            },
        });
    }

    onPageChange(event: PageEvent) {
        this.loadData(event.pageIndex + 1, event.pageSize);
    }
}
