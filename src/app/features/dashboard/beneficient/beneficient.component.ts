import { AfterViewInit, Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatAnchor, MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table'
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { BeneficientService, Beneficent, BeneficientFilters, PaginatedMetadata } from '@app/core/services/beneficent.service';
import { BeneficientDetailService } from '@app/core/services/beneficent-detail.service';
import { BeneficientDetailComponent } from './detail/beneficent-detail.component';

@Component({
    selector: 'beneficient-component',
    standalone: true,
    templateUrl: 'beneficient.component.html',
    styleUrls: ['beneficient.component.scss'],
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
    public displayedColumns: string[] = ['noBienhechor', 'nombre', 'razonSocial', 'persona', 'activo', 'actions'];
    public dataSource = new MatTableDataSource<Beneficent>();
    public searchForm = new FormGroup({
        nombre: new FormControl(''),
        apPaterno: new FormControl(''),
        apMaterno: new FormControl(''),
        tipoPersona: new FormControl(''),
        rfc: new FormControl(''),
        razonSocial: new FormControl(''),
        status: new FormControl(''),
        noBienhechor: new FormControl(''),
    });

    readonly dialog = inject(MatDialog);
    readonly beneficientService = inject(BeneficientService);
    readonly beneficientDetailService = inject(BeneficientDetailService);
    @ViewChild(MatSort) sort!: MatSort;

    ngOnInit() {
        this.setupFilters();
        this.loadData();
    }

    ngAfterViewInit(): void {
        this.dataSource.sort = this.sort;
        this.dataSource.sortingDataAccessor = (item: Beneficent, property: string): string | number => {
            switch (property) {
                case 'noBienhechor': return item.noBienhechor;
                case 'nombre': return item.nombre;
                case 'razonSocial': return item.razonSocial;
                case 'persona': return item.persona;
                case 'activo': return item.activo ? 'Sí' : 'No';
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

        // Construir filtros desde el formulario
        const filters: BeneficientFilters = {
            nombre: this.searchForm.get('nombre')?.value || undefined,
            apPaterno: this.searchForm.get('apPaterno')?.value || undefined,
            apMaterno: this.searchForm.get('apMaterno')?.value || undefined,
            tipoPersona: this.searchForm.get('tipoPersona')?.value || undefined,
            rfc: this.searchForm.get('rfc')?.value || undefined,
            razonSocial: this.searchForm.get('razonSocial')?.value || undefined,
            status: this.searchForm.get('status')?.value || undefined,
            noBienhechor: this.searchForm.get('noBienhechor')?.value || undefined,
        };

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

    addBeneficent() {
        console.log('Agregar bienhechores');
    }

    editBeneficent(element: any) {
        console.log('Editar bienhechores:', element);
    }

    viewBeneficent(element: any) {
        // Guardar los datos en el servicio
        this.beneficientDetailService.setBeneficent(element);

        // Abrir dialog
        this.dialog.open(BeneficientDetailComponent, {
            width: '90%',
            maxWidth: '1000px',
            maxHeight: '90vh',
            panelClass: 'beneficent-detail-dialog',
            disableClose: false,
        });
    }
}
