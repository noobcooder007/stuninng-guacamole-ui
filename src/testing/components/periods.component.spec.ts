import { TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';
import { PeriodsComponent } from '@app/features/dashboard/periods/periods.component';
import { ProcessesService, PeriodStatus } from '@app/core/services/processes.service';
import { AuthService } from '@app/core/services/auth.service';
import { PeriodStatusEnum } from '@app/shared/enums/period-status.enum';

const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH = (new Date().getMonth() + 1).toString().padStart(2, '0');
const mockBlob = new Blob(['pdf']);

const makePeriod = (overrides: Partial<PeriodStatus> = {}): PeriodStatus => ({
    id: 'period-1', month: 6, year: 2026, status: PeriodStatusEnum.OPEN,
    createdAt: '', createdBy: '', pendingReceiptsCount: 0, ...overrides,
});

const periodRes = (overrides: Partial<PeriodStatus> = {}) => ({
    statusCode: 200, data: makePeriod(overrides), timestamp: '',
});

describe('PeriodsComponent', () => {
    let component: PeriodsComponent;
    let processesServiceSpy: any;
    let snackbarSpy: { open: ReturnType<typeof vi.fn> };
    let dialogOpenSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        snackbarSpy = { open: vi.fn() };
        dialogOpenSpy = vi.fn();
        processesServiceSpy = {
            getPeriodStatus: vi.fn().mockReturnValue(of(periodRes())),
            openPeriod: vi.fn().mockReturnValue(of(periodRes())),
            closePeriod: vi.fn().mockReturnValue(of(periodRes())),
            startReceiptsGenerationProcess: vi.fn().mockReturnValue(of(periodRes())),
            collectionPeriodReportPdf: vi.fn().mockReturnValue(of(mockBlob)),
            settlementLettersPdf: vi.fn().mockReturnValue(of(mockBlob)),
        };

        vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:mock') });
        vi.stubGlobal('open', vi.fn());

        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
            imports: [PeriodsComponent],
            providers: [
                provideAnimationsAsync(),
                { provide: ProcessesService, useValue: processesServiceSpy },
                { provide: MatDialog, useValue: {} },
                { provide: MatSnackBar, useValue: snackbarSpy },
                { provide: AuthService, useValue: { hasPermission: () => true } },
            ],
        });
        component = TestBed.createComponent(PeriodsComponent).componentInstance;
        (component as any).dialog = { open: dialogOpenSpy };
    });

    afterEach(() => vi.unstubAllGlobals());

    describe('ngOnInit()', () => {
        it('should generate 11 years centered on current year', () => {
            component.ngOnInit();
            expect(component.years).toHaveLength(11);
            expect(component.years[0]).toBe(CURRENT_YEAR - 5);
            expect(component.years[10]).toBe(CURRENT_YEAR + 5);
        });

        it('should pre-fill form with current month and year before API responds', () => {
            processesServiceSpy.getPeriodStatus.mockReturnValue(new Subject());
            component.ngOnInit();
            expect(component.periodReportsForm.value.month).toBe(CURRENT_MONTH);
            expect(component.periodReportsForm.value.year).toBe(CURRENT_YEAR.toString());
        });

        it('should set periodStatus from API response', () => {
            component.ngOnInit();
            expect(component.periodStatus()?.id).toBe('period-1');
        });

        it('should update form with period month and year from API', () => {
            component.ngOnInit();
            expect(component.periodReportsForm.value.month).toBe('06');
            expect(component.periodReportsForm.value.year).toBe('2026');
        });

        it('should set isLoadingPeriod to false after API responds', () => {
            component.ngOnInit();
            expect(component.isLoadingPeriod()).toBe(false);
        });
    });

    describe('loadPeriodStatus() — error paths', () => {
        it('should set periodStatus to null on error', () => {
            processesServiceSpy.getPeriodStatus.mockReturnValue(throwError(() => ({ status: 500 })));
            component.ngOnInit();
            expect(component.periodStatus()).toBeNull();
            expect(component.isLoadingPeriod()).toBe(false);
        });

        it('should show snackbar for non-404 errors', () => {
            processesServiceSpy.getPeriodStatus.mockReturnValue(throwError(() => ({ status: 500 })));
            component.ngOnInit();
            expect(snackbarSpy.open).toHaveBeenCalledWith(
                'Error al obtener el estado del periodo', 'Cerrar', { duration: 5000 }
            );
        });

        it('should NOT show snackbar for 404 errors', () => {
            processesServiceSpy.getPeriodStatus.mockReturnValue(throwError(() => ({ status: 404 })));
            component.ngOnInit();
            expect(snackbarSpy.open).not.toHaveBeenCalled();
        });
    });

    describe('togglePeriod()', () => {
        it('should do nothing when dialog is dismissed', () => {
            const afterClosed$ = new Subject<boolean>();
            dialogOpenSpy.mockReturnValue({ afterClosed: () => afterClosed$ });
            component.ngOnInit();
            component.togglePeriod();
            afterClosed$.next(false);
            expect(processesServiceSpy.closePeriod).not.toHaveBeenCalled();
            expect(processesServiceSpy.openPeriod).not.toHaveBeenCalled();
        });

        it('should call closePeriod when period is OPEN and dialog confirms', () => {
            const afterClosed$ = new Subject<boolean>();
            dialogOpenSpy.mockReturnValue({ afterClosed: () => afterClosed$ });
            component.ngOnInit();
            component.togglePeriod();
            afterClosed$.next(true);
            expect(processesServiceSpy.closePeriod).toHaveBeenCalled();
            expect(snackbarSpy.open).toHaveBeenCalledWith('Periodo cerrado correctamente', 'Cerrar', { duration: 5000 });
        });

        it('should call openPeriod when period is CLOSED and dialog confirms', () => {
            processesServiceSpy.getPeriodStatus.mockReturnValue(
                of(periodRes({ status: PeriodStatusEnum.CLOSED }))
            );
            const afterClosed$ = new Subject<boolean>();
            dialogOpenSpy.mockReturnValue({ afterClosed: () => afterClosed$ });
            component.ngOnInit();
            component.togglePeriod();
            afterClosed$.next(true);
            expect(processesServiceSpy.openPeriod).toHaveBeenCalled();
            expect(snackbarSpy.open).toHaveBeenCalledWith('Periodo abierto correctamente', 'Cerrar', { duration: 5000 });
        });

        it('should reset isTogglingPeriod and show snackbar on error', () => {
            processesServiceSpy.closePeriod.mockReturnValue(throwError(() => ({ status: 500 })));
            const afterClosed$ = new Subject<boolean>();
            dialogOpenSpy.mockReturnValue({ afterClosed: () => afterClosed$ });
            component.ngOnInit();
            component.togglePeriod();
            afterClosed$.next(true);
            expect(component.isTogglingPeriod()).toBe(false);
            expect(snackbarSpy.open).toHaveBeenCalledWith(
                'Error al cambiar el estado del periodo', 'Cerrar', { duration: 5000 }
            );
        });
    });

    describe('generarRecibos()', () => {
        it('should do nothing when period is null', () => {
            processesServiceSpy.getPeriodStatus.mockReturnValue(throwError(() => ({ status: 404 })));
            component.ngOnInit();
            component.generarRecibos();
            expect(dialogOpenSpy).not.toHaveBeenCalled();
        });

        it('should do nothing when dialog is dismissed', () => {
            const afterClosed$ = new Subject<boolean>();
            dialogOpenSpy.mockReturnValue({ afterClosed: () => afterClosed$ });
            component.ngOnInit();
            component.generarRecibos();
            afterClosed$.next(false);
            expect(processesServiceSpy.startReceiptsGenerationProcess).not.toHaveBeenCalled();
        });

        it('should start receipts generation and show snackbar on confirm', () => {
            const afterClosed$ = new Subject<boolean>();
            dialogOpenSpy.mockReturnValue({ afterClosed: () => afterClosed$ });
            component.ngOnInit();
            component.generarRecibos();
            afterClosed$.next(true);
            expect(processesServiceSpy.startReceiptsGenerationProcess).toHaveBeenCalledWith(
                { month: '06', year: '2026' }
            );
            expect(snackbarSpy.open).toHaveBeenCalledWith('Recibos generados correctamente', 'Cerrar', { duration: 5000 });
            expect(component.isProcessing()).toBe(false);
        });

        it('should reset isProcessing and show snackbar on error', () => {
            processesServiceSpy.startReceiptsGenerationProcess.mockReturnValue(throwError(() => ({ status: 500 })));
            const afterClosed$ = new Subject<boolean>();
            dialogOpenSpy.mockReturnValue({ afterClosed: () => afterClosed$ });
            component.ngOnInit();
            component.generarRecibos();
            afterClosed$.next(true);
            expect(component.isProcessing()).toBe(false);
            expect(snackbarSpy.open).toHaveBeenCalledWith(
                'Error al generar los recibos', 'Cerrar', { duration: 7000 }
            );
        });
    });

    describe('generarReportePeriodo()', () => {
        it('should do nothing when form is invalid', () => {
            component.periodReportsForm.reset();
            component.generarReportePeriodo();
            expect(processesServiceSpy.collectionPeriodReportPdf).not.toHaveBeenCalled();
        });

        it('should call collectionPeriodReportPdf and open blob URL', () => {
            component.ngOnInit();
            component.generarReportePeriodo();
            expect(processesServiceSpy.collectionPeriodReportPdf).toHaveBeenCalledWith(6, 2026);
            expect(window.open).toHaveBeenCalledWith('blob:mock', '_blank');
            expect(component.isGeneratingReport()).toBe(false);
        });

        it('should reset isGeneratingReport on error', () => {
            processesServiceSpy.collectionPeriodReportPdf.mockReturnValue(throwError(() => new Error()));
            component.ngOnInit();
            component.generarReportePeriodo();
            expect(component.isGeneratingReport()).toBe(false);
        });
    });

    describe('generarCartasLiquidacion()', () => {
        it('should do nothing when no period is loaded', () => {
            processesServiceSpy.getPeriodStatus.mockReturnValue(throwError(() => ({ status: 404 })));
            component.ngOnInit();
            component.generarCartasLiquidacion();
            expect(processesServiceSpy.settlementLettersPdf).not.toHaveBeenCalled();
        });

        it('should call settlementLettersPdf and open blob URL', () => {
            component.ngOnInit();
            component.generarCartasLiquidacion();
            expect(processesServiceSpy.settlementLettersPdf).toHaveBeenCalledWith('period-1');
            expect(window.open).toHaveBeenCalledWith('blob:mock', '_blank');
            expect(component.isGeneratingSettlement()).toBe(false);
        });

        it('should reset isGeneratingSettlement on error', () => {
            processesServiceSpy.settlementLettersPdf.mockReturnValue(throwError(() => new Error()));
            component.ngOnInit();
            component.generarCartasLiquidacion();
            expect(component.isGeneratingSettlement()).toBe(false);
        });
    });
});
