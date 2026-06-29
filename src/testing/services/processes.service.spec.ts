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
    it('should POST to /processes/generate-receipts with the request body', () => {
      const body = { month: '6', year: '2026' };
      service.startReceiptsGenerationProcess(body).subscribe();
      const req = httpMock.expectOne(`${BASE}/receipts/generate/recurring`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);
      req.flush({ statusCode: 200, data: {}, timestamp: '' });
    });
  });
});
