import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { vi } from 'vitest';
import {
  ConcentratedEfficiencyFilter,
  EfficiencyFilter,
  QuantityDifferenceFilter,
  ReportsService,
} from '@app/core/services/reports.service';
import { environment } from 'environments/environment.development';

const BASE = `${environment.apiBaseUrl}/reports`;
const QUANTITY_DIFFERENCE_FILTERS: QuantityDifferenceFilter = { month: 6, year: 2026 };
const EFFICIENCY_FILTERS: EfficiencyFilter = {
  month: 6, year: 2026, initialDonation: 100, finalDonation: 500, frequency: 1, collectorNum: 3,
};
const CONCENTRATED_EFFICIENCY_FILTERS: ConcentratedEfficiencyFilter = {
  startDate: '2024-01-01', endDate: '2024-06-30', initialPercentage: 0, finalPercentage: 50,
  efficiencyType: 'HISTORICAL', collectorNum: 3,
};

describe('ReportsService', () => {
  let service: ReportsService;
  let httpMock: HttpTestingController;
  const snackBarSpy = { open: vi.fn() };

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        ReportsService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatSnackBar, useValue: snackBarSpy },
      ],
    });
    service = TestBed.inject(ReportsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.clearAllMocks();
  });

  const expectBlobPost = (url: string, body: unknown) => {
    const req = httpMock.expectOne(url);
    expect(req.request.method).toBe('POST');
    expect(req.request.responseType).toBe('blob');
    expect(req.request.body).toEqual(body);
    req.flush(new Blob());
  };

  describe('quantityDifferenceReport', () => {
    it('should POST /reports/general/quantity-difference with numeric month/year', () => {
      service.quantityDifferenceReport(QUANTITY_DIFFERENCE_FILTERS).subscribe();
      expectBlobPost(`${BASE}/general/quantity-difference`, QUANTITY_DIFFERENCE_FILTERS);
    });
  });

  describe('efficiencyReport', () => {
    it('should POST /reports/general/efficiency with numeric filters', () => {
      service.efficiencyReport(EFFICIENCY_FILTERS).subscribe();
      expectBlobPost(`${BASE}/general/efficiency`, EFFICIENCY_FILTERS);
    });
  });

  describe('concentratedEfficiencyReport', () => {
    it('should POST /reports/general/efficiency-concentrated with ISO dates and uppercase type', () => {
      service.concentratedEfficiencyReport(CONCENTRATED_EFFICIENCY_FILTERS).subscribe();
      expectBlobPost(`${BASE}/general/efficiency-concentrated`, CONCENTRATED_EFFICIENCY_FILTERS);
    });
  });
});
