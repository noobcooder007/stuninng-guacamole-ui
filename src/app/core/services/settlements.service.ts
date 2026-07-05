import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, map, Observable, throwError } from 'rxjs';
import { environment } from 'environments/environment.development';
import { apiErrorMessage } from '@app/shared/utils/api-error';

export type SettlementStatus = 'PENDING' | 'PARTIALLY_PAID' | 'PAID';
export type PaymentMethod = 'CASH' | 'TRANSFER';

export interface Settlement {
    id: string;
    collectionPeriodId: string;
    collectorId: string;
    month: number;
    year: number;
    totalCollected: number;
    commissionPercent: number;
    commissionAmount: number;
    nomina: number;
    transportAllowance: number;
    netCommission: number;
    paymentStatus: SettlementStatus;
    totalPaid: number;
    remainingBalance: number;
    createdAt: string;
}

export interface SettlementPayment {
    id: string;
    settlementId: string;
    collectorId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    reference: string | null;
    notes: string | null;
    paidAt: string;
    registeredBy: string;
    createdAt: string;
}

export interface RegisterPaymentDto {
    amount: number;
    paymentMethod: PaymentMethod;
    paidAt: string;
    reference?: string;
    notes?: string;
}

export interface BulkPaymentDto {
    paymentMethod: PaymentMethod;
    paidAt: string;
    reference?: string;
    notes?: string;
}

@Injectable({ providedIn: 'root' })
export class SettlementsService {
    private readonly http = inject(HttpClient);
    private readonly snackbar = inject(MatSnackBar);
    private readonly apiUrl = environment.apiBaseUrl;

    getSettlements(periodId: string): Observable<Settlement[]> {
        return this.http.get<{ data: Settlement[] }>(`${this.apiUrl}/periods/${periodId}/settlements`).pipe(
            map(r => r?.data ?? []),
            catchError((error) => {
                this.snackbar.open(apiErrorMessage(error, 'Error al obtener las liquidaciones'), 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }

    registerPayment(settlementId: string, dto: RegisterPaymentDto): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/periods/settlements/${settlementId}/payments`, dto).pipe(
            catchError((error) => {
                this.snackbar.open(apiErrorMessage(error, 'Error al registrar el pago'), 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }

    bulkPayment(periodId: string, dto: BulkPaymentDto): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/periods/${periodId}/payments/bulk`, dto).pipe(
            catchError((error) => {
                this.snackbar.open(apiErrorMessage(error, 'Error al registrar el pago masivo'), 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }

    getPaymentHistory(settlementId: string): Observable<SettlementPayment[]> {
        return this.http.get<{ data: SettlementPayment[] }>(`${this.apiUrl}/periods/settlements/${settlementId}/payments`).pipe(
            map(r => r?.data ?? []),
            catchError((error) => {
                this.snackbar.open(apiErrorMessage(error, 'Error al obtener el historial de pagos'), 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }
}
