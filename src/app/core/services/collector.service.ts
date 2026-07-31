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

export interface PaymentData {
    commissionPercent: number;
    nomina?: number;
    transportAllowance?: number;
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

export interface CollectorListItem {
    id: string;
    firstname: string;
    firstLastname: string;
    secondLastname?: string | null;
    collectorNumber: number;
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

export interface UpdateCollectorPersonalDto {
    firstname?: string;
    firstLastname?: string;
    secondLastname?: string | null;
}

export interface UpdateCollectorAddressDto {
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

export interface UpdateCollectorContactDto {
    phoneNumber?: string;
    telephoneNumber?: string | null;
}

export interface UpdateCollectorPaymentDto {
    commissionPercent?: number;
    nomina?: number;
    transportAllowance?: number;
    bank?: string;
    reference?: string;
}

export interface UpdateCollectorNotesDto {
    notes: string;
}

export interface CollectorEfficiencyRow {
    collectorId: string;
    collectorNumber: number;
    collectorName: string;
    assignedAmount: number;
    assignedCount: number;
    collectedAmount: number;
    collectedCount: number;
    pendingAmount: number;
    pendingCount: number;
    collectionRate: number;
}

export interface CollectorEfficiencyTotals {
    assignedAmount: number;
    assignedCount: number;
    collectedAmount: number;
    collectedCount: number;
    pendingAmount: number;
    pendingCount: number;
    collectionRate: number;
}

export interface CollectorEfficiencyByPeriod {
    periodId: string;
    month: number;
    year: number;
    periodStatus: string;
    collectors: CollectorEfficiencyRow[];
    totals: CollectorEfficiencyTotals;
}

export interface CollectorEfficiencyByYear {
    year: number;
    collectors: CollectorEfficiencyRow[];
    totals: CollectorEfficiencyTotals;
}

export interface CollectorEfficiencyHistorical {
    collectors: CollectorEfficiencyRow[];
    totals: CollectorEfficiencyTotals;
}

export interface CollectorsEfficiencyReport {
    byPeriod: CollectorEfficiencyByPeriod[];
    byYear: CollectorEfficiencyByYear[];
    historical: CollectorEfficiencyHistorical;
}

@Injectable({ providedIn: 'root' })
export class CollectorService {
    private readonly http = inject(HttpClient);
    private readonly _snackbar = inject(MatSnackBar);
    private readonly apiUrl = environment.apiBaseUrl;

    getCollectors(page: number = 1, limit: number = 5, filters: CollectorFilters = {}): Observable<PaginatedResponse> {
        let params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());
        Object.entries(filters ?? {}).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                params = params.set(key, value as string);
            }
        });

        return this.http.get<PaginatedResponse>(`${this.apiUrl}/collector`, { params }).pipe(
            catchError((error) => {
                this._snackbar.open(apiErrorMessage(error, 'Error al obtener colectores'), 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }

    getCollector(id: string): Observable<{ statusCode: number; data: Collector }> {
        return this.http.get<{ statusCode: number; data: Collector }>(`${this.apiUrl}/collector/${id}`).pipe(
            catchError((error) => {
                this._snackbar.open(apiErrorMessage(error, 'Error al obtener datos del colector'), 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }

    efficiencyPdf(id: string): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/receipts/collectors/${id}/efficiency/pdf`, { responseType: 'blob' }).pipe(
            catchError((error) => {
                this._snackbar.open(apiErrorMessage(error, 'Error al generar el reporte de eficiencia'), 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }

    getActiveList(search?: string): Observable<CollectorListItem[]> {
        let params = new HttpParams();
        if (search?.trim()) params = params.set('search', search.trim());
        return this.http.get<{ data: CollectorListItem[] }>(`${this.apiUrl}/collector/active-list`, { params }).pipe(
            map(r => r?.data ?? []),
            catchError((error) => {
                this._snackbar.open(apiErrorMessage(error, 'Error al buscar colectores'), 'Cerrar', { duration: 5000 });
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
        formData.append('address[numeration][noExt]', collector.address.numeration!.noExt);
        collector.address.numeration!.noInt && formData.append('address[numeration][noInt]', collector.address.numeration!.noInt);
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
                this._snackbar.open(apiErrorMessage(error, 'Error al crear colector'), 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }

    patchPersonal(id: string, dto: UpdateCollectorPersonalDto): Observable<any> {
        return this.http.patch(`${this.apiUrl}/collector/${id}/personal`, dto).pipe(
            catchError((error) => {
                this._snackbar.open(apiErrorMessage(error, 'Error al actualizar información personal'), 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }

    patchAddress(id: string, dto: UpdateCollectorAddressDto): Observable<any> {
        return this.http.patch(`${this.apiUrl}/collector/${id}/address`, dto).pipe(
            catchError((error) => {
                this._snackbar.open(apiErrorMessage(error, 'Error al actualizar domicilio'), 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }

    patchContact(id: string, dto: UpdateCollectorContactDto): Observable<any> {
        return this.http.patch(`${this.apiUrl}/collector/${id}/contact`, dto).pipe(
            catchError((error) => {
                this._snackbar.open(apiErrorMessage(error, 'Error al actualizar contacto'), 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }

    patchPayment(id: string, dto: UpdateCollectorPaymentDto): Observable<any> {
        return this.http.patch(`${this.apiUrl}/collector/${id}/payment`, dto).pipe(
            catchError((error) => {
                this._snackbar.open(apiErrorMessage(error, 'Error al actualizar datos de pago'), 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }

    patchNotes(id: string, dto: UpdateCollectorNotesDto): Observable<any> {
        return this.http.patch(`${this.apiUrl}/collector/${id}/notes`, dto).pipe(
            catchError((error) => {
                this._snackbar.open(apiErrorMessage(error, 'Error al actualizar notas'), 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }

    getEfficiencyReport(): Observable<CollectorsEfficiencyReport> {
        return this.http.get<{ data: CollectorsEfficiencyReport }>(`${this.apiUrl}/receipts/collectors/efficiency`).pipe(
            map(r => r.data),
            catchError((error) => {
                this._snackbar.open(apiErrorMessage(error, 'Error al obtener el reporte de eficiencia'), 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }
}
