import { AfterViewInit, Component, inject, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import type { PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table'
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { FullnamePipe } from '@app/shared/pipes/fullname.pipe';
import { AddressPipe } from '@app/shared/pipes/address.pipe';
import { Church, ChurchFilters, ChurchService } from '@app/core/services/church.service';
import { TabService } from '@app/core/services/tab.service';
import { HasPermissionPipe } from '@app/shared/pipes/has-permission.pipe';
import { Permissions } from '@app/shared/enums/app-permission.enum';
import { EmptyStateComponent } from '@app/shared/components/empty-state/empty-state.component';
import { PaginatedList } from '@app/shared/utils/paginated-list';
import { ListShellComponent, ListTableDirective } from '@app/shared/components/list-shell/list-shell.component';

@Component({
    selector: 'church',
    templateUrl: './church.component.html',
    imports: [
        ReactiveFormsModule,
        MatTableModule,
        MatSortModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        FullnamePipe,
        AddressPipe,
        HasPermissionPipe,
        EmptyStateComponent,
        ListShellComponent,
        ListTableDirective,
    ],
})

export class ChurchComponent implements OnInit, AfterViewInit {
    protected readonly Permissions = Permissions;
    private readonly list = new PaginatedList<Church>();
    protected readonly isLoading = this.list.isLoading;
    protected readonly pagination = this.list.pagination;
    protected readonly dataSource = this.list.dataSource;
    public displayedColumns: string[] = ['name', 'vicaria', 'decanato', 'parroquia', 'capilla', 'priest', 'auxiliarPriest', 'address', 'phoneNumber'];
    public searchForm = new FormGroup({
        name: new FormControl(''),
        vicaria: new FormControl(''),
        decanato: new FormControl(''),
        parroquia: new FormControl(''),
        capilla: new FormControl(''),
    });

    @ViewChild(MatSort) sort!: MatSort;

    private readonly tabService = inject(TabService);
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
                this.list.resetPagination();
                this.loadData();
            });
    }

    loadData(page: number = 1, limit: number = 5) {
        this.list.startLoading();
        const filters = this.searchForm.value as ChurchFilters;
        this.churchService.getChurches(page, limit, filters).subscribe({
            next: ({ data: { items, meta } }) => {
                this.list.onSuccess(items, meta);
                this.dataSource.sort = this.sort;
            },
            error: () => this.list.onError()
        });
    }

    onPageChange(event: PageEvent) {
        const { page, limit } = this.list.paramsFromEvent(event);
        this.loadData(page, limit);
    }

    addChurch() {
        this.tabService.openTab({
            id: 'create-church',
            label: 'Añadir iglesia',
            link: '/churches/create',
            permission: 'add:church'
        });
    }

    openDetail(row: Church) {
        this.tabService.openTab({
            id: `church-${row.id}`,
            label: row.ecclesialIdentity.name,
            link: `/churches/${row.id}`,
            permission: 'view:church'
        });
    }
}
