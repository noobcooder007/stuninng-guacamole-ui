import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ReportFilter {
  month?: string | null;
  year?: string | null;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  [key: string]: any;
}

export interface ReportResponse {
  success: boolean;
  data?: Blob;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private apiUrl = '/api/reports';

  constructor(private http: HttpClient) {}

  // General Reports
  quantityDifferenceReport(filters: ReportFilter): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/general/quantity-difference`, filters, {
      responseType: 'blob'
    });
  }

  monthlyReportPdf(filters: ReportFilter): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/general/monthly-report`, filters, {
      responseType: 'blob'
    });
  }

  monthlyReportExcel(filters: ReportFilter): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/general/monthly-report/excel`, filters, {
      responseType: 'blob'
    });
  }

  efficiencyReport(filters: ReportFilter): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/general/efficiency`, filters, {
      responseType: 'blob'
    });
  }

  concentratedEfficiencyReport(filters: ReportFilter): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/general/efficiency-concentrated`, filters, {
      responseType: 'blob'
    });
  }

  decreasedDonationReport(filters: ReportFilter): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/general/decreased-donations`, filters, {
      responseType: 'blob'
    });
  }

  increasedDonationReport(filters: ReportFilter): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/general/increased-donations`, filters, {
      responseType: 'blob'
    });
  }

  donationReport(filters: ReportFilter): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/general/donations`, filters, {
      responseType: 'blob'
    });
  }

  issuedReceiptsReport(filters: ReportFilter): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/general/issued-receipts`, filters, {
      responseType: 'blob'
    });
  }

  // Beneficiary Reports
  beneficiaryMovementsReport(filters: ReportFilter): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/beneficiary/movements`, filters, {
      responseType: 'blob'
    });
  }

  beneficiaryConcentratedReport(filters: ReportFilter): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/beneficiary/concentrated`, filters, {
      responseType: 'blob'
    });
  }

  beneficiaryStatusReport(filters: ReportFilter): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/beneficiary/status`, filters, {
      responseType: 'blob'
    });
  }

  beneficiaryExcelReport(filters: ReportFilter): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/beneficiary/excel`, filters, {
      responseType: 'blob'
    });
  }

  beneficiaryReport(filters: ReportFilter): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/beneficiary/general`, filters, {
      responseType: 'blob'
    });
  }

  // Collector Reports
  collectorDepositsReport(filters: ReportFilter): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/collector/deposits`, filters, {
      responseType: 'blob'
    });
  }

  collectorLiquidationReportPdf(filters: ReportFilter): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/collector/liquidation`, filters, {
      responseType: 'blob'
    });
  }

  collectorLiquidationReportExcel(filters: ReportFilter): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/collector/liquidation/excel`, filters, {
      responseType: 'blob'
    });
  }
}
