import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { vi } from 'vitest';
import { CollectorService, CreateCollectorDto } from '@app/core/services/collector.service';
import { environment } from 'environments/environment.development';

const BASE = `${environment.apiBaseUrl}/collector`;

describe('CollectorService', () => {
  let service: CollectorService;
  let httpMock: HttpTestingController;
  const snackBarSpy = { open: vi.fn() };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CollectorService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatSnackBar, useValue: snackBarSpy },
      ],
    });
    service = TestBed.inject(CollectorService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.clearAllMocks();
  });

  describe('getCollectors', () => {
    it('should GET with default pagination', () => {
      service.getCollectors().subscribe();
      const req = httpMock.expectOne(r =>
        r.url === BASE &&
        r.params.get('page') === '1' &&
        r.params.get('limit') === '5'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ statusCode: 200, data: { items: [], meta: {} }, timestamp: '' });
    });

    it('should include filter params', () => {
      service.getCollectors(1, 5, { firstname: 'Pedro', city: 'GDL' }).subscribe();
      const req = httpMock.expectOne(r =>
        r.params.get('firstname') === 'Pedro' && r.params.get('city') === 'GDL'
      );
      req.flush({ statusCode: 200, data: { items: [], meta: {} }, timestamp: '' });
    });

    it('should show snackbar on error', () => {
      service.getCollectors().subscribe({ error: () => {} });
      httpMock.expectOne(r => r.url === BASE)
        .flush('err', { status: 500, statusText: 'Server Error' });
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Error al obtener colectores', 'Cerrar', { duration: 5000 }
      );
    });
  });

  describe('getActiveList', () => {
    it('should GET /collector/active-list and return the data array', () => {
      const items = [{ id: '1', firstname: 'Luis', firstLastname: 'Pérez', collectorNumber: 1 }];
      let result: any;
      service.getActiveList().subscribe(r => (result = r));

      const req = httpMock.expectOne(r => r.url === `${BASE}/active-list`);
      expect(req.request.method).toBe('GET');
      req.flush({ data: items });
      expect(result).toEqual(items);
    });

    it('should include search param when provided', () => {
      service.getActiveList('Luis').subscribe();
      const req = httpMock.expectOne(r =>
        r.url === `${BASE}/active-list` && r.params.get('search') === 'Luis'
      );
      req.flush({ data: [] });
    });

    it('should not include search param for blank string', () => {
      service.getActiveList('   ').subscribe();
      const req = httpMock.expectOne(r => r.url === `${BASE}/active-list`);
      expect(req.request.params.has('search')).toBe(false);
      req.flush({ data: [] });
    });

    it('should return empty array when response has no data', () => {
      let result: any;
      service.getActiveList().subscribe(r => (result = r));
      httpMock.expectOne(r => r.url === `${BASE}/active-list`).flush({});
      expect(result).toEqual([]);
    });

    it('should show snackbar on error', () => {
      service.getActiveList().subscribe({ error: () => {} });
      httpMock.expectOne(r => r.url === `${BASE}/active-list`)
        .flush('err', { status: 500, statusText: 'Server Error' });
      expect(snackBarSpy.open).toHaveBeenCalledWith('Error al buscar colectores', 'Cerrar', { duration: 5000 });
    });
  });

  describe('create', () => {
    const baseDto: CreateCollectorDto = {
      firstname: 'Luis',
      firstLastname: 'García',
      nss: '12345678901',
      address: {
        street: 'Av. Reforma',
        numeration: { noExt: '100' },
        city: 'CDMX',
        state: 'CDMX',
        zipCode: '06600',
      },
      phoneNumber: '5512345678',
      commissionPercent: 10,
      bank: 'BBVA',
      reference: 'REF-001',
      profilePicture: new File(['photo'], 'photo.jpg', { type: 'image/jpeg' }),
      username: 'lgarcial',
      password: 'pass123',
    };

    it('should POST FormData to /collector', () => {
      service.create(baseDto).subscribe();
      const req = httpMock.expectOne(`${environment.apiBaseUrl}/collector`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toBeInstanceOf(FormData);
      const fd = req.request.body as FormData;
      expect(fd.get('firstname')).toBe('Luis');
      expect(fd.get('nss')).toBe('12345678901');
      expect(fd.get('address[city]')).toBe('CDMX');
      expect(fd.get('commissionPercent')).toBe('10');
      req.flush({});
    });

    it('should append optional secondLastname when provided', () => {
      service.create({ ...baseDto, secondLastname: 'López' }).subscribe();
      const req = httpMock.expectOne(`${environment.apiBaseUrl}/collector`);
      const fd = req.request.body as FormData;
      expect(fd.get('secondLastname')).toBe('López');
      req.flush({});
    });

    it('should NOT append secondLastname when omitted', () => {
      service.create(baseDto).subscribe();
      const req = httpMock.expectOne(`${environment.apiBaseUrl}/collector`);
      const fd = req.request.body as FormData;
      expect(fd.get('secondLastname')).toBeNull();
      req.flush({});
    });

    it('should append noInt when provided', () => {
      const dto = { ...baseDto, address: { ...baseDto.address, numeration: { noExt: '100', noInt: 'A' } } };
      service.create(dto).subscribe();
      const req = httpMock.expectOne(`${environment.apiBaseUrl}/collector`);
      const fd = req.request.body as FormData;
      expect(fd.get('address[numeration][noInt]')).toBe('A');
      req.flush({});
    });

    it('should append neighborhood when provided', () => {
      const dto = { ...baseDto, address: { ...baseDto.address, neighborhood: 'Centro' } };
      service.create(dto).subscribe();
      const req = httpMock.expectOne(`${environment.apiBaseUrl}/collector`);
      expect((req.request.body as FormData).get('address[neighborhood]')).toBe('Centro');
      req.flush({});
    });

    it('should append locality when provided', () => {
      const dto = { ...baseDto, address: { ...baseDto.address, locality: 'Tlalpan' } };
      service.create(dto).subscribe();
      const req = httpMock.expectOne(`${environment.apiBaseUrl}/collector`);
      expect((req.request.body as FormData).get('address[locality]')).toBe('Tlalpan');
      req.flush({});
    });

    it('should append telephoneNumber when provided', () => {
      const dto = { ...baseDto, telephoneNumber: '5500000001' };
      service.create(dto).subscribe();
      const req = httpMock.expectOne(`${environment.apiBaseUrl}/collector`);
      expect((req.request.body as FormData).get('telephoneNumber')).toBe('5500000001');
      req.flush({});
    });

    it('should append notes when provided', () => {
      const dto = { ...baseDto, notes: 'Notas de prueba' };
      service.create(dto).subscribe();
      const req = httpMock.expectOne(`${environment.apiBaseUrl}/collector`);
      expect((req.request.body as FormData).get('notes')).toBe('Notas de prueba');
      req.flush({});
    });

    it('should show snackbar on error', () => {
      service.create(baseDto).subscribe({ error: () => {} });
      httpMock.expectOne(`${environment.apiBaseUrl}/collector`)
        .flush('err', { status: 400, statusText: 'Bad Request' });
      expect(snackBarSpy.open).toHaveBeenCalledWith('Error al crear colector', 'Cerrar', { duration: 5000 });
    });
  });
});
