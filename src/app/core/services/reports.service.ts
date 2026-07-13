import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from 'environments/environment.development';
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

@Injectable({ providedIn: 'root' })
export class ReportsService {
    private readonly http = inject(HttpClient);
    private readonly snackbar = inject(MatSnackBar);
    private readonly apiUrl = environment.apiBaseUrl;

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
