import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ProcessesService } from '@app/core/services/processes.service';
import { environment } from 'environments/environment.development';

const BASE = `${environment.apiBaseUrl}`;

describe('ProcessesService', () => {
  let service: ProcessesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        ProcessesService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(ProcessesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getPeriodStatus', () => {
    it('should GET /periods/current', () => {
      service.getPeriodStatus().subscribe();
      const req = httpMock.expectOne(`${BASE}/periods/current`);
      expect(req.request.method).toBe('GET');
      req.flush({ statusCode: 200, data: {}, timestamp: '' });
    });

    it('should propagate errors for the component to handle', () => {
      let caught = false;
      service.getPeriodStatus().subscribe({ error: () => { caught = true; } });
      httpMock.expectOne(`${BASE}/periods/current`)
        .flush('err', { status: 500, statusText: 'Server Error' });
      expect(caught).toBe(true);
    });
  });

  describe('openPeriod', () => {
    it('should POST to /periods/open with empty body', () => {
      service.openPeriod().subscribe();
      const req = httpMock.expectOne(`${BASE}/periods/open`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush({ statusCode: 200, data: {}, timestamp: '' });
    });
  });

  describe('closePeriod', () => {
    it('should POST to /periods/close with empty body', () => {
      service.closePeriod().subscribe();
      const req = httpMock.expectOne(`${BASE}/periods/close`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush({ statusCode: 200, data: {}, timestamp: '' });
    });
  });

  describe('startCommissionProcess', () => {
    it('should POST to /processes/commission with the request body', () => {
      const body = { month: '6', year: '2026' };
      service.startCommissionProcess(body).subscribe();
      const req = httpMock.expectOne(`${BASE}/processes/commission`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);
      req.flush({ statusCode: 200, data: {}, timestamp: '' });
    });
  });

  describe('startReceiptsGenerationProcess', () => {
    it('should POST to /receipts/generate/recurring with targetPeriod=OPEN by default', () => {
      service.startReceiptsGenerationProcess().subscribe();
      const req = httpMock.expectOne(
        (r) => r.url === `${BASE}/receipts/generate/recurring` && r.params.get('targetPeriod') === 'OPEN'
      );
      expect(req.request.method).toBe('POST');
      req.flush({ statusCode: 200, data: {}, timestamp: '' });
    });

    it('should send targetPeriod=SCHEDULED when requested', () => {
      service.startReceiptsGenerationProcess('SCHEDULED').subscribe();
      const req = httpMock.expectOne(
        (r) => r.url === `${BASE}/receipts/generate/recurring` && r.params.get('targetPeriod') === 'SCHEDULED'
      );
      expect(req.request.method).toBe('POST');
      req.flush({ statusCode: 200, data: {}, timestamp: '' });
    });
  });

  describe('getGrowthReport', () => {
    it('should GET /periods/growth-report with month and year params and return the data', () => {
      const data = {
        currentPeriod: {
          month: 7,
          year: 2026,
          totalReceiptsMxn: 15400,
          totalReceiptsUsd: 0,
          totalReceiptsConsolidatedMxn: 15400,
          newPromiseAmountMxn: 3200,
          newPromiseAmountUsd: 0,
        },
        previousPeriod: {
          month: 6,
          year: 2026,
          totalReceiptsMxn: 12000,
          totalReceiptsUsd: 0,
          totalReceiptsConsolidatedMxn: 12000,
          newPromiseAmountMxn: 2500,
          newPromiseAmountUsd: 0,
        },
        receiptsVariationMxn: { amount: 3400, percentage: 28.33 },
        receiptsVariationUsd: { amount: 0, percentage: 0 },
        promiseAmountVariationMxn: { amount: 700, percentage: 28.0 },
        promiseAmountVariationUsd: { amount: 0, percentage: 0 },
      };
      let result: any;
      service.getGrowthReport(7, 2026).subscribe(r => (result = r));

      const req = httpMock.expectOne(r =>
        r.url === `${BASE}/periods/growth-report` &&
        r.params.get('month') === '7' &&
        r.params.get('year') === '2026'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ data });
      expect(result).toEqual(data);
    });

    it('should show snackbar on error', () => {
      service.getGrowthReport(7, 2026).subscribe({ error: () => {} });
      httpMock.expectOne(r => r.url === `${BASE}/periods/growth-report`)
        .flush('err', { status: 500, statusText: 'Server Error' });
    });
  });
});
