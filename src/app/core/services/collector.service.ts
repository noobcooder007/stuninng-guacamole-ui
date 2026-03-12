import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from 'environments/environment.development';

export interface Address {
    street: string;
    numeration: {
        noExt: string;
        noInt?: string;
    };
    neighborhood?: string;
    locality?: string;
    city: string;
    state: string;
    zipCode: string;
}

export interface PaymentData {
    commissionPercent: number;
    bank: string;
    reference: string;
}

export interface Collector {
    id: string;
    firstname: string;
    firstLastname: string;
    secondLastname?: string;
    maskedNSS: string;
    nss: string;
    maskedPhoneNumber: string;
    phoneNumber: string;
    maskedTelephoneNumber: string;
    telephoneNumber: string;
    notes: string;
    address: Address;
    paymentData: PaymentData;
    profilePath: string;
    profilePictureUrl: string;
    isActive: boolean;
    createdAt: string;
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
    firstname?: string;
    firstLastname?: string;
    secondLastname?: string;
    city?: string;
    state?: string;
    zipCode?: string;
}

export interface CreateCollectorDto {
    firstname: string;
    firstLastname: string;
    secondLastname?: string;
    nss: string;
    address: Address;
    phoneNumber: string;
    telephoneNumber?: string;
    commissionPercent: number;
    bank: string;
    reference: string;
    notes?: string;
    profilePicture: File;
    username: string;
    password: string;
}

@Injectable({ providedIn: 'root' })
export class CollectorService {
    private readonly http = inject(HttpClient);
    private readonly _snackbar = inject(MatSnackBar);

    getCollectors(page: number = 1, limit: number = 5, filters: CollectorFilters = {}): Observable<PaginatedResponse> {
        let params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());
        Object.entries(filters ?? {}).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                params = params.set(key, value as string);
            }
        });

        return this.http.get<PaginatedResponse>(`${environment.apiBaseUrl}/collector`, { params }).pipe(
            catchError((error) => {
                this._snackbar.open('Error al obtener colectores', 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }

    create(collector: CreateCollectorDto) {
        const formData = new FormData();
        formData.append('profilePicture', collector.profilePicture);
        formData.append('firstname', collector.firstname);
        formData.append('firstLastname', collector.firstLastname);
        collector.secondLastname && formData.append('secondLastname', collector.secondLastname);
        formData.append('nss', collector.nss);
        formData.append('address[street]', collector.address.street);
        formData.append('address[numeration][noExt]', collector.address.numeration.noExt);
        collector.address.numeration.noInt && formData.append('address[numeration][noInt]', collector.address.numeration.noInt);
        collector.address.neighborhood && formData.append('address[neighborhood]', collector.address.neighborhood);
        collector.address.locality && formData.append('address[locality]', collector.address.locality);
        formData.append('address[city]', collector.address.city);
        formData.append('address[state]', collector.address.state);
        formData.append('address[zipCode]', collector.address.zipCode);
        formData.append('phoneNumber', collector.phoneNumber);
        collector.telephoneNumber && formData.append('telephoneNumber', collector.telephoneNumber);
        formData.append('commissionPercent', collector.commissionPercent.toString());
        formData.append('bank', collector.bank);
        formData.append('reference', collector.reference);
        collector.notes && formData.append('notes', collector.notes);
        formData.append('username', collector.username);
        formData.append('password', collector.password);
        return this.http.post(`${environment.apiBaseUrl}/collector`, formData).pipe(
            catchError((error) => {
                this._snackbar.open('Error al crear colector', 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }
}
