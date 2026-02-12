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
import { FullnamePipe } from '@app/shared/pipes/fullname.pipe';
import { AddressPipe } from '@app/shared/pipes/address.pipe';
import { Church, ChurchFilters, ChurchService, PaginatedMetadata } from '@app/core/services/church.service';
import { AddChurchComponent } from './add/add-church.component';

@Component({
    selector: 'church',
    templateUrl: './church.component.html',
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
        FullnamePipe,
        AddressPipe,
    ],
})

export class ChurchComponent implements OnInit, AfterViewInit {
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
    public displayedColumns: string[] = ['name', 'vicaria', 'decanato', 'parroquia', 'capilla', 'priest', 'auxiliarPriest', 'address', 'phoneNumber', 'actions'];
    public dataSource = new MatTableDataSource<Church>();
    public searchForm = new FormGroup({
        name: new FormControl(''),
        vicaria: new FormControl(''),
        decanato: new FormControl(''),
        parroquia: new FormControl(''),
        capilla: new FormControl(''),
    });

    readonly addChurchDialog = inject(MatDialog);
    @ViewChild(MatSort) sort!: MatSort;

    private readonly churchService = inject(ChurchService);

    ngOnInit() {
        this.setupFilters();
        this.loadData();
    }

    ngAfterViewInit(): void {
        this.dataSource.sort = this.sort;
        this.dataSource.sortingDataAccessor = (item: Church, property: string): string | number => {
            switch (property) {
                case 'name': return item.ecclesialIdentity.name;
                case 'vicaria': return item.ecclesialIdentity.vicaria;
                case 'decanato': return item.ecclesialIdentity.decanato;
                case 'parroquia': return item.ecclesialIdentity.parroquia;
                case 'capilla': return item.ecclesialIdentity.capilla;
                case 'priest': return `${item.priest.firstname} ${item.priest.firstLastname} ${item.priest.secondLastname}`;
                case 'auxiliarPriest': return `${item.auxiliarPriest.firstname} ${item.auxiliarPriest.firstLastname} ${item.auxiliarPriest.secondLastname}`;
                case 'address': return `${item.address.street} ${item.address.numeration.noExt} ${item.address.numeration.noInt ?? ''} ${item.address.neighborhood ?? ''} ${item.address.locality} ${item.address.city} ${item.address.state} ${item.address.zipCode}`;
                case 'phoneNumber': return item.phoneNumber;
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
        const filters = this.searchForm.value as ChurchFilters;
        this.churchService.getChurches(page, limit, filters).subscribe({
            next: ({ data: { items, meta } }) => {
                this.pagination.set(meta);
                this.isLoading.set(false);
                this.dataSource.data = items;
                this.dataSource.sort = this.sort;
            },
            error: () => {
                this.isLoading.set(false);
            }
        });
    }

    onPageChange(event: PageEvent) {
        this.pagination.update((meta) => ({
            ...meta,
            page: event.pageIndex + 1,
            limit: event.pageSize
        }));
        this.loadData(event.pageIndex + 1, event.pageSize);
    }

    addChurch() {
        this.addChurchDialog.open(AddChurchComponent, {
            width: '600px',
            maxHeight: '80vh',
            disableClose: true,
            autoFocus: false,
        });
    }
}
