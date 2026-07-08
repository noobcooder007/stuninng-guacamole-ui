import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, map, Observable, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from 'environments/environment.development';
import { PeriodStatusEnum } from '@app/shared/enums/period-status.enum';
import { apiErrorMessage } from '@app/shared/utils/api-error';

export interface ProcessRequest {
    month: string;
    year?: string;
}

export interface GrowthReportPeriod {
    month: number;
    year: number;
    totalReceipts: number;
    newPromiseAmount: number;
}

export interface GrowthReportVariation {
    amount: number;
    percentage: number;
}

export interface GrowthReport {
    currentPeriod: GrowthReportPeriod;
    previousPeriod: GrowthReportPeriod;
    receiptsVariation: GrowthReportVariation;
    promiseAmountVariation: GrowthReportVariation;
}

export interface PeriodStatusResponse {
    statusCode: number;
    data: PeriodStatus;
    timestamp: string;
}

export interface PeriodStatus {
    id: string;
    month: number;
    year: number;
    status: PeriodStatusEnum;
    createdAt: string;
    createdBy: string;
    pendingReceiptsCount: number;
}

@Injectable({ providedIn: 'root' })
export class ProcessesService {
    private readonly http = inject(HttpClient);
    private readonly snackbar = inject(MatSnackBar);
    private readonly apiUrl = environment.apiBaseUrl;

    getPeriodStatus(): Observable<PeriodStatusResponse> {
        return this.http.get<PeriodStatusResponse>(`${this.apiUrl}/periods/current`);
    }

    openPeriod(): Observable<PeriodStatusResponse> {
        return this.http.post<PeriodStatusResponse>(`${this.apiUrl}/periods/open`, {});
    }

    closePeriod(): Observable<PeriodStatusResponse> {
        return this.http.post<PeriodStatusResponse>(`${this.apiUrl}/periods/close`, {});
    }

    startCommissionProcess(request: ProcessRequest): Observable<PeriodStatusResponse> {
        return this.http.post<PeriodStatusResponse>(`${this.apiUrl}/processes/commission`, request);
    }

    startReceiptsGenerationProcess(request: ProcessRequest): Observable<PeriodStatusResponse> {
        return this.http.post<PeriodStatusResponse>(`${this.apiUrl}/receipts/generate/recurring`, request);
    }

    collectionPeriodReportPdf(month: number, year: number): Observable<Blob> {
        const params = new HttpParams().set('month', month).set('year', year);
        return this.http.get(`${this.apiUrl}/periods/report/pdf`, { params, responseType: 'blob' }).pipe(
            catchError((error) => {
                this.snackbar.open(apiErrorMessage(error, 'Error al generar el reporte del periodo'), 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }

    settlementLettersPdf(periodId: string): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/periods/${periodId}/settlement-letters/pdf`, { responseType: 'blob' }).pipe(
            catchError((error) => {
                this.snackbar.open(apiErrorMessage(error, 'Error al generar las cartas de liquidación'), 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }

    getGrowthReport(month: number, year: number): Observable<GrowthReport> {
        const params = new HttpParams().set('month', month).set('year', year);
        return this.http.get<{ data: GrowthReport }>(`${this.apiUrl}/periods/growth-report`, { params }).pipe(
            map(r => r.data),
            catchError((error) => {
                this.snackbar.open(apiErrorMessage(error, 'Error al generar el reporte de crecimiento'), 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }
}
