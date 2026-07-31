import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, map, Observable, throwError } from 'rxjs';
import { environment } from 'environments/environment';
import { apiErrorMessage } from '@app/shared/utils/api-error';

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

export interface Beneficient {
    id: string | number;
    title: string;
    firstname: string;
    firstLastname: string;
    secondLastname: string | null;
    birthday: Date;
    genre: string;
    maritalStatus: string;
    weddingAniversary: Date | null;
    address: Address;
    email: string | null;
    phoneNumber: string | null;
    person: string | null;
    registeredName: string | null;
    rfc: string | null;
    createdAt: Date;
    isActive: boolean;
    beneficientNumber: number;
    maskedEmail?: string;
    maskedRFC?: string;
}

export interface BeneficientDetail extends Beneficient {
    keepPrivate: boolean;
    church?: {
        id: string;
        ecclesialIdentity: {
            name: string;
            vicaria?: string;
            decanato?: string;
            parroquia?: string;
            capilla?: string;
        };
    };
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
        items: Beneficient[];
        meta: PaginatedMetadata;
    };
    timestamp: string;
}

export interface BeneficientFilters {
    firstname?: string;
    firstLastname?: string;
    secondLastname?: string;
    city?: string;
    state?: string;
    zipCode?: string;
}

export interface CreateBeneficientDto {
    title: string;
    firstname: string;
    firstLastname: string;
    secondLastname: string;
    birthday: Date;
    weddingAnniversary?: Date;
    genre: string;
    maritalStatus: string;
    email?: string;
    phoneNumber?: string;
    address: Address;
    churchId: string;
    person?: string;
    registeredName?: string;
    rfc?: string;
    keepPrivate: boolean;
}

export interface UpdateBeneficientDto extends CreateBeneficientDto {
    id: number;
}

export interface UpdatePersonalDto {
    title?: string;
    firstname?: string;
    firstLastname?: string;
    secondLastname?: string;
    birthday?: Date | string;
    genre?: string;
    maritalStatus?: string;
    weddingAnniversary?: Date | string | null;
}

export interface UpdateAddressDto {
    street?: string;
    numeration?: {
        noExt?: string;
        noInt?: string;
    };
    neighborhood?: string | null;
    locality?: string | null;
    city?: string;
    state?: string;
    zipCode?: string;
}

export interface UpdateContactDto {
    email?: string | null;
    phoneNumber?: string | null;
}

export interface UpdateChurchDto {
    churchId: string;
}

export interface UpdateTaxDto {
    person?: 'FISICA' | 'MORAL' | null;
    registeredName?: string;
    rfc?: string;
}

export interface UpdatePrivacyDto {
    keepPrivate: boolean;
}

@Injectable({ providedIn: 'root' })
export class BeneficientService {
    private readonly http = inject(HttpClient);
    private readonly snackbar = inject(MatSnackBar);

    reportePdf(id: string | number): Observable<Blob> {
        return this.http.get(`${environment.apiBaseUrl}/beneficient/${id}/report/pdf`, { responseType: 'blob' }).pipe(
            catchError((error) => {
                this.snackbar.open(apiErrorMessage(error, 'Error al generar el reporte del bienhechor'), 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }

    registroPdf(): Observable<Blob> {
        return this.http.get(`${environment.apiBaseUrl}/beneficient/registry/pdf`, { responseType: 'blob' }).pipe(
            catchError((error) => {
                this.snackbar.open(apiErrorMessage(error, 'Error al generar el registro de bienhechores'), 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }

    getActiveList(search?: string): Observable<Beneficient[]> {
        let params = new HttpParams();
        if (search?.trim()) params = params.set('search', search.trim());
        return this.http.get<{ data: Beneficient[] }>(`${environment.apiBaseUrl}/beneficient/active-list`, { params }).pipe(
            map(r => r?.data ?? []),
            catchError((error) => {
                this.snackbar.open(apiErrorMessage(error, 'Error al buscar bienhechores'), 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }

    getBeneficents(
        page: number = 1,
        limit: number = 5,
        filters: BeneficientFilters = {}
    ): Observable<PaginatedResponse> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString());

        Object.entries(filters ?? {}).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                params = params.set(key, value);
            }
        });

        return this.http
            .get<PaginatedResponse>(`${environment.apiBaseUrl}/beneficient`, { params })
            .pipe(
                catchError((error) => {
                    this.snackbar.open(apiErrorMessage(error, 'Error al obtener bienhechores'), 'Cerrar', { duration: 5000 });
                    return throwError(() => error);
                })
            );
    }

    getUnassigned(): Observable<PaginatedResponse> {
        return this.http
            .get<PaginatedResponse>(`${environment.apiBaseUrl}/beneficient/unassigned`)
            .pipe(
                catchError((error) => {
                    this.snackbar.open(apiErrorMessage(error, 'Error al obtener bienhechores sin asignar'), 'Cerrar', { duration: 5000 });
                    return throwError(() => error);
                })
            );
    }

    getBeneficent(id: string | number): Observable<{ statusCode: number; data: BeneficientDetail }> {
        return this.http
            .get<{ statusCode: number; data: BeneficientDetail }>(`${environment.apiBaseUrl}/beneficient/${id}`)
            .pipe(
                catchError((error) => {
                    this.snackbar.open(apiErrorMessage(error, 'Error al obtener datos del bienhechore'), 'Cerrar', { duration: 5000 });
                    return throwError(() => error);
                })
            );
    }

    create(beneficent: CreateBeneficientDto): Observable<any> {
        return this.http
            .post(`${environment.apiBaseUrl}/beneficient`, beneficent)
            .pipe(
                catchError((error) => {
                    this.snackbar.open(apiErrorMessage(error, 'Error al crear bienhechore'), 'Cerrar', { duration: 5000 });
                    return throwError(() => error);
                })
            );
    }

    update(beneficent: UpdateBeneficientDto): Observable<any> {
        const { id, ...updateData } = beneficent;
        return this.http
            .put(`${environment.apiBaseUrl}/beneficents/${id}`, updateData)
            .pipe(
                catchError((error) => {
                    this.snackbar.open(apiErrorMessage(error, 'Error al actualizar bienhechore'), 'Cerrar', { duration: 5000 });
                    return throwError(() => error);
                })
            );
    }

    delete(id: number): Observable<any> {
        return this.http
            .delete(`${environment.apiBaseUrl}/beneficents/${id}`)
            .pipe(
                catchError((error) => {
                    this.snackbar.open(apiErrorMessage(error, 'Error al eliminar bienhechore'), 'Cerrar', { duration: 5000 });
                    return throwError(() => error);
                })
            );
    }

    patchPersonal(id: string | number, dto: UpdatePersonalDto): Observable<any> {
        return this.http
            .patch(`${environment.apiBaseUrl}/beneficient/${id}/personal`, dto)
            .pipe(catchError((error) => {
                this.snackbar.open(apiErrorMessage(error, 'Error al actualizar información personal'), 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            }));
    }

    patchAddress(id: string | number, dto: UpdateAddressDto): Observable<any> {
        return this.http
            .patch(`${environment.apiBaseUrl}/beneficient/${id}/address`, dto)
            .pipe(catchError((error) => {
                this.snackbar.open(apiErrorMessage(error, 'Error al actualizar domicilio'), 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            }));
    }

    patchContact(id: string | number, dto: UpdateContactDto): Observable<any> {
        return this.http
            .patch(`${environment.apiBaseUrl}/beneficient/${id}/contact`, dto)
            .pipe(catchError((error) => {
                this.snackbar.open(apiErrorMessage(error, 'Error al actualizar contacto'), 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            }));
    }

    patchChurch(id: string | number, dto: UpdateChurchDto): Observable<any> {
        return this.http
            .patch(`${environment.apiBaseUrl}/beneficient/${id}/church`, dto)
            .pipe(catchError((error) => {
                this.snackbar.open(apiErrorMessage(error, 'Error al actualizar iglesia'), 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            }));
    }

    patchTax(id: string | number, dto: UpdateTaxDto): Observable<any> {
        return this.http
            .patch(`${environment.apiBaseUrl}/beneficient/${id}/tax`, dto)
            .pipe(catchError((error) => {
                this.snackbar.open(apiErrorMessage(error, 'Error al actualizar datos fiscales'), 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            }));
    }

    patchPrivacy(id: string | number, dto: UpdatePrivacyDto): Observable<any> {
        return this.http
            .patch(`${environment.apiBaseUrl}/beneficient/${id}/privacy`, dto)
            .pipe(catchError((error) => {
                this.snackbar.open(apiErrorMessage(error, 'Error al actualizar privacidad'), 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            }));
    }
}
