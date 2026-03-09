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
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ReportsService } from '@app/core/services/reports.service';

@Component({
  selector: 'app-reports-collector',
  standalone: true,
  templateUrl: './reports-collector.component.html',
  styleUrl: './reports-collector.component.scss',
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
    ReactiveFormsModule,
  ],
})
export class ReportsCollectorComponent implements OnInit {
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

  // Forms
  public depositsForm = new FormGroup({
    startDate: new FormControl(''),
    endDate: new FormControl(''),
    collectorNum: new FormControl(''),
  });

  public liquidationForm = new FormGroup({
    month: new FormControl(''),
    year: new FormControl<number | string>(''),
    collectorNum: new FormControl(''),
  });

  ngOnInit(): void {
    this.generateYears();
    const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
    this.liquidationForm.patchValue({ month: currentMonth, year: this.currentYear.toString() });
  }

  private generateYears(): void {
    for (let i = this.currentYear - 5; i <= this.currentYear + 5; i++) {
      this.years.push(i);
    }
  }

  downloadDepositsReport(): void {
    if (this.depositsForm.invalid) return;
    this.isLoading = true;
    const filters = this.depositsForm.value as any;
    this.reportsService.collectorDepositsReport(filters).subscribe({
      next: (blob) => {
        this.downloadPdf(blob, 'Reporte_Depositos_Colector.pdf');
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error generando reporte:', error);
        this.isLoading = false;
      },
    });
  }

  downloadLiquidationReportPdf(): void {
    if (this.liquidationForm.invalid) return;
    this.isLoading = true;
    const filters = this.liquidationForm.value as any;
    this.reportsService.collectorLiquidationReportPdf(filters).subscribe({
      next: (blob) => {
        this.downloadPdf(blob, 'Reporte_Liquidacion_Colector.pdf');
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error generando reporte:', error);
        this.isLoading = false;
      },
    });
  }

  downloadLiquidationReportExcel(): void {
    if (this.liquidationForm.invalid) return;
    this.isLoading = true;
    const filters = this.liquidationForm.value as any;
    this.reportsService.collectorLiquidationReportExcel(filters).subscribe({
      next: (blob) => {
        this.downloadExcel(blob, 'Reporte_Liquidacion_Colector.xlsx');
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
