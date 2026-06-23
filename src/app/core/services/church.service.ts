import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from 'environments/environment.development';

export interface EcclesialIdentity {
    name: string;
    vicaria: string;
    decanato: string;
    parroquia: string;
    capilla: string;
}

export interface Address {
    street: string;
    numeration?: {
        noExt: string;
        noInt?: string;
    };
    neighborhood?: string;
    locality?: string;
    city: string;
    state: string;
    zipCode: string;
}

export interface Priest {
    firstname: string;
    firstLastname: string;
    secondLastname?: string;
}

export interface Church {
    id: string;
    ecclesialIdentity: EcclesialIdentity;
    address: Address;
    priest: Priest;
    auxiliarPriest: Priest;
    phoneNumber: string;
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
        items: Church[],
        meta: PaginatedMetadata,
    };
    timestamp: string;
}

export interface ChurchFilters {
    name?: string;
    vicaria?: string;
    decanato?: string;
    parroquia?: string;
    capilla?: string;
}

export interface CreateChurchDto {
    ecclesialIdentity: EcclesialIdentity;
    address: Address;
    priest: Priest;
    auxiliarPriest: Priest;
    phoneNumber: string;
}

export interface UpdateIdentityDto {
    name?: string;
    vicaria?: string;
    decanato?: string;
    parroquia?: string;
    capilla?: string;
}

export interface UpdateAddressDto {
    street?: string;
    numeration?: {
        noExt?: string;
        noInt?: string | null;
    };
    neighborhood?: string | null;
    locality?: string | null;
    city?: string;
    state?: string;
    zipCode?: string;
}

export interface UpdatePriestDto {
    firstname?: string;
    firstLastname?: string;
    secondLastname?: string;
}

export interface UpdatePhoneDto {
    phoneNumber?: string;
}

@Injectable({ providedIn: 'root' })
export class ChurchService {
    private readonly http = inject(HttpClient);
    private readonly _snackbar = inject(MatSnackBar);

    getChurches(page: number = 1, limit: number = 5, filters: ChurchFilters = {}): Observable<PaginatedResponse> {
        let params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());
        Object.entries(filters ?? {}).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                params = params.set(key, value);
            }
        });

        return this.http.get<PaginatedResponse>(`${environment.apiBaseUrl}/church`, { params }).pipe(
            catchError((error) => {
                this._snackbar.open('Oops algo salio mal', 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }

    getChurch(id: string): Observable<{ statusCode: number; data: Church }> {
        return this.http.get<{ statusCode: number; data: Church }>(`${environment.apiBaseUrl}/church/${id}`).pipe(
            catchError((error) => {
                this._snackbar.open('Error al obtener datos de la iglesia', 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }

    create(church: CreateChurchDto) {
        return this.http.post(`${environment.apiBaseUrl}/church`, church).pipe(
            catchError((error) => {
                this._snackbar.open('Oops algo salio mal', 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }

    patchIdentity(id: string, dto: UpdateIdentityDto): Observable<any> {
        return this.http.patch(`${environment.apiBaseUrl}/church/${id}/identity`, dto).pipe(
            catchError((error) => {
                this._snackbar.open('Error al actualizar identidad eclesiástica', 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }

    patchAddress(id: string, dto: UpdateAddressDto): Observable<any> {
        return this.http.patch(`${environment.apiBaseUrl}/church/${id}/address`, dto).pipe(
            catchError((error) => {
                this._snackbar.open('Error al actualizar domicilio', 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }

    patchPriest(id: string, dto: UpdatePriestDto): Observable<any> {
        return this.http.patch(`${environment.apiBaseUrl}/church/${id}/priest`, dto).pipe(
            catchError((error) => {
                this._snackbar.open('Error al actualizar datos del párroco', 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }

    patchAuxiliar(id: string, dto: UpdatePriestDto): Observable<any> {
        return this.http.patch(`${environment.apiBaseUrl}/church/${id}/auxiliar`, dto).pipe(
            catchError((error) => {
                this._snackbar.open('Error al actualizar datos del vicario', 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }

    patchPhone(id: string, dto: UpdatePhoneDto): Observable<any> {
        return this.http.patch(`${environment.apiBaseUrl}/church/${id}/phone`, dto).pipe(
            catchError((error) => {
                this._snackbar.open('Error al actualizar teléfono', 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }
}
