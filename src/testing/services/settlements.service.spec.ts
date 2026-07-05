import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { vi } from 'vitest';
import {
  SettlementsService,
  RegisterPaymentDto,
  BulkPaymentDto,
} from '@app/core/services/settlements.service';
import { environment } from 'environments/environment.development';

const BASE = environment.apiBaseUrl;

describe('SettlementsService', () => {
  let service: SettlementsService;
  let httpMock: HttpTestingController;
  const snackBarSpy = { open: vi.fn() };

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        SettlementsService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatSnackBar, useValue: snackBarSpy },
      ],
    });
    service = TestBed.inject(SettlementsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.clearAllMocks();
  });

  describe('getSettlements', () => {
    it('should GET /periods/:id/settlements and unwrap data', () => {
      let result: unknown;
      service.getSettlements('period-1').subscribe(r => (result = r));
      const req = httpMock.expectOne(`${BASE}/periods/period-1/settlements`);
      expect(req.request.method).toBe('GET');
      req.flush({ data: [] });
      expect(result).toEqual([]);
    });

    it('should show snackbar and rethrow on error', () => {
      let caught = false;
      service.getSettlements('period-1').subscribe({ error: () => { caught = true; } });
      httpMock.expectOne(`${BASE}/periods/period-1/settlements`)
        .flush('err', { status: 500, statusText: 'Server Error' });
      expect(caught).toBe(true);
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Error al obtener las liquidaciones', 'Cerrar', { duration: 5000 }
      );
    });
  });

  describe('registerPayment', () => {
    const dto: RegisterPaymentDto = {
      amount: 1500,
      paymentMethod: 'CASH',
      paidAt: '2026-06-01',
    };

    it('should POST to /periods/settlements/:id/payments with dto', () => {
      service.registerPayment('settlement-1', dto).subscribe();
      const req = httpMock.expectOne(`${BASE}/periods/settlements/settlement-1/payments`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush(null);
    });

    it('should show snackbar and rethrow on error', () => {
      let caught = false;
      service.registerPayment('settlement-1', dto).subscribe({ error: () => { caught = true; } });
      httpMock.expectOne(`${BASE}/periods/settlements/settlement-1/payments`)
        .flush('err', { status: 400, statusText: 'Bad Request' });
      expect(caught).toBe(true);
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Error al registrar el pago', 'Cerrar', { duration: 5000 }
      );
    });

    it('should include optional reference and notes when provided', () => {
      const dtoWithOptionals: RegisterPaymentDto = { ...dto, reference: 'REF-001', notes: 'Nota' };
      service.registerPayment('settlement-1', dtoWithOptionals).subscribe();
      const req = httpMock.expectOne(`${BASE}/periods/settlements/settlement-1/payments`);
      expect(req.request.body).toEqual(dtoWithOptionals);
      req.flush(null);
    });
  });

  describe('bulkPayment', () => {
    const dto: BulkPaymentDto = {
      paymentMethod: 'TRANSFER',
      paidAt: '2026-06-01',
    };

    it('should POST to /periods/:id/payments/bulk with dto', () => {
      service.bulkPayment('period-1', dto).subscribe();
      const req = httpMock.expectOne(`${BASE}/periods/period-1/payments/bulk`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush(null);
    });

    it('should show snackbar and rethrow on error', () => {
      let caught = false;
      service.bulkPayment('period-1', dto).subscribe({ error: () => { caught = true; } });
      httpMock.expectOne(`${BASE}/periods/period-1/payments/bulk`)
        .flush('err', { status: 500, statusText: 'Server Error' });
      expect(caught).toBe(true);
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Error al registrar el pago masivo', 'Cerrar', { duration: 5000 }
      );
    });
  });

  describe('getPaymentHistory', () => {
    it('should GET /periods/settlements/:id/payments and unwrap data', () => {
      let result: unknown;
      service.getPaymentHistory('settlement-1').subscribe(r => (result = r));
      const req = httpMock.expectOne(`${BASE}/periods/settlements/settlement-1/payments`);
      expect(req.request.method).toBe('GET');
      req.flush({ data: [] });
      expect(result).toEqual([]);
    });

    it('should show snackbar and rethrow on error', () => {
      let caught = false;
      service.getPaymentHistory('settlement-1').subscribe({ error: () => { caught = true; } });
      httpMock.expectOne(`${BASE}/periods/settlements/settlement-1/payments`)
        .flush('err', { status: 404, statusText: 'Not Found' });
      expect(caught).toBe(true);
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Error al obtener el historial de pagos', 'Cerrar', { duration: 5000 }
      );
    });
  });
});
