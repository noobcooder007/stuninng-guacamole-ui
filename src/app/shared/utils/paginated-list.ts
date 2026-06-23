import { signal } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { PageEvent } from '@angular/material/paginator';
import { PaginatedMetadata } from '@app/core/services/collector.service';

const INITIAL_META: PaginatedMetadata = {
    hasNextPage: false,
    hasPreviousPage: false,
    limit: 5,
    page: 1,
    itemCount: 0,
    pageCount: 0,
};

export class PaginatedList<T> {
    readonly isLoading = signal(true);
    readonly pagination = signal<PaginatedMetadata>({ ...INITIAL_META });
    readonly dataSource = new MatTableDataSource<T>();

    startLoading(): void {
        this.isLoading.set(true);
    }

    onSuccess(items: T[], meta: PaginatedMetadata): void {
        this.dataSource.data = items;
        this.pagination.set(meta);
        this.isLoading.set(false);
    }

    onError(): void {
        this.isLoading.set(false);
    }

    resetPagination(): void {
        this.pagination.set({ ...INITIAL_META });
    }

    paramsFromEvent(event: PageEvent): { page: number; limit: number } {
        return { page: event.pageIndex + 1, limit: event.pageSize };
    }
}
