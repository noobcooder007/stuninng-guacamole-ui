import { TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';
import { SettlementsComponent } from '@app/features/dashboard/settlements/settlements.component';
import { SettlementsService } from '@app/core/services/settlements.service';
import { ProcessesService, PeriodStatus } from '@app/core/services/processes.service';
import { CollectorService } from '@app/core/services/collector.service';
import { AuthService } from '@app/core/services/auth.service';
import { PeriodStatusEnum } from '@app/shared/enums/period-status.enum';

const makePeriod = (overrides: Partial<PeriodStatus> = {}): PeriodStatus => ({
    id: 'period-1', month: 6, year: 2026, status: PeriodStatusEnum.OPEN,
    createdAt: '', createdBy: '', pendingReceiptsCount: 0, ...overrides,
});

const makeSettlement = (overrides = {}): any => ({
    id: 'set-1', collectorId: 'col-1', collectionPeriodId: 'period-1',
    month: 6, year: 2026, totalCollected: 10000, commissionPercent: 10,
    commissionAmount: 1000, nomina: 200, transportAllowance: 100,
    netCommission: 700, paymentStatus: 'PENDING', totalPaid: 0,
    remainingBalance: 700, createdAt: '', ...overrides,
});

describe('SettlementsComponent', () => {
    let component: SettlementsComponent;
    let processesServiceSpy: any;
    let collectorServiceSpy: any;
    let settlementsServiceSpy: any;
    let snackbarSpy: { open: ReturnType<typeof vi.fn> };
    let dialogOpenSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        snackbarSpy = { open: vi.fn() };
        dialogOpenSpy = vi.fn();

        processesServiceSpy = {
            getPeriodStatus: vi.fn().mockReturnValue(
                of({ data: makePeriod(), statusCode: 200, timestamp: '' })
            ),
        };
        collectorServiceSpy = {
            getActiveList: vi.fn().mockReturnValue(of([])),
        };
        settlementsServiceSpy = {
            getSettlements: vi.fn().mockReturnValue(of([makeSettlement()])),
            registerPayment: vi.fn().mockReturnValue(of(null)),
            bulkPayment: vi.fn().mockReturnValue(of(null)),
        };

        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
            imports: [SettlementsComponent],
            providers: [
                provideAnimationsAsync(),
                { provide: ProcessesService, useValue: processesServiceSpy },
                { provide: CollectorService, useValue: collectorServiceSpy },
                { provide: SettlementsService, useValue: settlementsServiceSpy },
                { provide: MatDialog, useValue: {} },
                { provide: MatSnackBar, useValue: snackbarSpy },
                { provide: AuthService, useValue: { hasPermission: () => true } },
            ],
        });
        component = TestBed.createComponent(SettlementsComponent).componentInstance;
        (component as any).dialog = { open: dialogOpenSpy };
    });

    describe('ngOnInit()', () => {
        it('should load period status and then settlements', () => {
            component.ngOnInit();
            expect(processesServiceSpy.getPeriodStatus).toHaveBeenCalled();
            expect(component.period()?.id).toBe('period-1');
            expect(settlementsServiceSpy.getSettlements).toHaveBeenCalledWith('period-1');
        });

        it('should show snackbar and stop loading when period status fails', () => {
            processesServiceSpy.getPeriodStatus.mockReturnValue(throwError(() => ({ status: 500 })));
            component.ngOnInit();
            expect(component.isLoading()).toBe(false);
            expect(snackbarSpy.open).toHaveBeenCalledWith('No hay periodo activo', 'Cerrar', { duration: 5000 });
        });

        it('should resolve collector names from active list', () => {
            collectorServiceSpy.getActiveList.mockReturnValue(of([
                { id: 'col-1', firstname: 'Juan', firstLastname: 'Pérez', secondLastname: 'García' },
            ]));
            component.ngOnInit();
            expect(component.rows()[0].collectorName).toBe('Juan Pérez García');
        });

        it('should use fallback name when collector is not in active list', () => {
            component.ngOnInit();
            expect(component.rows()[0].collectorName).toContain('Colector');
        });

        it('should still load settlements if getActiveList fails', () => {
            collectorServiceSpy.getActiveList.mockReturnValue(throwError(() => new Error()));
            component.ngOnInit();
            expect(settlementsServiceSpy.getSettlements).toHaveBeenCalled();
        });

        it('should set isLoading to false after settlements load', () => {
            component.ngOnInit();
            expect(component.isLoading()).toBe(false);
        });
    });

    describe('computed signals', () => {
        beforeEach(() => {
            settlementsServiceSpy.getSettlements.mockReturnValue(of([
                makeSettlement({ id: 'set-1', paymentStatus: 'PENDING', remainingBalance: 700 }),
                makeSettlement({ id: 'set-2', paymentStatus: 'PAID', remainingBalance: 0 }),
                makeSettlement({ id: 'set-3', paymentStatus: 'PARTIALLY_PAID', remainingBalance: 300 }),
            ]));
            component.ngOnInit();
        });

        it('pendingRows should exclude PAID rows', () => {
            expect(component.pendingRows()).toHaveLength(2);
            expect(component.pendingRows().every(r => r.paymentStatus !== 'PAID')).toBe(true);
        });

        it('totalRemaining should sum remainingBalance of non-PAID rows', () => {
            expect(component.totalRemaining()).toBe(1000);
        });
    });

    describe('statusLabel()', () => {
        it.each([
            ['PAID', 'Pagado'],
            ['PARTIALLY_PAID', 'Parcial'],
            ['PENDING', 'Pendiente'],
            ['UNKNOWN', 'Pendiente'],
        ])('%s → %s', (status, label) => {
            expect(component.statusLabel(status)).toBe(label);
        });
    });

    describe('statusClass()', () => {
        it('should return green for PAID', () => expect(component.statusClass('PAID')).toContain('green'));
        it('should return yellow for PARTIALLY_PAID', () => expect(component.statusClass('PARTIALLY_PAID')).toContain('yellow'));
        it('should return blue for PENDING', () => expect(component.statusClass('PENDING')).toContain('blue'));
    });

    describe('periodLabel()', () => {
        it('should format month name and year', () => {
            expect(component.periodLabel(makePeriod({ month: 6, year: 2026 }))).toBe('Junio 2026');
        });
    });

    describe('paymentProgress()', () => {
        it('should return percentage of totalPaid over netCommission', () => {
            const row = { ...makeSettlement(), collectorName: 'Juan', netCommission: 1000, totalPaid: 400 };
            expect(component.paymentProgress(row)).toBe(40);
        });

        it('should return 100 when netCommission is 0', () => {
            const row = { ...makeSettlement(), collectorName: 'Juan', netCommission: 0, totalPaid: 0 };
            expect(component.paymentProgress(row)).toBe(100);
        });
    });

    describe('openRegisterPayment()', () => {
        const row = { ...makeSettlement(), collectorName: 'Juan Pérez' };

        it('should do nothing when dialog is dismissed', () => {
            const afterClosed$ = new Subject<any>();
            dialogOpenSpy.mockReturnValue({ afterClosed: () => afterClosed$ });
            component.ngOnInit();
            component.openRegisterPayment(row);
            afterClosed$.next(undefined);
            expect(settlementsServiceSpy.registerPayment).not.toHaveBeenCalled();
        });

        it('should call registerPayment and show snackbar on confirm', () => {
            const afterClosed$ = new Subject<any>();
            dialogOpenSpy.mockReturnValue({ afterClosed: () => afterClosed$ });
            component.ngOnInit();
            component.openRegisterPayment(row);
            const dto = { amount: 700, paymentMethod: 'CASH', paidAt: '2026-06-01' };
            afterClosed$.next(dto);
            expect(settlementsServiceSpy.registerPayment).toHaveBeenCalledWith('set-1', dto);
            expect(snackbarSpy.open).toHaveBeenCalledWith('Pago registrado correctamente', 'Cerrar', { duration: 4000 });
        });

        it('should reset isRegistering on error', () => {
            settlementsServiceSpy.registerPayment.mockReturnValue(throwError(() => new Error()));
            const afterClosed$ = new Subject<any>();
            dialogOpenSpy.mockReturnValue({ afterClosed: () => afterClosed$ });
            component.ngOnInit();
            component.openRegisterPayment(row);
            afterClosed$.next({ amount: 700, paymentMethod: 'CASH', paidAt: '2026-06-01' });
            expect(component.isRegistering()).toBeNull();
        });
    });

    describe('openBulkPayment()', () => {
        it('should do nothing when dialog is dismissed', () => {
            const afterClosed$ = new Subject<any>();
            dialogOpenSpy.mockReturnValue({ afterClosed: () => afterClosed$ });
            component.ngOnInit();
            component.openBulkPayment();
            afterClosed$.next(undefined);
            expect(settlementsServiceSpy.bulkPayment).not.toHaveBeenCalled();
        });

        it('should call bulkPayment and show snackbar on confirm', () => {
            const afterClosed$ = new Subject<any>();
            dialogOpenSpy.mockReturnValue({ afterClosed: () => afterClosed$ });
            component.ngOnInit();
            component.openBulkPayment();
            const dto = { paymentMethod: 'TRANSFER', paidAt: '2026-06-01' };
            afterClosed$.next(dto);
            expect(settlementsServiceSpy.bulkPayment).toHaveBeenCalledWith('period-1', dto);
            expect(snackbarSpy.open).toHaveBeenCalledWith('Pago masivo registrado correctamente', 'Cerrar', { duration: 4000 });
        });

        it('should reset isBulkPaying on error', () => {
            settlementsServiceSpy.bulkPayment.mockReturnValue(throwError(() => new Error()));
            const afterClosed$ = new Subject<any>();
            dialogOpenSpy.mockReturnValue({ afterClosed: () => afterClosed$ });
            component.ngOnInit();
            component.openBulkPayment();
            afterClosed$.next({ paymentMethod: 'CASH', paidAt: '2026-06-01' });
            expect(component.isBulkPaying()).toBe(false);
        });
    });

    describe('openHistory()', () => {
        it('should open dialog with the settlement id and collector name', () => {
            dialogOpenSpy.mockReturnValue({});
            const row = { ...makeSettlement(), collectorName: 'Juan Pérez' };
            component.openHistory(row);
            expect(dialogOpenSpy).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ data: { settlementId: 'set-1', collectorName: 'Juan Pérez' } })
            );
        });
    });
});
