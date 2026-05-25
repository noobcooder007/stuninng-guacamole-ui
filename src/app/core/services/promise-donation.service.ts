import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from 'environments/environment.development';
import { catchError, Observable, throwError } from 'rxjs';
import { Beneficient } from './beneficient.service';

export interface PromiseDonation {
    id: string;
    beneficient: Beneficient;
    amount: number;
    currency: 'MXN' | 'USD';
    method: string;
    startDate: string;
    lastDonation: string;
    nextDonation: string;
    recurrence: number;
    isActive: boolean;
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

interface WeeklySchedule {
    day: string;
    hour: string;
    note: string;
}

interface Instructions {
    weeklySchedule: WeeklySchedule[];
    generalObservations: string;
}

export interface CreatePromiseDonationDto {
    beneficientId: string;
    amount: number;
    currency: 'MXN' | 'USD';
    method: string;
    startDate: string;
    recurrence: number;
    instructions?: Instructions;
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
    
    getPromisesDonationWithBeneficients(page: number = 1, limit: number = 5, filters: PromisesDonationFilters = {}): Observable<PaginatedResponse> {
        let params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());
        Object.entries(filters ?? {}).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                params = params.set(key, value as string);
            }
        });

        return this.http.get<PaginatedResponse>(`${environment.apiBaseUrl}/promises/with-beneficients`, { params }).pipe(
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
