import { TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { ReportsCollectorComponent } from '@app/features/dashboard/collector/reportes/reports-collector/reports-collector.component';
import { ReportsService } from '@app/core/services/reports.service';
import { AuthService } from '@app/core/services/auth.service';

const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH = (new Date().getMonth() + 1).toString().padStart(2, '0');
const mockBlob = new Blob(['pdf'], { type: 'application/pdf' });

describe('ReportsCollectorComponent', () => {
  let component: ReportsCollectorComponent;
  const snackBarSpy = { open: vi.fn() };
  const reportsServiceSpy = {
    collectorDepositsReport: vi.fn().mockReturnValue(of(mockBlob)),
    collectorLiquidationReportPdf: vi.fn().mockReturnValue(of(mockBlob)),
    collectorLiquidationReportExcel: vi.fn().mockReturnValue(of(mockBlob)),
  };

  beforeEach(() => {
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:mock'), revokeObjectURL: vi.fn() });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    TestBed.configureTestingModule({
      imports: [ReportsCollectorComponent],
      providers: [
        provideAnimationsAsync(),
        { provide: ReportsService, useValue: reportsServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: AuthService, useValue: { hasPermission: () => true } },
      ],
    });
    component = TestBed.createComponent(ReportsCollectorComponent).componentInstance;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  describe('ngOnInit()', () => {
    it('should generate 11 years centered on the current year', () => {
      component.ngOnInit();
      expect(component.years).toHaveLength(11);
      expect(component.years[0]).toBe(CURRENT_YEAR - 5);
      expect(component.years[10]).toBe(CURRENT_YEAR + 5);
    });

    it('should set current month and year on liquidationForm', () => {
      component.ngOnInit();
      expect(component.liquidationForm.value.month).toBe(CURRENT_MONTH);
      expect(component.liquidationForm.value.year).toBe(CURRENT_YEAR.toString());
    });
  });

  describe('downloadDepositsReport()', () => {
    it('should call collectorDepositsReport with form values and reset isLoading', () => {
      component.downloadDepositsReport();
      expect(reportsServiceSpy.collectorDepositsReport).toHaveBeenCalledWith(
        expect.objectContaining({ collectorNum: '' })
      );
      expect(component.isLoading).toBe(false);
    });

    it('should show snackbar and reset isLoading on error', () => {
      reportsServiceSpy.collectorDepositsReport.mockReturnValue(throwError(() => new Error()));
      component.downloadDepositsReport();
      expect(component.isLoading).toBe(false);
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Error al generar el reporte', 'Cerrar', { duration: 4000 }
      );
    });
  });

  describe('downloadLiquidationReportPdf()', () => {
    it('should call collectorLiquidationReportPdf with form values', () => {
      component.liquidationForm.patchValue({ month: '06', year: '2026', collectorNum: '10' });
      component.downloadLiquidationReportPdf();
      expect(reportsServiceSpy.collectorLiquidationReportPdf).toHaveBeenCalledWith(
        expect.objectContaining({ month: '06', year: '2026', collectorNum: '10' })
      );
      expect(component.isLoading).toBe(false);
    });

    it('should show snackbar on error', () => {
      reportsServiceSpy.collectorLiquidationReportPdf.mockReturnValue(throwError(() => new Error()));
      component.downloadLiquidationReportPdf();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Error al generar el reporte', 'Cerrar', { duration: 4000 }
      );
    });
  });

  describe('downloadLiquidationReportExcel()', () => {
    it('should call collectorLiquidationReportExcel with form values', () => {
      component.downloadLiquidationReportExcel();
      expect(reportsServiceSpy.collectorLiquidationReportExcel).toHaveBeenCalled();
      expect(component.isLoading).toBe(false);
    });

    it('should show snackbar on error', () => {
      reportsServiceSpy.collectorLiquidationReportExcel.mockReturnValue(throwError(() => new Error()));
      component.downloadLiquidationReportExcel();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Error al generar el reporte', 'Cerrar', { duration: 4000 }
      );
    });
  });
});
