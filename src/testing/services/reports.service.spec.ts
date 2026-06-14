import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ReportsService, ReportFilter } from '@app/core/services/reports.service';

const BASE = '/api/reports';
const FILTERS: ReportFilter = { month: '6', year: '2026' };

describe('ReportsService', () => {
  let service: ReportsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ReportsService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(ReportsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  const expectBlobPost = (url: string) => {
    const req = httpMock.expectOne(url);
    expect(req.request.method).toBe('POST');
    expect(req.request.responseType).toBe('blob');
    expect(req.request.body).toEqual(FILTERS);
    req.flush(new Blob());
  };

  describe('general reports', () => {
    it('quantityDifferenceReport → POST /general/quantity-difference', () => {
      service.quantityDifferenceReport(FILTERS).subscribe();
      expectBlobPost(`${BASE}/general/quantity-difference`);
    });

    it('monthlyReportPdf → POST /general/monthly-report', () => {
      service.monthlyReportPdf(FILTERS).subscribe();
      expectBlobPost(`${BASE}/general/monthly-report`);
    });

    it('monthlyReportExcel → POST /general/monthly-report/excel', () => {
      service.monthlyReportExcel(FILTERS).subscribe();
      expectBlobPost(`${BASE}/general/monthly-report/excel`);
    });

    it('efficiencyReport → POST /general/efficiency', () => {
      service.efficiencyReport(FILTERS).subscribe();
      expectBlobPost(`${BASE}/general/efficiency`);
    });

    it('concentratedEfficiencyReport → POST /general/efficiency-concentrated', () => {
      service.concentratedEfficiencyReport(FILTERS).subscribe();
      expectBlobPost(`${BASE}/general/efficiency-concentrated`);
    });

    it('decreasedDonationReport → POST /general/decreased-donations', () => {
      service.decreasedDonationReport(FILTERS).subscribe();
      expectBlobPost(`${BASE}/general/decreased-donations`);
    });

    it('increasedDonationReport → POST /general/increased-donations', () => {
      service.increasedDonationReport(FILTERS).subscribe();
      expectBlobPost(`${BASE}/general/increased-donations`);
    });

    it('donationReport → POST /general/donations', () => {
      service.donationReport(FILTERS).subscribe();
      expectBlobPost(`${BASE}/general/donations`);
    });

    it('issuedReceiptsReport → POST /general/issued-receipts', () => {
      service.issuedReceiptsReport(FILTERS).subscribe();
      expectBlobPost(`${BASE}/general/issued-receipts`);
    });
  });

  describe('beneficiary reports', () => {
    it('beneficiaryMovementsReport → POST /beneficiary/movements', () => {
      service.beneficiaryMovementsReport(FILTERS).subscribe();
      expectBlobPost(`${BASE}/beneficiary/movements`);
    });

    it('beneficiaryConcentratedReport → POST /beneficiary/concentrated', () => {
      service.beneficiaryConcentratedReport(FILTERS).subscribe();
      expectBlobPost(`${BASE}/beneficiary/concentrated`);
    });

    it('beneficiaryStatusReport → POST /beneficiary/status', () => {
      service.beneficiaryStatusReport(FILTERS).subscribe();
      expectBlobPost(`${BASE}/beneficiary/status`);
    });

    it('beneficiaryExcelReport → POST /beneficiary/excel', () => {
      service.beneficiaryExcelReport(FILTERS).subscribe();
      expectBlobPost(`${BASE}/beneficiary/excel`);
    });

    it('beneficiaryReport → POST /beneficiary/general', () => {
      service.beneficiaryReport(FILTERS).subscribe();
      expectBlobPost(`${BASE}/beneficiary/general`);
    });
  });

  describe('collector reports', () => {
    it('collectorDepositsReport → POST /collector/deposits', () => {
      service.collectorDepositsReport(FILTERS).subscribe();
      expectBlobPost(`${BASE}/collector/deposits`);
    });

    it('collectorLiquidationReportPdf → POST /collector/liquidation', () => {
      service.collectorLiquidationReportPdf(FILTERS).subscribe();
      expectBlobPost(`${BASE}/collector/liquidation`);
    });

    it('collectorLiquidationReportExcel → POST /collector/liquidation/excel', () => {
      service.collectorLiquidationReportExcel(FILTERS).subscribe();
      expectBlobPost(`${BASE}/collector/liquidation/excel`);
    });
  });
});
