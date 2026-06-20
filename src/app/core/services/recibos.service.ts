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

export interface ImpresionReciboFilters {
    month?: string | null;
    year?: string | null;
    firstname?: string | null;
    firstLastname?: string | null;
    secondLastname?: string | null;
    collectorNumber?: string | null;
    fromSequence?: number | null;
    toSequence?: number | null;
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
    receiptFolio: string;
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

    imprimirRecibos(filters: ImpresionReciboFilters): Observable<Blob> {
        return this.http.get(`${environment.apiBaseUrl}/receipts/print`, {
            params: this.buildPrintParams(filters),
            responseType: 'blob',
        }).pipe(
            catchError((error) => {
                this.snackbar.open('Error al generar los recibos', 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }

    imprimirCartaActual(filters: ImpresionReciboFilters): Observable<Blob> {
        return this.http.get(`${environment.apiBaseUrl}/receipts/print/delivery-letter`, {
            params: this.buildPrintParams(filters),
            responseType: 'blob',
        }).pipe(
            catchError((error) => {
                this.snackbar.open('Error al generar la carta de recibos actual', 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }

    imprimirCartaAnterior(filters: ImpresionReciboFilters): Observable<Blob> {
        return this.http.get(`${environment.apiBaseUrl}/receipts/print/carta-anterior`, {
            params: this.buildPrintParams(filters),
            responseType: 'blob',
        }).pipe(
            catchError((error) => {
                this.snackbar.open('Error al generar la carta de recibos anterior', 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }

    private buildPrintParams(filters: ImpresionReciboFilters): HttpParams {
        let params = new HttpParams();
        const includeSequence = filters.fromSequence != null && filters.toSequence != null;

        Object.entries(filters).forEach(([key, value]) => {
            if (key === 'fromSequence' || key === 'toSequence') {
                if (includeSequence) params = params.set(key, String(value));
                return;
            }
            if (value !== null && value !== undefined && value !== '') {
                params = params.set(key, String(value));
            }
        });
        return params;
    }
}
