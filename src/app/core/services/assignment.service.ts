import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from 'environments/environment.development';
import { catchError, Observable, throwError } from 'rxjs';

export interface Assignment {
    id: string;
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
    collectorId: string;
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

    getAssignments(page: number = 1, limit: number = 5, filters: AssignmentFilters): Observable<PaginatedResponse> {
        let params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());
        Object.entries(filters ?? {}).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                params = params.set(key, value as string);
            }
        });

        return this.http.get<PaginatedResponse>(`${environment.apiBaseUrl}/assignment/actives`, { params }).pipe(
            catchError((error) => {
                this._snackbar.open('Error al obtener colectores', 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }

    // create(collector: CreateCollectorDto) {
    //     return this.http.post(`${environment.apiBaseUrl}/collector`, formData).pipe(
    //         catchError((error) => {
    //             this._snackbar.open('Error al crear colector', 'Cerrar', { duration: 5000 });
    //             return throwError(() => error);
    //         })
    //     );
    // }
}