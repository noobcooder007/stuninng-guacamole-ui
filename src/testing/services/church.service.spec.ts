import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { vi } from 'vitest';
import {
  ChurchService,
  CreateChurchDto,
  UpdateIdentityDto,
  UpdateAddressDto,
  UpdatePriestDto,
  UpdatePhoneDto,
} from '@app/core/services/church.service';
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

  describe('getChurch', () => {
    it('should GET /church/:id', () => {
      service.getChurch('abc').subscribe();
      const req = httpMock.expectOne(`${BASE}/abc`);
      expect(req.request.method).toBe('GET');
      req.flush({ statusCode: 200, data: {} });
    });

    it('should show snackbar on error', () => {
      service.getChurch('bad').subscribe({ error: () => {} });
      httpMock.expectOne(`${BASE}/bad`).flush('err', { status: 404, statusText: 'Not Found' });
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Error al obtener datos de la iglesia', 'Cerrar', { duration: 5000 }
      );
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

  describe.each([
    {
      method: 'patchIdentity' as const,
      section: 'identity',
      dto: { name: 'San Pedro' } as UpdateIdentityDto,
      errorMsg: 'Error al actualizar identidad eclesiástica',
    },
    {
      method: 'patchAddress' as const,
      section: 'address',
      dto: { street: 'Calle 1' } as UpdateAddressDto,
      errorMsg: 'Error al actualizar domicilio',
    },
    {
      method: 'patchPriest' as const,
      section: 'priest',
      dto: { firstname: 'Luis' } as UpdatePriestDto,
      errorMsg: 'Error al actualizar datos del párroco',
    },
    {
      method: 'patchAuxiliar' as const,
      section: 'auxiliar',
      dto: { firstname: 'Marco' } as UpdatePriestDto,
      errorMsg: 'Error al actualizar datos del vicario',
    },
    {
      method: 'patchPhone' as const,
      section: 'phone',
      dto: { phoneNumber: '5512345678' } as UpdatePhoneDto,
      errorMsg: 'Error al actualizar teléfono',
    },
  ])('$method', ({ method, section, dto, errorMsg }) => {
    const ID = 'church-1';
    const URL = `${BASE}/${ID}/${section}`;

    it(`should PATCH /church/:id/${section} with the dto`, () => {
      service[method](ID, dto as any).subscribe();
      const req = httpMock.expectOne(URL);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toMatchObject(dto);
      req.flush({});
    });

    it('should show snackbar on error', () => {
      service[method](ID, dto as any).subscribe({ error: () => {} });
      httpMock.expectOne(URL).flush('err', { status: 500, statusText: 'Server Error' });
      expect(snackBarSpy.open).toHaveBeenCalledWith(errorMsg, 'Cerrar', { duration: 5000 });
    });
  });
});
