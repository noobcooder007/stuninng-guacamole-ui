import { TestBed } from '@angular/core/testing';
import { PageEvent } from '@angular/material/paginator';
import { PaginatedList } from '@app/shared/utils/paginated-list';
import { PaginatedMetadata } from '@app/core/services/collector.service';

const META: PaginatedMetadata = {
    page: 2,
    limit: 10,
    itemCount: 25,
    pageCount: 3,
    hasNextPage: true,
    hasPreviousPage: true,
};

describe('PaginatedList', () => {
    let list: PaginatedList<{ id: number }>;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        list = new PaginatedList();
    });

    describe('initial state', () => {
        it('should start with isLoading = true', () => {
            expect(list.isLoading()).toBe(true);
        });

        it('should start with page 1, limit 5 and zero items', () => {
            const p = list.pagination();
            expect(p.page).toBe(1);
            expect(p.limit).toBe(5);
            expect(p.itemCount).toBe(0);
        });

        it('should start with an empty dataSource', () => {
            expect(list.dataSource.data).toEqual([]);
        });
    });

    describe('startLoading()', () => {
        it('should set isLoading to true', () => {
            list.onSuccess([], META);
            expect(list.isLoading()).toBe(false);
            list.startLoading();
            expect(list.isLoading()).toBe(true);
        });
    });

    describe('onSuccess()', () => {
        it('should populate dataSource with items', () => {
            const items = [{ id: 1 }, { id: 2 }];
            list.onSuccess(items, META);
            expect(list.dataSource.data).toEqual(items);
        });

        it('should update pagination with the received meta', () => {
            list.onSuccess([], META);
            expect(list.pagination()).toEqual(META);
        });

        it('should set isLoading to false', () => {
            list.onSuccess([], META);
            expect(list.isLoading()).toBe(false);
        });
    });

    describe('onError()', () => {
        it('should set isLoading to false', () => {
            list.onError();
            expect(list.isLoading()).toBe(false);
        });

        it('should not clear the dataSource', () => {
            list.onSuccess([{ id: 1 }], META);
            list.onError();
            expect(list.dataSource.data).toEqual([{ id: 1 }]);
        });
    });

    describe('resetPagination()', () => {
        it('should reset pagination to initial values', () => {
            list.onSuccess([], META);
            list.resetPagination();
            const p = list.pagination();
            expect(p.page).toBe(1);
            expect(p.limit).toBe(5);
            expect(p.itemCount).toBe(0);
        });

        it('should produce an independent copy so future mutations do not affect initial state', () => {
            list.resetPagination();
            list.pagination.set({ ...list.pagination(), page: 99 });
            list.resetPagination();
            expect(list.pagination().page).toBe(1);
        });
    });

    describe('paramsFromEvent()', () => {
        it('should convert pageIndex 0 to page 1', () => {
            const event = { pageIndex: 0, pageSize: 10 } as PageEvent;
            expect(list.paramsFromEvent(event)).toEqual({ page: 1, limit: 10 });
        });

        it('should convert pageIndex 2 to page 3', () => {
            const event = { pageIndex: 2, pageSize: 20 } as PageEvent;
            expect(list.paramsFromEvent(event)).toEqual({ page: 3, limit: 20 });
        });
    });
});
