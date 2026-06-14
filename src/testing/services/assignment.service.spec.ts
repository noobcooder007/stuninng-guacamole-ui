import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { vi } from 'vitest';
import { AssignmentService } from '@app/core/services/assignment.service';
import { environment } from 'environments/environment.development';

const BASE = `${environment.apiBaseUrl}/assignment`;

describe('AssignmentService', () => {
  let service: AssignmentService;
  let httpMock: HttpTestingController;
  const snackBarSpy = { open: vi.fn() };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AssignmentService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatSnackBar, useValue: snackBarSpy },
      ],
    });
    service = TestBed.inject(AssignmentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.clearAllMocks();
  });

  describe('getAssignments', () => {
    it('should GET actives with default pagination params', () => {
      service.getAssignments().subscribe();
      const req = httpMock.expectOne(r =>
        r.url === `${BASE}/actives` &&
        r.params.get('page') === '1' &&
        r.params.get('limit') === '5'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ statusCode: 200, data: { items: [], meta: {} }, timestamp: '' });
    });

    it('should include filter params when provided', () => {
      service.getAssignments(2, 10, { collectorId: 'col-1' }).subscribe();
      const req = httpMock.expectOne(r =>
        r.params.get('collectorId') === 'col-1' &&
        r.params.get('page') === '2' &&
        r.params.get('limit') === '10'
      );
      req.flush({ statusCode: 200, data: { items: [], meta: {} }, timestamp: '' });
    });

    it('should show snackbar and rethrow on error', () => {
      service.getAssignments().subscribe({ error: () => {} });
      httpMock.expectOne(r => r.url.includes('/actives'))
        .flush('err', { status: 500, statusText: 'Server Error' });
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Error al obtener asignaciones activas', 'Cerrar', { duration: 5000 }
      );
    });
  });

  describe('getOrphanedAssignments', () => {
    it('should GET orphans with default pagination', () => {
      service.getOrphanedAssignments().subscribe();
      const req = httpMock.expectOne(r =>
        r.url === `${BASE}/orphans` &&
        r.params.get('page') === '1' &&
        r.params.get('limit') === '5'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ statusCode: 200, data: { items: [], meta: {} }, timestamp: '' });
    });

    it('should show snackbar on error', () => {
      service.getOrphanedAssignments().subscribe({ error: () => {} });
      httpMock.expectOne(r => r.url.includes('/orphans'))
        .flush('err', { status: 500, statusText: 'Server Error' });
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Error al obtener asignaciones huérfanas', 'Cerrar', { duration: 5000 }
      );
    });
  });

  describe('create', () => {
    it('should POST to /assignment with the dto', () => {
      const dto = { collectorId: 'c1', beneficientsIds: ['b1', 'b2'] };
      service.create(dto).subscribe();
      const req = httpMock.expectOne(BASE);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush({});
    });

    it('should show snackbar on error', () => {
      service.create({ collectorId: 'c1', beneficientsIds: [] }).subscribe({ error: () => {} });
      httpMock.expectOne(BASE).flush('err', { status: 400, statusText: 'Bad Request' });
      expect(snackBarSpy.open).toHaveBeenCalledWith('Error al crear asignaciones', 'Cerrar', { duration: 5000 });
    });
  });

  describe('deactivate', () => {
    it('should DELETE /assignment/:id', () => {
      service.deactivate('assign-1').subscribe();
      const req = httpMock.expectOne(`${BASE}/assign-1`);
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });

    it('should show snackbar on error', () => {
      service.deactivate('assign-1').subscribe({ error: () => {} });
      httpMock.expectOne(`${BASE}/assign-1`).flush('err', { status: 500, statusText: 'Server Error' });
      expect(snackBarSpy.open).toHaveBeenCalledWith('Error al desactivar asignación', 'Cerrar', { duration: 5000 });
    });
  });

  describe('reassign', () => {
    it('should POST to /assignment/reassign with the dto', () => {
      const dto = {
        collectorId: 'c2',
        reassignAssignations: [{ assignationId: 'a1', reason: 'vacaciones' }],
      };
      service.reassign(dto).subscribe();
      const req = httpMock.expectOne(`${BASE}/reassign`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush({});
    });

    it('should show snackbar on error', () => {
      service.reassign({ collectorId: 'c2', reassignAssignations: [] }).subscribe({ error: () => {} });
      httpMock.expectOne(`${BASE}/reassign`).flush('err', { status: 500, statusText: 'Server Error' });
      expect(snackBarSpy.open).toHaveBeenCalledWith('Error al reasignar asignaciones', 'Cerrar', { duration: 5000 });
    });
  });
});
