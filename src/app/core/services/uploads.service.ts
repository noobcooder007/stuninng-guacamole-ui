import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UploadResponse {
  success: boolean;
  message: string;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class UploadsService {
  private apiUrl = '/api/uploads';

  constructor(private http: HttpClient) {}

  uploadDepositFile(file: File): Observable<HttpEvent<UploadResponse>> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<UploadResponse>(`${this.apiUrl}/deposits`, formData, {
      reportProgress: true,
      observe: 'events'
    });
  }

  uploadInformationFile(file: File): Observable<HttpEvent<UploadResponse>> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<UploadResponse>(`${this.apiUrl}/information`, formData, {
      reportProgress: true,
      observe: 'events'
    });
  }
}
