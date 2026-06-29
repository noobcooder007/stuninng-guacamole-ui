import { TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { ReportsGeneralComponent } from '@app/features/dashboard/collector/reportes/reports-general/reports-general.component';
import { ReportsService } from '@app/core/services/reports.service';
import { AuthService } from '@app/core/services/auth.service';

const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH = (new Date().getMonth() + 1).toString().padStart(2, '0');

const mockBlob = new Blob(['pdf'], { type: 'application/pdf' });

describe('ReportsGeneralComponent', () => {
  let component: ReportsGeneralComponent;
  const snackBarSpy = { open: vi.fn() };
  const reportsServiceSpy = {
    quantityDifferenceReport: vi.fn().mockReturnValue(of(mockBlob)),
    monthlyReportPdf: vi.fn().mockReturnValue(of(mockBlob)),
    monthlyReportExcel: vi.fn().mockReturnValue(of(mockBlob)),
    efficiencyReport: vi.fn().mockReturnValue(of(mockBlob)),
    concentratedEfficiencyReport: vi.fn().mockReturnValue(of(mockBlob)),
    decreasedDonationReport: vi.fn().mockReturnValue(of(mockBlob)),
    increasedDonationReport: vi.fn().mockReturnValue(of(mockBlob)),
    donationReport: vi.fn().mockReturnValue(of(mockBlob)),
    issuedReceiptsReport: vi.fn().mockReturnValue(of(mockBlob)),
  };

  beforeEach(() => {
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:mock'), revokeObjectURL: vi.fn() });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    TestBed.configureTestingModule({
      imports: [ReportsGeneralComponent],
      providers: [
        provideAnimationsAsync(),
        { provide: ReportsService, useValue: reportsServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: AuthService, useValue: { hasPermission: () => true } },
      ],
    });
    component = TestBed.createComponent(ReportsGeneralComponent).componentInstance;
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

    it('should set current month and year on quantityDifferenceForm', () => {
      component.ngOnInit();
      expect(component.quantityDifferenceForm.value.month).toBe(CURRENT_MONTH);
      expect(component.quantityDifferenceForm.value.year).toBe(CURRENT_YEAR.toString());
    });

    it('should set current month and year on monthlyReportForm', () => {
      component.ngOnInit();
      expect(component.monthlyReportForm.value.month).toBe(CURRENT_MONTH);
      expect(component.monthlyReportForm.value.year).toBe(CURRENT_YEAR.toString());
    });

    it('should set current month and year on efficiencyForm', () => {
      component.ngOnInit();
      expect(component.efficiencyForm.value.month).toBe(CURRENT_MONTH);
      expect(component.efficiencyForm.value.year).toBe(CURRENT_YEAR.toString());
    });

    it('should set current month and year on issuedReceiptsForm', () => {
      component.ngOnInit();
      expect(component.issuedReceiptsForm.value.month).toBe(CURRENT_MONTH);
      expect(component.issuedReceiptsForm.value.year).toBe(CURRENT_YEAR.toString());
    });
  });

  describe('generateQuantityDifferenceReport()', () => {
    it('should call the service with form values and set isLoading', () => {
      component.quantityDifferenceForm.patchValue({ month: '06', year: '2026' });
      component.generateQuantityDifferenceReport();
      expect(reportsServiceSpy.quantityDifferenceReport).toHaveBeenCalledWith(
        expect.objectContaining({ month: '06', year: '2026' })
      );
    });

    it('should set isLoading to false after success', () => {
      component.generateQuantityDifferenceReport();
      expect(component.isLoading).toBe(false);
    });

    it('should show snackbar and reset isLoading on error', () => {
      reportsServiceSpy.quantityDifferenceReport.mockReturnValue(throwError(() => new Error()));
      component.generateQuantityDifferenceReport();
      expect(component.isLoading).toBe(false);
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Error al generar el reporte', 'Cerrar', { duration: 4000 }
      );
    });
  });

  describe('generateMonthlyReportPdf()', () => {
    it('should call monthlyReportPdf with form values', () => {
      component.monthlyReportForm.patchValue({ month: '01', year: '2025' });
      component.generateMonthlyReportPdf();
      expect(reportsServiceSpy.monthlyReportPdf).toHaveBeenCalledWith(
        expect.objectContaining({ month: '01', year: '2025' })
      );
      expect(component.isLoading).toBe(false);
    });

    it('should show snackbar on error', () => {
      reportsServiceSpy.monthlyReportPdf.mockReturnValue(throwError(() => new Error()));
      component.generateMonthlyReportPdf();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Error al generar el reporte', 'Cerrar', { duration: 4000 }
      );
    });
  });

  describe('generateMonthlyReportExcel()', () => {
    it('should call monthlyReportExcel with form values', () => {
      component.generateMonthlyReportExcel();
      expect(reportsServiceSpy.monthlyReportExcel).toHaveBeenCalled();
      expect(component.isLoading).toBe(false);
    });
  });

  describe('generateEfficiencyReport()', () => {
    it('should call efficiencyReport with form values', () => {
      component.generateEfficiencyReport();
      expect(reportsServiceSpy.efficiencyReport).toHaveBeenCalled();
      expect(component.isLoading).toBe(false);
    });
  });

  describe('generateConcentratedEfficiencyReport()', () => {
    it('should call concentratedEfficiencyReport with form values', () => {
      component.generateConcentratedEfficiencyReport();
      expect(reportsServiceSpy.concentratedEfficiencyReport).toHaveBeenCalled();
      expect(component.isLoading).toBe(false);
    });
  });

  describe('generateDecreasedDonationReport()', () => {
    it('should call decreasedDonationReport with date range form values', () => {
      component.generateDecreasedDonationReport();
      expect(reportsServiceSpy.decreasedDonationReport).toHaveBeenCalled();
      expect(component.isLoading).toBe(false);
    });
  });

  describe('generateIncreasedDonationReport()', () => {
    it('should call increasedDonationReport with date range form values', () => {
      component.generateIncreasedDonationReport();
      expect(reportsServiceSpy.increasedDonationReport).toHaveBeenCalled();
      expect(component.isLoading).toBe(false);
    });
  });

  describe('generateDonationReport()', () => {
    it('should call donationReport with date range form values', () => {
      component.generateDonationReport();
      expect(reportsServiceSpy.donationReport).toHaveBeenCalled();
      expect(component.isLoading).toBe(false);
    });
  });

  describe('generateIssuedReceiptsReport()', () => {
    it('should call issuedReceiptsReport with form values', () => {
      component.generateIssuedReceiptsReport();
      expect(reportsServiceSpy.issuedReceiptsReport).toHaveBeenCalled();
      expect(component.isLoading).toBe(false);
    });

    it('should show snackbar on error', () => {
      reportsServiceSpy.issuedReceiptsReport.mockReturnValue(throwError(() => new Error()));
      component.generateIssuedReceiptsReport();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Error al generar el reporte', 'Cerrar', { duration: 4000 }
      );
    });
  });
});
