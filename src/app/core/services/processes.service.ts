import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from 'environments/environment.development';
import { PeriodStatusEnum } from '@app/shared/enums/period-status.enum';

export interface ProcessRequest {
    month: string;
    year?: string;
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
        return this.http.post<PeriodStatusResponse>(`${this.apiUrl}/processes/generate-receipts`, request);
    }

    collectionPeriodReportPdf(): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/collection-period/report/pdf`, { responseType: 'blob' }).pipe(
            catchError((error) => {
                this.snackbar.open('Error al generar el reporte del periodo', 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }

    settlementLettersPdf(periodId: string): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/collection-period/${periodId}/settlement-letters/pdf`, { responseType: 'blob' }).pipe(
            catchError((error) => {
                this.snackbar.open('Error al generar las cartas de liquidación', 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }
}
