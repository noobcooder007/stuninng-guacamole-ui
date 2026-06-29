import { TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { ReportsBeneficiaryComponent } from '@app/features/dashboard/collector/reportes/reports-beneficiary/reports-beneficiary.component';
import { ReportsService } from '@app/core/services/reports.service';
import { AuthService } from '@app/core/services/auth.service';

const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH = (new Date().getMonth() + 1).toString().padStart(2, '0');
const mockBlob = new Blob(['pdf'], { type: 'application/pdf' });

describe('ReportsBeneficiaryComponent', () => {
  let component: ReportsBeneficiaryComponent;
  const snackBarSpy = { open: vi.fn() };
  const reportsServiceSpy = {
    beneficiaryMovementsReport: vi.fn().mockReturnValue(of(mockBlob)),
    beneficiaryConcentratedReport: vi.fn().mockReturnValue(of(mockBlob)),
    beneficiaryStatusReport: vi.fn().mockReturnValue(of(mockBlob)),
    beneficiaryExcelReport: vi.fn().mockReturnValue(of(mockBlob)),
    beneficiaryReport: vi.fn().mockReturnValue(of(mockBlob)),
  };

  beforeEach(() => {
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:mock'), revokeObjectURL: vi.fn() });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    TestBed.configureTestingModule({
      imports: [ReportsBeneficiaryComponent],
      providers: [
        provideAnimationsAsync(),
        { provide: ReportsService, useValue: reportsServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: AuthService, useValue: { hasPermission: () => true } },
      ],
    });
    component = TestBed.createComponent(ReportsBeneficiaryComponent).componentInstance;
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

    it('should set current month on beneficiaryExcelForm', () => {
      component.ngOnInit();
      expect(component.beneficiaryExcelForm.value.month).toBe(CURRENT_MONTH);
    });
  });

  describe('downloadBeneficiaryMovementsReport()', () => {
    it('should call beneficiaryMovementsReport and reset isLoading', () => {
      component.downloadBeneficiaryMovementsReport();
      expect(reportsServiceSpy.beneficiaryMovementsReport).toHaveBeenCalledWith({});
      expect(component.isLoading).toBe(false);
    });

    it('should show snackbar and reset isLoading on error', () => {
      reportsServiceSpy.beneficiaryMovementsReport.mockReturnValue(throwError(() => new Error()));
      component.downloadBeneficiaryMovementsReport();
      expect(component.isLoading).toBe(false);
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Error al generar el reporte', 'Cerrar', { duration: 4000 }
      );
    });
  });

  describe('downloadBeneficiaryConcentratedReport()', () => {
    it('should call beneficiaryConcentratedReport and reset isLoading', () => {
      component.downloadBeneficiaryConcentratedReport();
      expect(reportsServiceSpy.beneficiaryConcentratedReport).toHaveBeenCalledWith({});
      expect(component.isLoading).toBe(false);
    });
  });

  describe('downloadBeneficiaryStatusReport()', () => {
    it('should call beneficiaryStatusReport with form values', () => {
      component.downloadBeneficiaryStatusReport();
      expect(reportsServiceSpy.beneficiaryStatusReport).toHaveBeenCalledWith(
        expect.objectContaining({ status: '', cause: '' })
      );
      expect(component.isLoading).toBe(false);
    });

    it('should show snackbar on error', () => {
      reportsServiceSpy.beneficiaryStatusReport.mockReturnValue(throwError(() => new Error()));
      component.downloadBeneficiaryStatusReport();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Error al generar el reporte', 'Cerrar', { duration: 4000 }
      );
    });
  });

  describe('downloadBeneficiaryExcelReport()', () => {
    it('should call beneficiaryExcelReport with form values', () => {
      component.beneficiaryExcelForm.patchValue({ collectorNum: '42' });
      component.downloadBeneficiaryExcelReport();
      expect(reportsServiceSpy.beneficiaryExcelReport).toHaveBeenCalledWith(
        expect.objectContaining({ collectorNum: '42' })
      );
      expect(component.isLoading).toBe(false);
    });
  });

  describe('downloadBeneficiaryReport()', () => {
    it('should call beneficiaryReport with form values', () => {
      component.downloadBeneficiaryReport();
      expect(reportsServiceSpy.beneficiaryReport).toHaveBeenCalled();
      expect(component.isLoading).toBe(false);
    });

    it('should show snackbar on error', () => {
      reportsServiceSpy.beneficiaryReport.mockReturnValue(throwError(() => new Error()));
      component.downloadBeneficiaryReport();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Error al generar el reporte', 'Cerrar', { duration: 4000 }
      );
    });
  });
});
