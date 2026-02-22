import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from 'environments/environment.development';

export interface Collector {
    id: number;
    noColector: string;
    nombre: string;
    apPaterno?: string;
    apMaterno?: string;
    rfc?: string;
    telefono?: string;
    email?: string;
    status?: string;
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
        items: Collector[];
        meta: PaginatedMetadata;
    };
    timestamp: string;
}

export interface CollectorFilters {
    nombre?: string;
    apPaterno?: string;
    apMaterno?: string;
    noColector?: string;
}

export interface CreateCollectorDto {
    noColector: string;
    nombre: string;
    apPaterno?: string;
    apMaterno?: string;
    rfc?: string;
    telefono?: string;
    email?: string;
}

@Injectable({ providedIn: 'root' })
export class CollectorService {
    private readonly http = inject(HttpClient);
    private readonly _snackbar = inject(MatSnackBar);

    getCollectors(page: number = 1, limit: number = 5, filters: CollectorFilters = {}): Observable<PaginatedResponse> {
        let params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());
        Object.entries(filters ?? {}).forEach(([key, value]) => {
            if (value) {
                params = params.set(key, value as string);
            }
        });

        return this.http.get<PaginatedResponse>(`${environment.apiBaseUrl}/collectors`, { params }).pipe(
            catchError((error) => {
                this._snackbar.open('Error al obtener colectores', 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }

    create(collector: CreateCollectorDto) {
        return this.http.post(`${environment.apiBaseUrl}/collectors`, collector).pipe(
            catchError((error) => {
                this._snackbar.open('Error al crear colector', 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }
}
