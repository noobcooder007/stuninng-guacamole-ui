import { TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError, Subject } from 'rxjs';
import { vi } from 'vitest';
import { ReceiptDetailComponent } from '@app/features/dashboard/recibos/detail/receipt-detail.component';
import { RecibosService } from '@app/core/services/recibos.service';
import { AuthService } from '@app/core/services/auth.service';

const FOLIO = 'JUN2026-0001-R-0001';

const makeRecibo = (overrides = {}): any => ({
    id: '1',
    folio: FOLIO,
    type: 'RECURRING',
    status: 'PENDING',
    amount: '500.00',
    currency: 'MXN',
    periodMonth: 6,
    periodYear: 2026,
    paymentMethod: null,
    paidAt: null,
    externalReference: null,
    printCount: 1,
    lastPrintedAt: null,
    voidReason: null,
    createdAt: '2026-06-01T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z',
    ...overrides,
});

describe('ReceiptDetailComponent', () => {
    let component: ReceiptDetailComponent;

    const recibosServiceSpy = {
        getRecibo: vi.fn(),
        cancelarRecibo: vi.fn(),
    };
    const snackbarSpy = { open: vi.fn() };

    beforeEach(() => {
        recibosServiceSpy.getRecibo.mockReturnValue(
            of({ statusCode: 200, data: makeRecibo(), timestamp: '' })
        );
        TestBed.configureTestingModule({
            imports: [ReceiptDetailComponent],
            providers: [
                provideAnimationsAsync(),
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => FOLIO } } } },
                { provide: RecibosService, useValue: recibosServiceSpy },
                { provide: MatSnackBar, useValue: snackbarSpy },
                { provide: AuthService, useValue: { hasPermission: () => true } },
            ],
        });
        component = TestBed.createComponent(ReceiptDetailComponent).componentInstance;
    });

    afterEach(() => vi.clearAllMocks());

    describe('ngOnInit()', () => {
        it('should call getRecibo with the folio from route params', () => {
            component.ngOnInit();
            expect(recibosServiceSpy.getRecibo).toHaveBeenCalledWith(FOLIO);
        });

        it('should set the receipt signal on success', () => {
            component.ngOnInit();
            expect(component.receipt()?.folio).toBe(FOLIO);
        });

        it('should set isLoading to false after success', () => {
            component.ngOnInit();
            expect(component.isLoading()).toBe(false);
        });

        it('should set isLoading to false on error without updating receipt', () => {
            recibosServiceSpy.getRecibo.mockReturnValue(throwError(() => new Error('500')));
            component.ngOnInit();
            expect(component.isLoading()).toBe(false);
            expect(component.receipt()).toBeNull();
        });
    });

    describe('statusLabel()', () => {
        it.each([
            ['PENDING', 'Pendiente'],
            ['PAID', 'Pagado'],
            ['VOID', 'Cancelado'],
            ['REPRINT', 'Reimpresión'],
        ])('should map %s → %s', (status, label) => {
            expect(component.statusLabel(status)).toBe(label);
        });

        it('should return the raw value for unknown statuses', () => {
            expect(component.statusLabel('UNKNOWN')).toBe('UNKNOWN');
        });
    });

    describe('statusClass()', () => {
        it('should return green classes for PAID', () => expect(component.statusClass('PAID')).toContain('green'));
        it('should return red classes for VOID', () => expect(component.statusClass('VOID')).toContain('red'));
        it('should return yellow classes for REPRINT', () => expect(component.statusClass('REPRINT')).toContain('yellow'));
        it('should return blue classes for PENDING', () => expect(component.statusClass('PENDING')).toContain('blue'));
    });

    describe('periodLabel()', () => {
        it.each([
            [1, 2024, 'Enero 2024'],
            [6, 2026, 'Junio 2026'],
            [12, 2025, 'Diciembre 2025'],
        ])('month %i year %i → %s', (month, year, expected) => {
            expect(component.periodLabel(month, year)).toBe(expected);
        });

        it('should return empty month name for out-of-range values', () => {
            expect(component.periodLabel(0, 2026)).toBe(' 2026');
            expect(component.periodLabel(13, 2026)).toBe(' 2026');
        });
    });

    describe('openCancelDialog()', () => {
        let dialogOpenSpy: ReturnType<typeof vi.fn>;

        beforeEach(() => {
            dialogOpenSpy = vi.fn();
            (component as any).dialog = { open: dialogOpenSpy };
        });

        it('should do nothing when receipt is null', () => {
            component.receipt.set(null);
            component.openCancelDialog();
            expect(dialogOpenSpy).not.toHaveBeenCalled();
        });

        it('should open the dialog with the current folio', () => {
            const afterClosed$ = new Subject<any>();
            dialogOpenSpy.mockReturnValue({ afterClosed: () => afterClosed$ });
            component.ngOnInit();
            component.openCancelDialog();
            expect(dialogOpenSpy).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ data: { folio: FOLIO } }),
            );
        });

        it('should call cancelarRecibo and show snackbar when dialog confirms', () => {
            const afterClosed$ = new Subject<any>();
            dialogOpenSpy.mockReturnValue({ afterClosed: () => afterClosed$ });
            recibosServiceSpy.cancelarRecibo.mockReturnValue(of(null));
            recibosServiceSpy.getRecibo.mockReturnValue(
                of({ statusCode: 200, data: makeRecibo({ status: 'VOID' }), timestamp: '' })
            );

            component.ngOnInit();
            component.openCancelDialog();
            afterClosed$.next({ reason: 'Duplicado' });

            expect(recibosServiceSpy.cancelarRecibo).toHaveBeenCalledWith(FOLIO, 'Duplicado');
            expect(snackbarSpy.open).toHaveBeenCalledWith(
                'Recibo cancelado correctamente', 'Cerrar', { duration: 5000 }
            );
        });

        it('should not call cancelarRecibo when dialog is dismissed', () => {
            const afterClosed$ = new Subject<any>();
            dialogOpenSpy.mockReturnValue({ afterClosed: () => afterClosed$ });

            component.ngOnInit();
            component.openCancelDialog();
            afterClosed$.next(undefined);

            expect(recibosServiceSpy.cancelarRecibo).not.toHaveBeenCalled();
        });

        it('should set isCancelling to false on cancelarRecibo error', () => {
            const afterClosed$ = new Subject<any>();
            dialogOpenSpy.mockReturnValue({ afterClosed: () => afterClosed$ });
            recibosServiceSpy.cancelarRecibo.mockReturnValue(throwError(() => new Error('500')));

            component.ngOnInit();
            component.openCancelDialog();
            afterClosed$.next({ reason: 'Motivo' });

            expect(component.isCancelling()).toBe(false);
        });
    });
});
