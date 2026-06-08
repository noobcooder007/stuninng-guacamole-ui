import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from 'environments/environment.development';

export interface Permission {
    id: string;
    name: string;
    description?: string;
    isActive: boolean;
    createdAt: string;
    module?: string;
}

export interface Role {
    id: string;
    name: string;
    description?: string;
    isActive: boolean;
    permissions: Permission[];
    createdAt: string;
}

export interface RolesListResponse {
    statusCode: number;
    data: Role[];
    timestamp: string;
}

export interface SingleRoleResponse {
    statusCode: number;
    data: Role;
    timestamp: string;
}

export interface PermissionsListResponse {
    statusCode: number;
    data: Permission[];
    timestamp: string;
}

export interface CreateRoleDto {
    name: string;
    description?: string;
}

export interface UpdateRoleDto {
    name?: string;
    description?: string;
}

export interface AssignPermissionsDto {
    permissionIds: string[];
}

export interface CreatePermissionDto {
    name: string;
    description?: string;
}

@Injectable({ providedIn: 'root' })
export class RoleService {
    private readonly http = inject(HttpClient);
    private readonly snackBar = inject(MatSnackBar);

    getRoles(): Observable<RolesListResponse> {
        return this.http.get<RolesListResponse>(`${environment.apiBaseUrl}/roles`).pipe(
            catchError((error) => {
                this.snackBar.open('Error al obtener roles', 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }

    getRoleById(id: string): Observable<SingleRoleResponse> {
        return this.http.get<SingleRoleResponse>(`${environment.apiBaseUrl}/roles/${id}`).pipe(
            catchError((error) => {
                this.snackBar.open('Error al obtener el rol', 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }

    createRole(dto: CreateRoleDto): Observable<SingleRoleResponse> {
        return this.http.post<SingleRoleResponse>(`${environment.apiBaseUrl}/roles`, dto).pipe(
            catchError((error) => {
                this.snackBar.open('Error al crear el rol', 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }

    updateRole(id: string, dto: UpdateRoleDto): Observable<SingleRoleResponse> {
        return this.http.patch<SingleRoleResponse>(`${environment.apiBaseUrl}/roles/${id}`, dto).pipe(
            catchError((error) => {
                this.snackBar.open('Error al actualizar el rol', 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }

    deleteRole(id: string): Observable<void> {
        return this.http.delete<void>(`${environment.apiBaseUrl}/roles/${id}`).pipe(
            catchError((error) => {
                this.snackBar.open('Error al eliminar el rol', 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }

    getPermissions(): Observable<PermissionsListResponse> {
        return this.http.get<PermissionsListResponse>(`${environment.apiBaseUrl}/permissions`).pipe(
            catchError((error) => {
                this.snackBar.open('Error al obtener permisos', 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }

    createPermission(dto: CreatePermissionDto): Observable<{ statusCode: number; data: Permission; timestamp: string }> {
        return this.http.post<{ statusCode: number; data: Permission; timestamp: string }>(`${environment.apiBaseUrl}/permissions`, dto).pipe(
            catchError((error) => {
                this.snackBar.open('Error al crear el permiso', 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }

    deletePermission(id: string): Observable<void> {
        return this.http.delete<void>(`${environment.apiBaseUrl}/permissions/${id}`).pipe(
            catchError((error) => {
                this.snackBar.open('Error al eliminar el permiso', 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }

    assignPermissionsToRole(roleId: string, dto: AssignPermissionsDto): Observable<SingleRoleResponse> {
        return this.http.put<SingleRoleResponse>(`${environment.apiBaseUrl}/roles/${roleId}/permissions`, dto).pipe(
            catchError((error) => {
                this.snackBar.open('Error al asignar permisos', 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }
}
