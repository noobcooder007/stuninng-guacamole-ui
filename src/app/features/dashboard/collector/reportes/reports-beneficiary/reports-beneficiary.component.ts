import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ReportsService } from '@app/core/services/reports.service';

@Component({
  selector: 'app-reports-beneficiary',
  standalone: true,
  templateUrl: './reports-beneficiary.component.html',
  styleUrl: './reports-beneficiary.component.scss',
  imports: [
    CommonModule,
    MatTabsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    ReactiveFormsModule,
  ],
})
export class ReportsBeneficiaryComponent implements OnInit {
  private reportsService = inject(ReportsService);

  public activeTab: number = 0;
  public isLoading = false;
  public currentYear = new Date().getFullYear();
  public years: number[] = [];

  public months = [
    { value: '01', label: 'Enero' },
    { value: '02', label: 'Febrero' },
    { value: '03', label: 'Marzo' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Mayo' },
    { value: '06', label: 'Junio' },
    { value: '07', label: 'Julio' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' },
  ];

  public statuses = [
    { value: 'alta', label: 'Alta' },
  ];

  public causes = [
    { value: 'todas', label: 'Todas' },
  ];

  // Forms
  public beneficiaryStatusForm = new FormGroup({
    startDate: new FormControl(''),
    endDate: new FormControl(''),
    status: new FormControl(''),
    cause: new FormControl(''),
  });

  public beneficiaryExcelForm = new FormGroup({
    collectorNum: new FormControl(''),
    month: new FormControl(''),
    colony: new FormControl(''),
    delegation: new FormControl(''),
    postalCode: new FormControl(''),
    registryNum: new FormControl(''),
    isActive: new FormControl(true),
  });

  public beneficiaryGeneralForm = new FormGroup({
    initialDonation: new FormControl(''),
    finalDonation: new FormControl(''),
    collectorNum: new FormControl(''),
    frequency: new FormControl(''),
    delegation: new FormControl(''),
    postalCode: new FormControl(''),
  });

  ngOnInit(): void {
    this.generateYears();
    const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
    this.beneficiaryExcelForm.patchValue({ month: currentMonth });
  }

  private generateYears(): void {
    for (let i = this.currentYear - 5; i <= this.currentYear + 5; i++) {
      this.years.push(i);
    }
  }

  downloadBeneficiaryMovementsReport(): void {
    this.isLoading = true;
    this.reportsService.beneficiaryMovementsReport({}).subscribe({
      next: (blob) => {
        this.downloadPdf(blob, 'Reporte_Movimientos_Bienhechores.pdf');
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error generando reporte:', error);
        this.isLoading = false;
      },
    });
  }

  downloadBeneficiaryConcentratedReport(): void {
    this.isLoading = true;
    this.reportsService.beneficiaryConcentratedReport({}).subscribe({
      next: (blob) => {
        this.downloadPdf(blob, 'Reporte_Concentrado_Donativos_Bienhechores.pdf');
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error generando reporte:', error);
        this.isLoading = false;
      },
    });
  }

  downloadBeneficiaryStatusReport(): void {
    if (this.beneficiaryStatusForm.invalid) return;
    this.isLoading = true;
    const filters = this.beneficiaryStatusForm.value as any;
    this.reportsService.beneficiaryStatusReport(filters).subscribe({
      next: (blob) => {
        this.downloadPdf(blob, 'Reporte_Bienhechores_Status.pdf');
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error generando reporte:', error);
        this.isLoading = false;
      },
    });
  }

  downloadBeneficiaryExcelReport(): void {
    if (this.beneficiaryExcelForm.invalid) return;
    this.isLoading = true;
    const filters = this.beneficiaryExcelForm.value as any;
    this.reportsService.beneficiaryExcelReport(filters).subscribe({
      next: (blob) => {
        this.downloadExcel(blob, 'Reporte_Bienhechores.xlsx');
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error generando reporte:', error);
        this.isLoading = false;
      },
    });
  }

  downloadBeneficiaryReport(): void {
    if (this.beneficiaryGeneralForm.invalid) return;
    this.isLoading = true;
    const filters = this.beneficiaryGeneralForm.value as any;
    this.reportsService.beneficiaryReport(filters).subscribe({
      next: (blob) => {
        this.downloadPdf(blob, 'Reporte_Bienhechores.pdf');
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error generando reporte:', error);
        this.isLoading = false;
      },
    });
  }

  private downloadPdf(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  private downloadExcel(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
