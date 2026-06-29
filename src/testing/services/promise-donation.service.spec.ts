import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { vi } from 'vitest';
import { PromisesDonationService, CreatePromiseDonationDto } from '@app/core/services/promise-donation.service';
import { environment } from 'environments/environment.development';

const BASE = `${environment.apiBaseUrl}/promises`;

describe('PromisesDonationService', () => {
  let service: PromisesDonationService;
  let httpMock: HttpTestingController;
  const snackBarSpy = { open: vi.fn() };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PromisesDonationService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatSnackBar, useValue: snackBarSpy },
      ],
    });
    service = TestBed.inject(PromisesDonationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.clearAllMocks();
  });

  describe('getPromisesDonation', () => {
    it('should GET /promises with default pagination', () => {
      service.getPromisesDonation().subscribe();
      const req = httpMock.expectOne(r =>
        r.url === BASE &&
        r.params.get('page') === '1' &&
        r.params.get('limit') === '5'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ statusCode: 200, data: { items: [], meta: {} }, timestamp: '' });
    });

    it('should include filter params when provided', () => {
      service.getPromisesDonation(1, 5, { currency: 'MXN', isActive: true }).subscribe();
      const req = httpMock.expectOne(r =>
        r.params.get('currency') === 'MXN' && r.params.get('isActive') === 'true'
      );
      req.flush({ statusCode: 200, data: { items: [], meta: {} }, timestamp: '' });
    });

    it('should show snackbar on error', () => {
      service.getPromisesDonation().subscribe({ error: () => {} });
      httpMock.expectOne(r => r.url === BASE)
        .flush('err', { status: 500, statusText: 'Server Error' });
      expect(snackBarSpy.open).toHaveBeenCalledWith('Error al obtener colectores', 'Cerrar', { duration: 5000 });
    });
  });

  describe('getPromisesDonationWithBeneficients', () => {
    it('should GET /promises/with-beneficients with default pagination', () => {
      service.getPromisesDonationWithBeneficients().subscribe();
      const req = httpMock.expectOne(r =>
        r.url === `${BASE}/with-beneficients` &&
        r.params.get('page') === '1' &&
        r.params.get('limit') === '5'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ statusCode: 200, data: { items: [], meta: {} }, timestamp: '' });
    });

    it('should show snackbar on error', () => {
      service.getPromisesDonationWithBeneficients().subscribe({ error: () => {} });
      httpMock.expectOne(r => r.url === `${BASE}/with-beneficients`)
        .flush('err', { status: 500, statusText: 'Server Error' });
      expect(snackBarSpy.open).toHaveBeenCalledWith('Error al obtener colectores', 'Cerrar', { duration: 5000 });
    });
  });

  describe('create', () => {
    const dto: CreatePromiseDonationDto = {
      beneficientId: 'b-1',
      promiseAmount: 500,
      currency: 'MXN',
      method: 'CASH',
      startDate: '2026-01-01',
      recurrence: 'MONTHLY',
    };

    it('should POST to /promises with the dto', () => {
      service.create(dto).subscribe();
      const req = httpMock.expectOne(BASE);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush({});
    });

    it('should show snackbar on error', () => {
      service.create(dto).subscribe({ error: () => {} });
      httpMock.expectOne(BASE).flush('err', { status: 400, statusText: 'Bad Request' });
      expect(snackBarSpy.open).toHaveBeenCalledWith('Error al crear promesa de donación', 'Cerrar', { duration: 5000 });
    });
  });
});
