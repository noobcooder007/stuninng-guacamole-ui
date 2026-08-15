import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, map, Observable, throwError } from 'rxjs';
import { environment } from 'environments/environment';
import { apiErrorMessage } from '@app/shared/utils/api-error';

export interface QuantityDifferenceFilter {
    month: number;
    year: number;
}

export interface EfficiencyFilter {
    month: number;
    year: number;
    initialDonation: number;
    finalDonation: number;
    frequency: number;
    collectorNum?: number;
}

export type EfficiencyConcentratedType = 'PERIOD' | 'YEAR' | 'HISTORICAL';

export interface ConcentratedEfficiencyFilter {
    startDate: string;
    endDate: string;
    initialPercentage: number;
    finalPercentage: number;
    efficiencyType: EfficiencyConcentratedType;
    collectorNum?: number;
}

export interface BeneficientsByCollectorFilter {
    fromMonth: number;
    fromYear: number;
    toMonth: number;
    toYear: number;
    includeSpecial: boolean;
    collectorNumber?: number;
}

export interface BeneficientReceiptLine {
    folio: string;
    type: 'RECURRING' | 'SPECIAL';
    amount: number;
    currency: string;
    paidAt: string | null;
    isDelayed: boolean | null;
    paidPeriodMonth: number | null;
    paidPeriodYear: number | null;
}

export interface BeneficientPeriodDonation {
    periodMonth: number;
    periodYear: number;
    receipts: BeneficientReceiptLine[];
}

export interface BeneficientReportItem {
    beneficientNumber: number;
    beneficientName: string;
    periods: BeneficientPeriodDonation[];
    totalDonatedMxn: number;
    totalDonatedUsd: number;
}

export interface CollectorBeneficientsReportItem {
    collectorNumber: number;
    collectorName: string;
    beneficients: BeneficientReportItem[];
}

export interface BeneficientsByCollectorReport {
    fromMonth: number;
    fromYear: number;
    toMonth: number;
    toYear: number;
    includeSpecial: boolean;
    collectors: CollectorBeneficientsReportItem[];
}

@Injectable({ providedIn: 'root' })
export class ReportsService {
    private readonly http = inject(HttpClient);
    private readonly snackbar = inject(MatSnackBar);
    private readonly apiUrl = environment.apiBaseUrl;

    private buildBeneficientsByCollectorParams(filters: BeneficientsByCollectorFilter): HttpParams {
        let params = new HttpParams()
            .set('fromMonth', filters.fromMonth)
            .set('fromYear', filters.fromYear)
            .set('toMonth', filters.toMonth)
            .set('toYear', filters.toYear)
            .set('includeSpecial', String(filters.includeSpecial));
        if (filters.collectorNumber) params = params.set('collectorNumber', filters.collectorNumber);
        return params;
    }

    beneficientsByCollectorReport(filters: BeneficientsByCollectorFilter): Observable<BeneficientsByCollectorReport> {
        const params = this.buildBeneficientsByCollectorParams(filters);
        return this.http.get<{ data: BeneficientsByCollectorReport }>(`${this.apiUrl}/reports/beneficients-by-collector`, { params }).pipe(
            map(r => r.data),
            catchError((error) => {
                this.snackbar.open(apiErrorMessage(error, 'Error al generar el reporte de bienhechores por colector'), 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }

    beneficientsByCollectorReportPdf(filters: BeneficientsByCollectorFilter): Observable<Blob> {
        const params = this.buildBeneficientsByCollectorParams(filters);
        return this.http.get(`${this.apiUrl}/reports/beneficients-by-collector/pdf`, { params, responseType: 'blob' }).pipe(
            catchError((error) => {
                this.snackbar.open(apiErrorMessage(error, 'Error al generar el PDF de bienhechores por colector'), 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }

    quantityDifferenceReport(filters: QuantityDifferenceFilter): Observable<Blob> {
        return this.http.post(`${this.apiUrl}/reports/general/quantity-difference`, filters, { responseType: 'blob' }).pipe(
            catchError((error) => {
                this.snackbar.open(apiErrorMessage(error, 'Error al generar el reporte de diferencia de cantidades'), 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }

    efficiencyReport(filters: EfficiencyFilter): Observable<Blob> {
        return this.http.post(`${this.apiUrl}/reports/general/efficiency`, filters, { responseType: 'blob' }).pipe(
            catchError((error) => {
                this.snackbar.open(apiErrorMessage(error, 'Error al generar el reporte de eficiencia'), 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }

    concentratedEfficiencyReport(filters: ConcentratedEfficiencyFilter): Observable<Blob> {
        return this.http.post(`${this.apiUrl}/reports/general/efficiency-concentrated`, filters, { responseType: 'blob' }).pipe(
            catchError((error) => {
                this.snackbar.open(apiErrorMessage(error, 'Error al generar el reporte de eficiencia concentrada'), 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }
}
