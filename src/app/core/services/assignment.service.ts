import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from 'environments/environment';
import { catchError, map, Observable, throwError } from 'rxjs';
import { apiErrorMessage } from '@app/shared/utils/api-error';

export interface AssignmentPerson {
    id: string;
    firstname: string;
    firstLastname: string;
    secondLastname?: string;
}

export interface Assignment {
    id: string;
    beneficient: AssignmentPerson;
    collector: AssignmentPerson;
    updatedAt: string;
}

export interface PaginatedMetadata {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    limit: number;
    page: number;
    itemCount: number;
    pageCount: number;
}

export interface PaginatedResponse {
    statusCode: number;
    data: {
        items: Assignment[];
        meta: PaginatedMetadata;
    };
    timestamp: string;
}

export interface AssignmentFilters {
    collectorId?: string;
}

export interface ReassignAssignmentsDto {
    assignationId: string;
    reason: string;
}

export interface ReasignAssignmentDto {
    collectorId: string;
    reassignAssignations: ReassignAssignmentsDto[];
}

export interface CreateAssignmentDto {
    collectorId: string;
    beneficientsIds: string[];
}

@Injectable({providedIn: 'root'})
export class AssignmentService {
    private readonly http = inject(HttpClient);
    private readonly _snackbar = inject(MatSnackBar);

    getAssignments(page: number = 1, limit: number = 5, filters: AssignmentFilters = {}): Observable<PaginatedResponse> {
        let params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                params = params.set(key, value as string);
            }
        });

        return this.http.get<PaginatedResponse>(`${environment.apiBaseUrl}/assignment/actives`, { params }).pipe(
            catchError((error) => {
                this._snackbar.open(apiErrorMessage(error, 'Error al obtener asignaciones activas'), 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }

    getOrphanedAssignments(page: number = 1, limit: number = 5): Observable<PaginatedResponse> {
        const params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());
        return this.http.get<PaginatedResponse>(`${environment.apiBaseUrl}/assignment/orphans`, { params }).pipe(
            catchError((error) => {
                this._snackbar.open(apiErrorMessage(error, 'Error al obtener asignaciones huérfanas'), 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }

    create(dto: CreateAssignmentDto): Observable<any> {
        return this.http.post(`${environment.apiBaseUrl}/assignment`, dto).pipe(
            catchError((error) => {
                this._snackbar.open(apiErrorMessage(error, 'Error al crear asignaciones'), 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }

    deactivate(id: string): Observable<any> {
        return this.http.delete(`${environment.apiBaseUrl}/assignment/${id}`).pipe(
            catchError((error) => {
                this._snackbar.open(apiErrorMessage(error, 'Error al desactivar asignación'), 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }

    getActiveListByCollector(collectorId: string): Observable<Assignment[]> {
        const params = new HttpParams().set('collectorId', collectorId);
        return this.http.get<{ data: Assignment[] }>(`${environment.apiBaseUrl}/assignment/active-list`, { params }).pipe(
            map(r => r?.data ?? []),
            catchError((error) => {
                this._snackbar.open(apiErrorMessage(error, 'Error al obtener asignaciones del colector'), 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }

    reassign(dto: ReasignAssignmentDto): Observable<any> {
        return this.http.post(`${environment.apiBaseUrl}/assignment/reassign`, dto).pipe(
            catchError((error) => {
                this._snackbar.open(apiErrorMessage(error, 'Error al reasignar asignaciones'), 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }
}