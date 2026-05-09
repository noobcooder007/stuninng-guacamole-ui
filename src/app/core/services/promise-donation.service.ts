import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from 'environments/environment.development';
import { catchError, Observable, throwError } from 'rxjs';

export interface PromiseDonation {
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
        items: PromiseDonation[];
        meta: PaginatedMetadata;
    };
    timestamp: string;
}

export interface PromisesDonationFilters {
    currency?: string;
    method?: string;
    recurring?: boolean;
    recurrence?: string;
    isActive?: boolean;
}

export interface CreatePromiseDonationDto {
    amount: number;
    currency: 'MXN' | 'USD';
    method: string;
    startDate: string;
    recurrence: number;
    availability?: { day: string; time: string; note: string }[];
}

@Injectable({ providedIn: 'root' })
export class PromisesDonationService {
    private readonly http = inject(HttpClient);
    private readonly _snackbar = inject(MatSnackBar);

    getPromisesDonation(page: number = 1, limit: number = 5, filters: PromisesDonationFilters = {}): Observable<PaginatedResponse> {
        let params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());
        Object.entries(filters ?? {}).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                params = params.set(key, value as string);
            }
        });

        return this.http.get<PaginatedResponse>(`${environment.apiBaseUrl}/promises`, { params }).pipe(
            catchError((error) => {
                this._snackbar.open('Error al obtener colectores', 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }

    create(promise: CreatePromiseDonationDto) {
        return this.http.post(`${environment.apiBaseUrl}/promises`, promise).pipe(
            catchError((error) => {
                this._snackbar.open('Error al crear promesa de donación', 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }
}
