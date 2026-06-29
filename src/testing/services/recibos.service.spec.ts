import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { vi } from 'vitest';
import { RecibosService, CreateSpecialReceiptDto } from '@app/core/services/recibos.service';
import { environment } from 'environments/environment.development';

const BASE = `${environment.apiBaseUrl}/receipts`;

describe('RecibosService', () => {
  let service: RecibosService;
  let httpMock: HttpTestingController;
  const snackBarSpy = { open: vi.fn() };

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        RecibosService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatSnackBar, useValue: snackBarSpy },
      ],
    });
    service = TestBed.inject(RecibosService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.clearAllMocks();
  });

  describe('getRecibos', () => {
    it('should GET /receipts with default pagination', () => {
      service.getRecibos().subscribe();
      const req = httpMock.expectOne(r =>
        r.url === BASE &&
        r.params.get('page') === '1' &&
        r.params.get('limit') === '10'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ statusCode: 200, data: { items: [], meta: {} }, timestamp: '' });
    });

    it('should include filter params when provided', () => {
      service.getRecibos(1, 10, { month: '6', year: '2026', status: 'PAID' }).subscribe();
      const req = httpMock.expectOne(r =>
        r.params.get('month') === '6' &&
        r.params.get('year') === '2026' &&
        r.params.get('status') === 'PAID'
      );
      req.flush({ statusCode: 200, data: { items: [], meta: {} }, timestamp: '' });
    });

    it('should show snackbar on error', () => {
      service.getRecibos().subscribe({ error: () => {} });
      httpMock.expectOne(r => r.url === BASE)
        .flush('err', { status: 500, statusText: 'Server Error' });
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Error al obtener los recibos', 'Cerrar', { duration: 5000 }
      );
    });
  });

  describe('validarFolio', () => {
    it('should GET /receipts/validate/:folio', () => {
      service.validarFolio('REC-001').subscribe();
      const req = httpMock.expectOne(`${BASE}/validate/REC-001`);
      expect(req.request.method).toBe('GET');
      req.flush({ statusCode: 200, data: { valid: true, folio: 'REC-001', status: 'PENDING', amount: '500', currency: 'MXN' }, timestamp: '' });
    });

    it('should rethrow error without showing snackbar', () => {
      let error: any;
      service.validarFolio('INVALID').subscribe({ error: (e) => (error = e) });
      httpMock.expectOne(`${BASE}/validate/INVALID`)
        .flush('err', { status: 404, statusText: 'Not Found' });
      expect(error).toBeTruthy();
      expect(snackBarSpy.open).not.toHaveBeenCalled();
    });
  });

  describe('marcarComoPagados', () => {
    it('should POST to /receipts/mark-as-paid with dto', () => {
      const dto = { receipts: [{ receiptFolio: 'REC-001', paymentMethod: 'CASH' }] };
      service.marcarComoPagados(dto).subscribe();
      const req = httpMock.expectOne(`${BASE}/mark-as-paid`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush(null);
    });

    it('should show snackbar on error', () => {
      service.marcarComoPagados({ receipts: [] }).subscribe({ error: () => {} });
      httpMock.expectOne(`${BASE}/mark-as-paid`)
        .flush('err', { status: 500, statusText: 'Server Error' });
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Error al marcar los recibos como pagados', 'Cerrar', { duration: 5000 }
      );
    });
  });

  describe('getRecibo', () => {
    it('should GET /receipts/:folio', () => {
      service.getRecibo('JUN2026-0001-R-0001').subscribe();
      const req = httpMock.expectOne(`${BASE}/JUN2026-0001-R-0001`);
      expect(req.request.method).toBe('GET');
      req.flush({ statusCode: 200, data: {}, timestamp: '' });
    });

    it('should show snackbar on error', () => {
      service.getRecibo('INVALID').subscribe({ error: () => {} });
      httpMock.expectOne(`${BASE}/INVALID`)
        .flush('err', { status: 404, statusText: 'Not Found' });
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Error al obtener el recibo', 'Cerrar', { duration: 5000 }
      );
    });
  });

  describe('crearReciboEspecial', () => {
    const dto: CreateSpecialReceiptDto = {
      beneficientId: 'ben-1',
      collectorId: 'col-1',
      amount: 500,
      currency: 'MXN',
    };

    it('should POST to /receipts/generate/special with the dto', () => {
      service.crearReciboEspecial(dto).subscribe();
      const req = httpMock.expectOne(`${BASE}/generate/special`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush(new Blob());
    });

    it('should show snackbar on error', () => {
      service.crearReciboEspecial(dto).subscribe({ error: () => {} });
      httpMock.expectOne(`${BASE}/generate/special`)
        .error(new ProgressEvent('error'), { status: 400, statusText: 'Bad Request' });
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Error al crear el recibo especial', 'Cerrar', { duration: 5000 }
      );
    });
  });

  describe('cancelarRecibo', () => {
    it('should PATCH /receipts/:folio/void with reason', () => {
      service.cancelarRecibo('JUN2026-0001-R-0001', 'Duplicado').subscribe();
      const req = httpMock.expectOne(`${BASE}/JUN2026-0001-R-0001/cancel`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ reason: 'Duplicado' });
      req.flush(null);
    });

    it('should show snackbar on error', () => {
      service.cancelarRecibo('JUN2026-0001-R-0001', 'Motivo').subscribe({ error: () => {} });
      httpMock.expectOne(`${BASE}/JUN2026-0001-R-0001/cancel`)
        .flush('err', { status: 500, statusText: 'Server Error' });
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Error al cancelar el recibo', 'Cerrar', { duration: 5000 }
      );
    });
  });
});
