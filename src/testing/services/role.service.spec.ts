import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { vi } from 'vitest';
import { RoleService } from '@app/core/services/role.service';
import { environment } from 'environments/environment.development';

const ROLES_BASE = `${environment.apiBaseUrl}/roles`;
const PERM_BASE = `${environment.apiBaseUrl}/permissions`;

describe('RoleService', () => {
  let service: RoleService;
  let httpMock: HttpTestingController;
  const snackBarSpy = { open: vi.fn() };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RoleService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatSnackBar, useValue: snackBarSpy },
      ],
    });
    service = TestBed.inject(RoleService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.clearAllMocks();
  });

  describe('getRoles', () => {
    it('should GET /roles', () => {
      service.getRoles().subscribe();
      const req = httpMock.expectOne(ROLES_BASE);
      expect(req.request.method).toBe('GET');
      req.flush({ statusCode: 200, data: [], timestamp: '' });
    });

    it('should show snackbar on error', () => {
      service.getRoles().subscribe({ error: () => {} });
      httpMock.expectOne(ROLES_BASE).flush('err', { status: 500, statusText: 'Server Error' });
      expect(snackBarSpy.open).toHaveBeenCalledWith('Error al obtener roles', 'Cerrar', { duration: 5000 });
    });
  });

  describe('getRoleById', () => {
    it('should GET /roles/:id', () => {
      service.getRoleById('role-1').subscribe();
      const req = httpMock.expectOne(`${ROLES_BASE}/role-1`);
      expect(req.request.method).toBe('GET');
      req.flush({ statusCode: 200, data: {}, timestamp: '' });
    });

    it('should show snackbar on error', () => {
      service.getRoleById('role-1').subscribe({ error: () => {} });
      httpMock.expectOne(`${ROLES_BASE}/role-1`).flush('err', { status: 404, statusText: 'Not Found' });
      expect(snackBarSpy.open).toHaveBeenCalledWith('Error al obtener el rol', 'Cerrar', { duration: 5000 });
    });
  });

  describe('createRole', () => {
    it('should POST to /roles with dto', () => {
      const dto = { name: 'SUPER_ADMIN', description: 'Administrador' };
      service.createRole(dto).subscribe();
      const req = httpMock.expectOne(ROLES_BASE);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush({ statusCode: 201, data: {}, timestamp: '' });
    });

    it('should show snackbar on error', () => {
      service.createRole({ name: 'X' }).subscribe({ error: () => {} });
      httpMock.expectOne(ROLES_BASE).flush('err', { status: 400, statusText: 'Bad Request' });
      expect(snackBarSpy.open).toHaveBeenCalledWith('Error al crear el rol', 'Cerrar', { duration: 5000 });
    });
  });

  describe('updateRole', () => {
    it('should PATCH /roles/:id with dto', () => {
      const dto = { name: 'COLLECTOR' };
      service.updateRole('role-2', dto).subscribe();
      const req = httpMock.expectOne(`${ROLES_BASE}/role-2`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(dto);
      req.flush({ statusCode: 200, data: {}, timestamp: '' });
    });

    it('should show snackbar on error', () => {
      service.updateRole('role-2', {}).subscribe({ error: () => {} });
      httpMock.expectOne(`${ROLES_BASE}/role-2`).flush('err', { status: 500, statusText: 'Server Error' });
      expect(snackBarSpy.open).toHaveBeenCalledWith('Error al actualizar el rol', 'Cerrar', { duration: 5000 });
    });
  });

  describe('deleteRole', () => {
    it('should DELETE /roles/:id', () => {
      service.deleteRole('role-3').subscribe();
      const req = httpMock.expectOne(`${ROLES_BASE}/role-3`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });

    it('should show snackbar on error', () => {
      service.deleteRole('role-3').subscribe({ error: () => {} });
      httpMock.expectOne(`${ROLES_BASE}/role-3`).flush('err', { status: 500, statusText: 'Server Error' });
      expect(snackBarSpy.open).toHaveBeenCalledWith('Error al eliminar el rol', 'Cerrar', { duration: 5000 });
    });
  });

  describe('getPermissions', () => {
    it('should GET /permissions', () => {
      service.getPermissions().subscribe();
      const req = httpMock.expectOne(PERM_BASE);
      expect(req.request.method).toBe('GET');
      req.flush({ statusCode: 200, data: [], timestamp: '' });
    });

    it('should show snackbar on error', () => {
      service.getPermissions().subscribe({ error: () => {} });
      httpMock.expectOne(PERM_BASE).flush('err', { status: 500, statusText: 'Server Error' });
      expect(snackBarSpy.open).toHaveBeenCalledWith('Error al obtener permisos', 'Cerrar', { duration: 5000 });
    });
  });

  describe('createPermission', () => {
    it('should POST to /permissions with dto', () => {
      const dto = { name: 'COLLECTORS_CREATE', description: 'Crear colectores' };
      service.createPermission(dto).subscribe();
      const req = httpMock.expectOne(PERM_BASE);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush({ statusCode: 201, data: {}, timestamp: '' });
    });

    it('should show snackbar on error', () => {
      service.createPermission({ name: 'X' }).subscribe({ error: () => {} });
      httpMock.expectOne(PERM_BASE).flush('err', { status: 400, statusText: 'Bad Request' });
      expect(snackBarSpy.open).toHaveBeenCalledWith('Error al crear el permiso', 'Cerrar', { duration: 5000 });
    });
  });

  describe('deletePermission', () => {
    it('should DELETE /permissions/:id', () => {
      service.deletePermission('perm-1').subscribe();
      const req = httpMock.expectOne(`${PERM_BASE}/perm-1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });

    it('should show snackbar on error', () => {
      service.deletePermission('perm-1').subscribe({ error: () => {} });
      httpMock.expectOne(`${PERM_BASE}/perm-1`).flush('err', { status: 500, statusText: 'Server Error' });
      expect(snackBarSpy.open).toHaveBeenCalledWith('Error al eliminar el permiso', 'Cerrar', { duration: 5000 });
    });
  });

  describe('assignPermissionsToRole', () => {
    it('should PUT /roles/:roleId/permissions with dto', () => {
      const dto = { permissionIds: ['p1', 'p2'] };
      service.assignPermissionsToRole('role-1', dto).subscribe();
      const req = httpMock.expectOne(`${ROLES_BASE}/role-1/permissions`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(dto);
      req.flush({ statusCode: 200, data: {}, timestamp: '' });
    });

    it('should show snackbar on error', () => {
      service.assignPermissionsToRole('role-1', { permissionIds: [] }).subscribe({ error: () => {} });
      httpMock.expectOne(`${ROLES_BASE}/role-1/permissions`).flush('err', { status: 500, statusText: 'Server Error' });
      expect(snackBarSpy.open).toHaveBeenCalledWith('Error al asignar permisos', 'Cerrar', { duration: 5000 });
    });
  });
});
