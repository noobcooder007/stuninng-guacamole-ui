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
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ColectorService, Colector, ColectorFilters, PaginatedMetadata } from '@app/core/services/colector.service';
import { ColectorDetailService } from '@app/core/services/colector-detail.service';
import { ColectorDetailComponent } from './detail/colector-detail.component';

@Component({
    selector: 'app-colector',
    standalone: true,
    templateUrl: './colector.component.html',
    styleUrls: ['./colector.component.scss'],
    imports: [
        ReactiveFormsModule,
        MatTableModule,
        MatPaginatorModule,
        MatSortModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIcon,
        MatButtonToggleModule,
    ],
})
export class ColectorComponent implements OnInit, AfterViewInit {
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
    public displayedColumns: string[] = ['noColector', 'nombre', 'apPaterno', 'apMaterno', 'rfc', 'activo', 'actions'];
    public dataSource = new MatTableDataSource<Colector>();

    public searchForm = new FormGroup({
        search: new FormControl(''),
        status: new FormControl('todos'),
    });

    readonly dialog = inject(MatDialog);
    readonly colectorService = inject(ColectorService);
    readonly colectorDetailService = inject(ColectorDetailService);
    @ViewChild(MatSort) sort!: MatSort;

    ngOnInit() {
        this.setupFilters();
        this.loadData();
    }

    ngAfterViewInit(): void {
        this.dataSource.sort = this.sort;
        this.dataSource.sortingDataAccessor = (item: Colector, property: string): string | number => {
            switch (property) {
                case 'noColector': return item.noColector;
                case 'nombre': return item.nombre;
                case 'apPaterno': return item.apPaterno;
                case 'apMaterno': return item.apMaterno;
                case 'rfc': return item.rfc;
                case 'activo': return item.activo ? 'Activo' : 'Inactivo';
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

        const filters: ColectorFilters = {
            search: this.searchForm.get('search')?.value || undefined,
            status: (this.searchForm.get('status')?.value || 'todos') as 'todos' | 'activo' | 'inactivo',
        };

        this.colectorService.getColectores(page, limit, filters).subscribe({
            next: (response) => {
                this.dataSource.data = response.data.items;
                this.pagination.set(response.data.meta);
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error al cargar colectores:', error);
                this.isLoading.set(false);
            },
        });
    }

    onPageChange(event: PageEvent) {
        this.loadData(event.pageIndex + 1, event.pageSize);
    }

    addColector() {
        console.log('Agregar colector');
        // TODO: Abrir dialog de crear colector
    }

    editColector(element: any) {
        console.log('Editar colector:', element);
    }

    viewColector(element: Colector) {
        this.colectorDetailService.setColector(element);
        this.dialog.open(ColectorDetailComponent, {
            width: '90%',
            maxWidth: '1000px',
            maxHeight: '90vh',
            panelClass: 'colector-detail-dialog',
            disableClose: false,
        });
    }
}
