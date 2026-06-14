import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from 'environments/environment.development';
import { PaginatedMetadata } from './collector.service';

export type ReceiptType = 'RECURRING' | 'SPECIAL';

export interface Recibo {
    id: string;
    folio: string;
    type: ReceiptType;
    origin: string;
    status: string;
    amount: string;
    currency: string;
    paymentMethod: string | null;
    externalReference: string | null;
    promiseDonationId: string | null;
    periodMonth: number;
    periodYear: number;
    beneficientId: string;
    collectorId: string;
    printCount: number;
    lastPrintedAt: string | null;
    voidReason: string | null;
    createdAt: string;
    updatedAt: string;
    paidAt: string | null;
}

export interface ReciboFilters {
    month?: string;
    year?: string;
    folio?: string;
    status?: string;
    type?: ReceiptType;
}

export interface ValidateReciboData {
    valid: boolean;
    folio: string;
    status: string;
    amount: string;
    currency: string;
    type?: ReceiptType;
}

export interface ValidateReciboResponse {
    statusCode: number;
    data: ValidateReciboData;
    timestamp: string;
}

export interface MarkAsPaidReceiptDto {
    folio: string;
    paymentMethod: string;
}

export interface MarkAsPaidDto {
    receipts: MarkAsPaidReceiptDto[];
}

export interface RecibosPaginatedResponse {
    statusCode: number;
    data: {
        items: Recibo[];
        meta: PaginatedMetadata;
    };
    timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class RecibosService {
    private readonly http = inject(HttpClient);
    private readonly snackbar = inject(MatSnackBar);

    getRecibos(page: number = 1, limit: number = 10, filters: ReciboFilters = {}): Observable<RecibosPaginatedResponse> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString());

        Object.entries(filters).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                params = params.set(key, value);
            }
        });

        return this.http.get<RecibosPaginatedResponse>(`${environment.apiBaseUrl}/receipts`, { params }).pipe(
            catchError((error) => {
                this.snackbar.open('Error al obtener los recibos', 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }

    validarFolio(folio: string): Observable<ValidateReciboResponse> {
        return this.http.get<ValidateReciboResponse>(
            `${environment.apiBaseUrl}/receipts/validate/${folio}`
        ).pipe(
            catchError(error => throwError(() => error))
        );
    }

    marcarComoPagados(dto: MarkAsPaidDto): Observable<void> {
        return this.http.post<void>(`${environment.apiBaseUrl}/receipts/mark-as-paid`, dto).pipe(
            catchError((error) => {
                this.snackbar.open('Error al marcar los recibos como pagados', 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }
}
