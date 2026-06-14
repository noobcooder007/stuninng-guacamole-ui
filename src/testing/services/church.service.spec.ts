import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { vi } from 'vitest';
import { ChurchService, CreateChurchDto } from '@app/core/services/church.service';
import { environment } from 'environments/environment.development';

const BASE = `${environment.apiBaseUrl}/church`;

describe('ChurchService', () => {
  let service: ChurchService;
  let httpMock: HttpTestingController;
  const snackBarSpy = { open: vi.fn() };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ChurchService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatSnackBar, useValue: snackBarSpy },
      ],
    });
    service = TestBed.inject(ChurchService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.clearAllMocks();
  });

  describe('getChurches', () => {
    it('should GET /church with default pagination', () => {
      service.getChurches().subscribe();
      const req = httpMock.expectOne(r =>
        r.url === BASE &&
        r.params.get('page') === '1' &&
        r.params.get('limit') === '5'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ statusCode: 200, data: { items: [], meta: {} }, timestamp: '' });
    });

    it('should include filter params when provided', () => {
      service.getChurches(1, 5, { name: 'San Juan', vicaria: 'Norte' }).subscribe();
      const req = httpMock.expectOne(r =>
        r.params.get('name') === 'San Juan' && r.params.get('vicaria') === 'Norte'
      );
      req.flush({ statusCode: 200, data: { items: [], meta: {} }, timestamp: '' });
    });

    it('should not include empty filter params', () => {
      service.getChurches(1, 5, { name: '', vicaria: 'Norte' }).subscribe();
      const req = httpMock.expectOne(r => r.url === BASE);
      expect(req.request.params.has('name')).toBe(false);
      req.flush({ statusCode: 200, data: { items: [], meta: {} }, timestamp: '' });
    });

    it('should show snackbar on error', () => {
      service.getChurches().subscribe({ error: () => {} });
      httpMock.expectOne(r => r.url === BASE)
        .flush('err', { status: 500, statusText: 'Server Error' });
      expect(snackBarSpy.open).toHaveBeenCalledWith('Oops algo salio mal', 'Cerrar', { duration: 5000 });
    });
  });

  describe('create', () => {
    const dto: CreateChurchDto = {
      ecclesialIdentity: { name: 'San Juan', vicaria: 'Norte', decanato: 'D1', parroquia: 'P1', capilla: 'C1' },
      address: { street: 'Av. Principal', numeration: { noExt: '1' }, city: 'CDMX', state: 'CDMX', zipCode: '06600' },
      priest: { firstname: 'Juan', firstLastname: 'García' },
      auxiliarPriest: { firstname: 'Pedro', firstLastname: 'López' },
      phoneNumber: '5512345678',
    };

    it('should POST to /church with the dto', () => {
      service.create(dto).subscribe();
      const req = httpMock.expectOne(BASE);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush({});
    });

    it('should show snackbar on error', () => {
      service.create(dto).subscribe({ error: () => {} });
      httpMock.expectOne(BASE).flush('err', { status: 400, statusText: 'Bad Request' });
      expect(snackBarSpy.open).toHaveBeenCalledWith('Oops algo salio mal', 'Cerrar', { duration: 5000 });
    });
  });
});
