import { TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { ReportsGeneralComponent } from '@app/features/dashboard/collector/reportes/reports-general/reports-general.component';
import { ReportsService } from '@app/core/services/reports.service';
import { AuthService } from '@app/core/services/auth.service';
import { CollectorService } from '@app/core/services/collector.service';

const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth() + 1;

const mockBlob = new Blob(['pdf'], { type: 'application/pdf' });

describe('ReportsGeneralComponent', () => {
  let component: ReportsGeneralComponent;
  const reportsServiceSpy = {
    quantityDifferenceReport: vi.fn().mockReturnValue(of(mockBlob)),
    efficiencyReport: vi.fn().mockReturnValue(of(mockBlob)),
    concentratedEfficiencyReport: vi.fn().mockReturnValue(of(mockBlob)),
  };
  const collectorServiceSpy = {
    getActiveList: vi.fn().mockReturnValue(of([])),
  };

  beforeEach(() => {
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:mock') });
    vi.stubGlobal('open', vi.fn());

    TestBed.configureTestingModule({
      imports: [ReportsGeneralComponent],
      providers: [
        provideAnimationsAsync(),
        { provide: ReportsService, useValue: reportsServiceSpy },
        { provide: AuthService, useValue: { hasPermission: () => true } },
        { provide: CollectorService, useValue: collectorServiceSpy },
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

    it('should set current month and year on quantityDifferenceForm as numbers', () => {
      component.ngOnInit();
      expect(component.quantityDifferenceForm.value.month).toBe(CURRENT_MONTH);
      expect(component.quantityDifferenceForm.value.year).toBe(CURRENT_YEAR);
    });

    it('should set current month and year on efficiencyForm as numbers', () => {
      component.ngOnInit();
      expect(component.efficiencyForm.value.month).toBe(CURRENT_MONTH);
      expect(component.efficiencyForm.value.year).toBe(CURRENT_YEAR);
    });
  });

  describe('generateQuantityDifferenceReport()', () => {
    it('should not call the service when the form is invalid', () => {
      component.quantityDifferenceForm.patchValue({ month: null, year: null });
      component.generateQuantityDifferenceReport();
      expect(reportsServiceSpy.quantityDifferenceReport).not.toHaveBeenCalled();
    });

    it('should call the service with numeric month/year', () => {
      component.quantityDifferenceForm.patchValue({ month: 6, year: 2026 });
      component.generateQuantityDifferenceReport();
      expect(reportsServiceSpy.quantityDifferenceReport).toHaveBeenCalledWith({ month: 6, year: 2026 });
      expect(component.isLoading()).toBe(false);
    });

    it('should reset isLoading on error', () => {
      component.quantityDifferenceForm.patchValue({ month: 6, year: 2026 });
      reportsServiceSpy.quantityDifferenceReport.mockReturnValueOnce(throwError(() => new Error()));
      component.generateQuantityDifferenceReport();
      expect(component.isLoading()).toBe(false);
    });

    it('should open the generated PDF in a new tab', () => {
      component.quantityDifferenceForm.patchValue({ month: 6, year: 2026 });
      component.generateQuantityDifferenceReport();
      expect(window.open).toHaveBeenCalledWith('blob:mock', '_blank');
    });
  });

  describe('generateEfficiencyReport()', () => {
    it('should not call the service when the form is invalid', () => {
      component.generateEfficiencyReport();
      expect(reportsServiceSpy.efficiencyReport).not.toHaveBeenCalled();
    });

    it('should call efficiencyReport with numeric values and omit collectorNum when empty', () => {
      component.efficiencyForm.patchValue({
        month: 6, year: 2026, initialDonation: 100, finalDonation: 200, frequency: 1,
      });
      component.generateEfficiencyReport();
      expect(reportsServiceSpy.efficiencyReport).toHaveBeenCalledWith({
        month: 6, year: 2026, initialDonation: 100, finalDonation: 200, frequency: 1,
      });
    });

    it('should include collectorNum when provided', () => {
      component.efficiencyForm.patchValue({
        month: 6, year: 2026, initialDonation: 100, finalDonation: 200, frequency: 1, collectorNum: 3,
      });
      component.generateEfficiencyReport();
      expect(reportsServiceSpy.efficiencyReport).toHaveBeenCalledWith(
        expect.objectContaining({ collectorNum: 3 })
      );
    });
  });

  describe('generateConcentratedEfficiencyReport()', () => {
    it('should not call the service when the form is invalid', () => {
      component.generateConcentratedEfficiencyReport();
      expect(reportsServiceSpy.concentratedEfficiencyReport).not.toHaveBeenCalled();
    });

    it('should format dates as YYYY-MM-DD and omit collectorNum when empty', () => {
      component.concentratedEfficiencyForm.patchValue({
        startDate: new Date(2026, 0, 1),
        endDate: new Date(2026, 0, 31),
        initialPercentage: 10,
        finalPercentage: 90,
        efficiencyType: 'HISTORICAL',
      });
      component.generateConcentratedEfficiencyReport();
      expect(reportsServiceSpy.concentratedEfficiencyReport).toHaveBeenCalledWith({
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        initialPercentage: 10,
        finalPercentage: 90,
        efficiencyType: 'HISTORICAL',
      });
    });

    it('should include collectorNum when provided', () => {
      component.concentratedEfficiencyForm.patchValue({
        startDate: new Date(2026, 0, 1),
        endDate: new Date(2026, 0, 31),
        initialPercentage: 10,
        finalPercentage: 90,
        efficiencyType: 'PERIOD',
        collectorNum: 3,
      });
      component.generateConcentratedEfficiencyReport();
      expect(reportsServiceSpy.concentratedEfficiencyReport).toHaveBeenCalledWith(
        expect.objectContaining({ collectorNum: 3 })
      );
    });
  });
});
