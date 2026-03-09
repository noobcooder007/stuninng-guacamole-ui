import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ProcessRequest {
  month: string;
  year?: string;
}

export interface ProcessResponse {
  success: boolean;
  message: string;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ProcessesService {
  private apiUrl = '/api/processes';

  constructor(private http: HttpClient) {}

  startCommissionProcess(request: ProcessRequest): Observable<ProcessResponse> {
    return this.http.post<ProcessResponse>(`${this.apiUrl}/commission`, request);
  }

  startReceiptsGenerationProcess(request: ProcessRequest): Observable<ProcessResponse> {
    return this.http.post<ProcessResponse>(`${this.apiUrl}/generate-receipts`, request);
  }
}
