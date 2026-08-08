import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { vi } from 'vitest';
import {
  BeneficientService,
  CreateBeneficientDto,
  UpdatePersonalDto,
  UpdateAddressDto,
  UpdateContactDto,
  UpdateChurchDto,
  UpdateTaxDto,
  UpdatePrivacyDto,
} from '@app/core/services/beneficient.service';
import { environment } from 'environments/environment.development';

const BASE = `${environment.apiBaseUrl}/beneficient`;

describe('BeneficientService', () => {
  let service: BeneficientService;
  let httpMock: HttpTestingController;
  const snackBarSpy = { open: vi.fn() };

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        BeneficientService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatSnackBar, useValue: snackBarSpy },
      ],
    });
    service = TestBed.inject(BeneficientService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.clearAllMocks();
  });

  describe('getBeneficents', () => {
    it('should GET with default pagination params', () => {
      service.getBeneficents().subscribe();
      const req = httpMock.expectOne(r =>
        r.url === BASE &&
        r.params.get('page') === '1' &&
        r.params.get('limit') === '5'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ statusCode: 200, data: { items: [], meta: {} }, timestamp: '' });
    });

    it('should include filter params when provided', () => {
      service.getBeneficents(1, 5, { firstname: 'Juan', city: 'CDMX' }).subscribe();
      const req = httpMock.expectOne(r =>
        r.params.get('firstname') === 'Juan' && r.params.get('city') === 'CDMX'
      );
      req.flush({ statusCode: 200, data: { items: [], meta: {} }, timestamp: '' });
    });

    it('should not include empty filter params', () => {
      service.getBeneficents(1, 5, { firstname: '', city: 'CDMX' }).subscribe();
      const req = httpMock.expectOne(r => r.url === BASE);
      expect(req.request.params.has('firstname')).toBe(false);
      req.flush({ statusCode: 200, data: { items: [], meta: {} }, timestamp: '' });
    });

    it('should show snackbar on error', () => {
      service.getBeneficents().subscribe({ error: () => {} });
      httpMock.expectOne(r => r.url === BASE)
        .flush('err', { status: 500, statusText: 'Server Error' });
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Error al obtener bienhechores', 'Cerrar', { duration: 5000 }
      );
    });
  });

  describe('getUnassigned', () => {
    it('should GET /beneficient/unassigned', () => {
      service.getUnassigned().subscribe();
      const req = httpMock.expectOne(`${BASE}/unassigned`);
      expect(req.request.method).toBe('GET');
      req.flush({ statusCode: 200, data: { items: [], meta: {} }, timestamp: '' });
    });

    it('should show snackbar on error', () => {
      service.getUnassigned().subscribe({ error: () => {} });
      httpMock.expectOne(`${BASE}/unassigned`).flush('err', { status: 500, statusText: 'Server Error' });
      expect(snackBarSpy.open).toHaveBeenCalledWith('Error al obtener bienhechores sin asignar', 'Cerrar', { duration: 5000 });
    });
  });

  describe('getBeneficent', () => {
    it('should GET /beneficient/:id', () => {
      service.getBeneficent(42).subscribe();
      const req = httpMock.expectOne(`${BASE}/42`);
      expect(req.request.method).toBe('GET');
      req.flush({ statusCode: 200, data: {} });
    });

    it('should show snackbar on error', () => {
      service.getBeneficent(99).subscribe({ error: () => {} });
      httpMock.expectOne(`${BASE}/99`).flush('err', { status: 404, statusText: 'Not Found' });
      expect(snackBarSpy.open).toHaveBeenCalledWith('Error al obtener datos del bienhechor', 'Cerrar', { duration: 5000 });
    });
  });

  describe('create', () => {
    it('should POST to /beneficient', () => {
      const dto = { firstname: 'Ana' } as unknown as CreateBeneficientDto;
      service.create(dto).subscribe();
      const req = httpMock.expectOne(BASE);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush({});
    });

    it('should show snackbar on error', () => {
      service.create({} as CreateBeneficientDto).subscribe({ error: () => {} });
      httpMock.expectOne(BASE).flush('err', { status: 400, statusText: 'Bad Request' });
      expect(snackBarSpy.open).toHaveBeenCalledWith('Error al crear bienhechor', 'Cerrar', { duration: 5000 });
    });
  });

  describe('update', () => {
    it('should PUT to /beneficents/:id without the id in body', () => {
      const dto = { id: 7, firstname: 'Carlos' } as any;
      service.update(dto).subscribe();
      const req = httpMock.expectOne(`${environment.apiBaseUrl}/beneficents/7`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).not.toHaveProperty('id');
      req.flush({});
    });

    it('should show snackbar on error', () => {
      service.update({ id: 7 } as any).subscribe({ error: () => {} });
      httpMock.expectOne(`${environment.apiBaseUrl}/beneficents/7`).flush('err', { status: 500, statusText: 'Server Error' });
      expect(snackBarSpy.open).toHaveBeenCalledWith('Error al actualizar bienhechor', 'Cerrar', { duration: 5000 });
    });
  });

  describe('delete', () => {
    it('should DELETE /beneficents/:id', () => {
      service.delete(5).subscribe();
      const req = httpMock.expectOne(`${environment.apiBaseUrl}/beneficents/5`);
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });

    it('should show snackbar on error', () => {
      service.delete(5).subscribe({ error: () => {} });
      httpMock.expectOne(`${environment.apiBaseUrl}/beneficents/5`).flush('err', { status: 500, statusText: 'Server Error' });
      expect(snackBarSpy.open).toHaveBeenCalledWith('Error al eliminar bienhechor', 'Cerrar', { duration: 5000 });
    });
  });

  describe.each([
    {
      method: 'patchPersonal' as const,
      section: 'personal',
      dto: { firstname: 'Juan' } as UpdatePersonalDto,
      errorMsg: 'Error al actualizar información personal',
    },
    {
      method: 'patchAddress' as const,
      section: 'address',
      dto: { street: 'Av. Reforma' } as UpdateAddressDto,
      errorMsg: 'Error al actualizar domicilio',
    },
    {
      method: 'patchContact' as const,
      section: 'contact',
      dto: { email: 'a@b.com' } as UpdateContactDto,
      errorMsg: 'Error al actualizar contacto',
    },
    {
      method: 'patchChurch' as const,
      section: 'church',
      dto: { churchId: 'church-1' } as UpdateChurchDto,
      errorMsg: 'Error al actualizar iglesia',
    },
    {
      method: 'patchTax' as const,
      section: 'tax',
      dto: { rfc: 'XAXX010101000' } as UpdateTaxDto,
      errorMsg: 'Error al actualizar datos fiscales',
    },
    {
      method: 'patchPrivacy' as const,
      section: 'privacy',
      dto: { keepPrivate: true } as UpdatePrivacyDto,
      errorMsg: 'Error al actualizar privacidad',
    },
  ])('$method', ({ method, section, dto, errorMsg }) => {
    const ID = '42';
    const URL = `${BASE}/${ID}/${section}`;

    it(`should PATCH /beneficient/:id/${section} with the dto`, () => {
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
