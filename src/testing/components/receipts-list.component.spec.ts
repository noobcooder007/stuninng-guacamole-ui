import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { ReceiptsListComponent } from '@app/features/dashboard/recibos/visualizar/receipts-list.component';
import { RecibosService } from '@app/core/services/recibos.service';
import { TabService } from '@app/core/services/tab.service';
import { Permissions } from '@app/shared/enums/app-permission.enum';

const emptyPage = {
    statusCode: 200,
    data: { items: [], meta: { page: 1, limit: 10, itemCount: 0, pageCount: 0, hasNextPage: false, hasPreviousPage: false } },
    timestamp: '',
};

describe('ReceiptsListComponent', () => {
    let component: ReceiptsListComponent;
    const recibosServiceSpy = { getRecibos: vi.fn().mockReturnValue(of(emptyPage)) };
    const tabServiceSpy = { openTab: vi.fn() };

    beforeEach(() => {
        recibosServiceSpy.getRecibos.mockReturnValue(of(emptyPage));
        TestBed.configureTestingModule({
            imports: [ReceiptsListComponent],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                provideAnimationsAsync(),
                provideRouter([]),
                { provide: RecibosService, useValue: recibosServiceSpy },
                { provide: TabService, useValue: tabServiceSpy },
                { provide: MatSnackBar, useValue: { open: vi.fn() } },
            ],
        });
        component = TestBed.createComponent(ReceiptsListComponent).componentInstance;
    });

    afterEach(() => vi.clearAllMocks());

    describe('statusLabel()', () => {
        it('should map PENDING to Pendiente', () => {
            expect(component.statusLabel('PENDING')).toBe('Pendiente');
        });
        it('should map PAID to Pagado', () => {
            expect(component.statusLabel('PAID')).toBe('Pagado');
        });
        it('should map VOID to Cancelado', () => {
            expect(component.statusLabel('VOID')).toBe('Cancelado');
        });
        it('should map REPRINT to Reimpresión', () => {
            expect(component.statusLabel('REPRINT')).toBe('Reimpresión');
        });
        it('should return the raw value for unknown statuses', () => {
            expect(component.statusLabel('UNKNOWN')).toBe('UNKNOWN');
        });
    });

    describe('statusClass()', () => {
        it('should return green classes for PAID', () => {
            expect(component.statusClass('PAID')).toContain('green');
        });
        it('should return red classes for VOID', () => {
            expect(component.statusClass('VOID')).toContain('red');
        });
        it('should return yellow classes for REPRINT', () => {
            expect(component.statusClass('REPRINT')).toContain('yellow');
        });
        it('should return blue classes for PENDING', () => {
            expect(component.statusClass('PENDING')).toContain('blue');
        });
    });

    describe('periodLabel()', () => {
        it('should return the month name for a valid month number', () => {
            expect(component.periodLabel(1)).toBe('Enero');
            expect(component.periodLabel(6)).toBe('Junio');
            expect(component.periodLabel(12)).toBe('Diciembre');
        });
        it('should return empty string for an out-of-range month', () => {
            expect(component.periodLabel(0)).toBe('');
            expect(component.periodLabel(13)).toBe('');
        });
    });

    describe('loadReceipts()', () => {
        it('should call RecibosService.getRecibos with page and limit', () => {
            component.loadReceipts(2, 20);
            expect(recibosServiceSpy.getRecibos).toHaveBeenCalledWith(2, 20, {});
        });

        it('should pass filters to the service', () => {
            component.loadReceipts(1, 10, { status: 'PAID', month: '6' });
            expect(recibosServiceSpy.getRecibos).toHaveBeenCalledWith(1, 10, { status: 'PAID', month: '6' });
        });

        it('should set isLoading to false after response', () => {
            component.loadReceipts(1, 10);
            expect(component.isLoading()).toBe(false);
        });
    });

    describe('onSearch()', () => {
        it('should call loadReceipts with current form filters', () => {
            component.searchForm.patchValue({ status: 'VOID', month: '03' });
            component.onSearch();
            expect(recibosServiceSpy.getRecibos).toHaveBeenCalledWith(
                1,
                expect.any(Number),
                expect.objectContaining({ status: 'VOID', month: '03' }),
            );
        });
    });

    describe('onClearFilters()', () => {
        it('should reset the form and reload without filters', () => {
            component.searchForm.patchValue({ status: 'PAID' });
            component.onClearFilters();
            expect(component.searchForm.get('status')!.value).toBeNull();
            expect(recibosServiceSpy.getRecibos).toHaveBeenCalledWith(1, expect.any(Number), {});
        });
    });

    describe('openDetail()', () => {
        it('should open a tab with the receipt folio as id and label', () => {
            const receipt = { folio: 'JUN2026-0001-R-0001' } as any;
            component.openDetail(receipt);
            expect(tabServiceSpy.openTab).toHaveBeenCalledWith({
                id: 'receipt-JUN2026-0001-R-0001',
                label: 'JUN2026-0001-R-0001',
                link: '/receipts/list/JUN2026-0001-R-0001',
                permission: Permissions.VIEW_INVOICE,
            });
        });
    });
});
