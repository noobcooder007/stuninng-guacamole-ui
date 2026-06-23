import { Component, Directive, input, output } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { PaginatedMetadata } from '@app/core/services/collector.service';

@Directive({ selector: '[appListTable]', standalone: true })
export class ListTableDirective {}

@Component({
    selector: 'app-list-shell',
    standalone: true,
    imports: [MatProgressBarModule, MatPaginatorModule],
    template: `
        <div class="flex flex-col h-full w-full overflow-x-auto no-scrollbar p-6 gap-4">
            <ng-content />
            @if (isLoading()) {
                <mat-progress-bar mode="indeterminate" />
            }
            <ng-content select="[appListTable]" />
            <mat-paginator
                [length]="pagination().itemCount"
                [pageSize]="pagination().limit"
                [pageIndex]="pagination().page - 1"
                [pageSizeOptions]="pageSizeOptions()"
                (page)="pageChange.emit($event)"
                showFirstLastButtons
            />
        </div>
    `,
})
export class ListShellComponent {
    isLoading = input.required<boolean>();
    pagination = input.required<PaginatedMetadata>();
    pageSizeOptions = input([5, 10, 20]);
    pageChange = output<PageEvent>();
}
