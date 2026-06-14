import { Component, OnInit, inject } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ReportsService } from '@app/core/services/reports.service';

@Component({
  selector: 'app-reports-general',
  standalone: true,
  templateUrl: './reports-general.component.html',
  styleUrl: './reports-general.component.scss',
  imports: [
    MatTabsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatCardModule,
    MatDatepickerModule,
    MatNativeDateModule,
    ReactiveFormsModule,
  ],
})
export class ReportsGeneralComponent implements OnInit {
  private reportsService = inject(ReportsService);

  public activeTab: number = 0;
  public isLoading = false;

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

  public frequencies = [
    { value: 'todas', label: 'Todas' },
    { value: 'todas-sin-especiales', label: 'Todas sin especiales' },
    { value: 'especiales', label: 'Especiales' },
    { value: 'mensual', label: 'Mensual' },
    { value: 'bimestral', label: 'Bimestral' },
    { value: 'trimestral', label: 'Trimestral' },
    { value: 'cuatrimestral', label: 'Cuatrimestral' },
    { value: 'semestral', label: 'Semestral' },
    { value: 'anual', label: 'Anual' },
  ];

  public efficiencyTypes = [
    { value: 'dinero', label: 'Dinero' },
  ];

  public receiptTypes = [
    { value: 'normales', label: 'Normales' },
  ];

  public currentYear = new Date().getFullYear();
  public years: number[] = [];

  // Forms para cada reporte
  public quantityDifferenceForm = new FormGroup({
    month: new FormControl(''),
    year: new FormControl(''),
  });

  public monthlyReportForm = new FormGroup({
    month: new FormControl(''),
    year: new FormControl(''),
  });

  public efficiencyForm = new FormGroup({
    month: new FormControl(''),
    year: new FormControl(''),
    initialDonation: new FormControl(''),
    finalDonation: new FormControl(''),
    collectorNum: new FormControl(''),
    frequency: new FormControl(''),
  });

  public concentratedEfficiencyForm = new FormGroup({
    startDate: new FormControl<Date | null>(null),
    endDate: new FormControl<Date | null>(null),
    initialPercentage: new FormControl(''),
    finalPercentage: new FormControl(''),
    efficiencyType: new FormControl(''),
    collectorNum: new FormControl(''),
  });

  public dateRangeForm = new FormGroup({
    startDate: new FormControl<Date | null>(null),
    endDate: new FormControl<Date | null>(null),
  });

  public issuedReceiptsForm = new FormGroup({
    month: new FormControl(''),
    year: new FormControl(''),
    frequency: new FormControl(''),
    receiptType: new FormControl(''),
  });

  ngOnInit(): void {
    this.generateYears();
    this.setCurrentValues();
  }

  private generateYears(): void {
    for (let i = this.currentYear - 5; i <= this.currentYear + 5; i++) {
      this.years.push(i);
    }
  }

  private setCurrentValues(): void {
    const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
    this.quantityDifferenceForm.patchValue({ month: currentMonth, year: this.currentYear.toString() });
    this.monthlyReportForm.patchValue({ month: currentMonth, year: this.currentYear.toString() });
    this.efficiencyForm.patchValue({ month: currentMonth, year: this.currentYear.toString() });
    this.issuedReceiptsForm.patchValue({ month: currentMonth, year: this.currentYear.toString() });
  }

  // Reporte: Diferencia de Cantidades
  generateQuantityDifferenceReport(): void {
    if (this.quantityDifferenceForm.invalid) return;
    this.isLoading = true;
    const filters = this.quantityDifferenceForm.value as any;
    this.reportsService.quantityDifferenceReport(filters).subscribe({
      next: (blob) => {
        this.downloadPdf(blob, 'Reporte_Diferencia_Cantidades.pdf');
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error generando reporte:', error);
        this.isLoading = false;
      },
    });
  }

  // Reporte: Informe Mensual
  generateMonthlyReportPdf(): void {
    if (this.monthlyReportForm.invalid) return;
    this.isLoading = true;
    const filters = this.monthlyReportForm.value as any;
    this.reportsService.monthlyReportPdf(filters).subscribe({
      next: (blob) => {
        this.downloadPdf(blob, 'Reporte_Informe_Mensual.pdf');
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error generando reporte:', error);
        this.isLoading = false;
      },
    });
  }

  generateMonthlyReportExcel(): void {
    if (this.monthlyReportForm.invalid) return;
    this.isLoading = true;
    const filters = this.monthlyReportForm.value as any;
    this.reportsService.monthlyReportExcel(filters).subscribe({
      next: (blob) => {
        this.downloadExcel(blob, 'Reporte_Informe_Mensual.xlsx');
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error generando reporte:', error);
        this.isLoading = false;
      },
    });
  }

  // Reporte: Eficiencia
  generateEfficiencyReport(): void {
    if (this.efficiencyForm.invalid) return;
    this.isLoading = true;
    const filters = this.efficiencyForm.value as any;
    this.reportsService.efficiencyReport(filters).subscribe({
      next: (blob) => {
        this.downloadPdf(blob, 'Reporte_Eficiencia.pdf');
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error generando reporte:', error);
        this.isLoading = false;
      },
    });
  }

  // Reporte: Eficiencia Concentrada
  generateConcentratedEfficiencyReport(): void {
    if (this.concentratedEfficiencyForm.invalid) return;
    this.isLoading = true;
    const filters = this.concentratedEfficiencyForm.value as any;
    this.reportsService.concentratedEfficiencyReport(filters).subscribe({
      next: (blob) => {
        this.downloadPdf(blob, 'Reporte_Eficiencia_Concentrada.pdf');
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error generando reporte:', error);
        this.isLoading = false;
      },
    });
  }

  // Reporte: Disminución de Donativos
  generateDecreasedDonationReport(): void {
    if (this.dateRangeForm.invalid) return;
    this.isLoading = true;
    const filters = this.dateRangeForm.value as any;
    this.reportsService.decreasedDonationReport(filters).subscribe({
      next: (blob) => {
        this.downloadPdf(blob, 'Reporte_Disminucion_Donativos.pdf');
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error generando reporte:', error);
        this.isLoading = false;
      },
    });
  }

  // Reporte: Aumento de Donativos
  generateIncreasedDonationReport(): void {
    if (this.dateRangeForm.invalid) return;
    this.isLoading = true;
    const filters = this.dateRangeForm.value as any;
    this.reportsService.increasedDonationReport(filters).subscribe({
      next: (blob) => {
        this.downloadPdf(blob, 'Reporte_Aumento_Donativos.pdf');
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error generando reporte:', error);
        this.isLoading = false;
      },
    });
  }

  // Reporte: Donativos
  generateDonationReport(): void {
    if (this.dateRangeForm.invalid) return;
    this.isLoading = true;
    const filters = this.dateRangeForm.value as any;
    this.reportsService.donationReport(filters).subscribe({
      next: (blob) => {
        this.downloadPdf(blob, 'Reporte_Donativos.pdf');
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error generando reporte:', error);
        this.isLoading = false;
      },
    });
  }

  // Reporte: Recibos Emitidos
  generateIssuedReceiptsReport(): void {
    if (this.issuedReceiptsForm.invalid) return;
    this.isLoading = true;
    const filters = this.issuedReceiptsForm.value as any;
    this.reportsService.issuedReceiptsReport(filters).subscribe({
      next: (blob) => {
        this.downloadPdf(blob, 'Reporte_Recibos_Emitidos.pdf');
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
