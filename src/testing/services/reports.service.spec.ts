import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { vi } from 'vitest';
import {
  BeneficientsByCollectorFilter,
  BeneficientsByCollectorReport,
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
const BENEFICIENTS_BY_COLLECTOR_FILTERS: BeneficientsByCollectorFilter = {
  fromMonth: 1, fromYear: 2026, toMonth: 6, toYear: 2026, includeSpecial: false, collectorNumber: 3,
};
const BENEFICIENTS_BY_COLLECTOR_REPORT: BeneficientsByCollectorReport = {
  fromMonth: 1, fromYear: 2026, toMonth: 6, toYear: 2026, includeSpecial: false, collectors: [],
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

  describe('beneficientsByCollectorReport', () => {
    it('should GET /reports/beneficients-by-collector with query params and unwrap the data envelope', () => {
      let result: BeneficientsByCollectorReport | undefined;
      service.beneficientsByCollectorReport(BENEFICIENTS_BY_COLLECTOR_FILTERS).subscribe(r => (result = r));

      const req = httpMock.expectOne(
        req => req.url === `${BASE}/beneficients-by-collector`,
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('fromMonth')).toBe('1');
      expect(req.request.params.get('fromYear')).toBe('2026');
      expect(req.request.params.get('toMonth')).toBe('6');
      expect(req.request.params.get('toYear')).toBe('2026');
      expect(req.request.params.get('includeSpecial')).toBe('false');
      expect(req.request.params.get('collectorNumber')).toBe('3');
      req.flush({ data: BENEFICIENTS_BY_COLLECTOR_REPORT });

      expect(result).toEqual(BENEFICIENTS_BY_COLLECTOR_REPORT);
    });

    it('should omit collectorNumber when not provided', () => {
      service.beneficientsByCollectorReport({ ...BENEFICIENTS_BY_COLLECTOR_FILTERS, collectorNumber: undefined }).subscribe();

      const req = httpMock.expectOne(req => req.url === `${BASE}/beneficients-by-collector`);
      expect(req.request.params.has('collectorNumber')).toBe(false);
      req.flush({ data: BENEFICIENTS_BY_COLLECTOR_REPORT });
    });
  });

  describe('beneficientsByCollectorReportPdf', () => {
    it('should GET /reports/beneficients-by-collector/pdf as a blob with query params', () => {
      service.beneficientsByCollectorReportPdf(BENEFICIENTS_BY_COLLECTOR_FILTERS).subscribe();

      const req = httpMock.expectOne(
        req => req.url === `${BASE}/beneficients-by-collector/pdf`,
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('blob');
      expect(req.request.params.get('includeSpecial')).toBe('false');
      req.flush(new Blob());
    });
  });
});
