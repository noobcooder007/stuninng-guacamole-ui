import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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
}
