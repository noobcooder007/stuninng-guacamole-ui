import { Component, OnInit, inject } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ReportsService } from '@app/core/services/reports.service';
import { HasPermissionPipe } from '@app/shared/pipes/has-permission.pipe';
import { Permissions } from '@app/shared/enums/app-permission.enum';

@Component({
  selector: 'app-reports-general',
  standalone: true,
  templateUrl: './reports-general.component.html',
  styleUrl: './reports-general.component.scss',
  imports: [
    MatListModule,
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
    HasPermissionPipe,
  ],
})
export class ReportsGeneralComponent implements OnInit {
  protected readonly Permissions = Permissions;
  private reportsService = inject(ReportsService);
  private snackBar = inject(MatSnackBar);

  public selectedReport = 'quantity-difference';
  public isLoading = false;

  public reports = [
    { id: 'quantity-difference',        label: 'Diferencia Cantidades' },
    { id: 'monthly-report',             label: 'Informe Mensual' },
    { id: 'efficiency',                 label: 'Eficiencia' },
    { id: 'concentrated-efficiency',    label: 'Eficiencia Concentrada' },
    { id: 'decreased-donations',        label: 'Disminución Donativos' },
    { id: 'increased-donations',        label: 'Aumento Donativos' },
    { id: 'donations',                  label: 'Donativos' },
    { id: 'issued-receipts',            label: 'Recibos Emitidos' },
  ];

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
    { value: 'todas',               label: 'Todas' },
    { value: 'todas-sin-especiales', label: 'Todas sin especiales' },
    { value: 'especiales',          label: 'Especiales' },
    { value: 'mensual',             label: 'Mensual' },
    { value: 'bimestral',           label: 'Bimestral' },
    { value: 'trimestral',          label: 'Trimestral' },
    { value: 'cuatrimestral',       label: 'Cuatrimestral' },
    { value: 'semestral',           label: 'Semestral' },
    { value: 'anual',               label: 'Anual' },
  ];

  public efficiencyTypes = [
    { value: 'dinero', label: 'Dinero' },
  ];

  public receiptTypes = [
    { value: 'normales', label: 'Normales' },
  ];

  public currentYear = new Date().getFullYear();
  public years: number[] = [];

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

  private downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  private handleError(): void {
    this.isLoading = false;
    this.snackBar.open('Error al generar el reporte', 'Cerrar', { duration: 4000 });
  }

  generateQuantityDifferenceReport(): void {
    if (this.quantityDifferenceForm.invalid) return;
    this.isLoading = true;
    this.reportsService.quantityDifferenceReport(this.quantityDifferenceForm.value).subscribe({
      next: (blob) => { this.downloadFile(blob, 'Reporte_Diferencia_Cantidades.pdf'); this.isLoading = false; },
      error: () => this.handleError(),
    });
  }

  generateMonthlyReportPdf(): void {
    if (this.monthlyReportForm.invalid) return;
    this.isLoading = true;
    this.reportsService.monthlyReportPdf(this.monthlyReportForm.value).subscribe({
      next: (blob) => { this.downloadFile(blob, 'Reporte_Informe_Mensual.pdf'); this.isLoading = false; },
      error: () => this.handleError(),
    });
  }

  generateMonthlyReportExcel(): void {
    if (this.monthlyReportForm.invalid) return;
    this.isLoading = true;
    this.reportsService.monthlyReportExcel(this.monthlyReportForm.value).subscribe({
      next: (blob) => { this.downloadFile(blob, 'Reporte_Informe_Mensual.xlsx'); this.isLoading = false; },
      error: () => this.handleError(),
    });
  }

  generateEfficiencyReport(): void {
    if (this.efficiencyForm.invalid) return;
    this.isLoading = true;
    this.reportsService.efficiencyReport(this.efficiencyForm.value).subscribe({
      next: (blob) => { this.downloadFile(blob, 'Reporte_Eficiencia.pdf'); this.isLoading = false; },
      error: () => this.handleError(),
    });
  }

  generateConcentratedEfficiencyReport(): void {
    if (this.concentratedEfficiencyForm.invalid) return;
    this.isLoading = true;
    this.reportsService.concentratedEfficiencyReport(this.concentratedEfficiencyForm.value).subscribe({
      next: (blob) => { this.downloadFile(blob, 'Reporte_Eficiencia_Concentrada.pdf'); this.isLoading = false; },
      error: () => this.handleError(),
    });
  }

  generateDecreasedDonationReport(): void {
    if (this.dateRangeForm.invalid) return;
    this.isLoading = true;
    this.reportsService.decreasedDonationReport(this.dateRangeForm.value).subscribe({
      next: (blob) => { this.downloadFile(blob, 'Reporte_Disminucion_Donativos.pdf'); this.isLoading = false; },
      error: () => this.handleError(),
    });
  }

  generateIncreasedDonationReport(): void {
    if (this.dateRangeForm.invalid) return;
    this.isLoading = true;
    this.reportsService.increasedDonationReport(this.dateRangeForm.value).subscribe({
      next: (blob) => { this.downloadFile(blob, 'Reporte_Aumento_Donativos.pdf'); this.isLoading = false; },
      error: () => this.handleError(),
    });
  }

  generateDonationReport(): void {
    if (this.dateRangeForm.invalid) return;
    this.isLoading = true;
    this.reportsService.donationReport(this.dateRangeForm.value).subscribe({
      next: (blob) => { this.downloadFile(blob, 'Reporte_Donativos.pdf'); this.isLoading = false; },
      error: () => this.handleError(),
    });
  }

  generateIssuedReceiptsReport(): void {
    if (this.issuedReceiptsForm.invalid) return;
    this.isLoading = true;
    this.reportsService.issuedReceiptsReport(this.issuedReceiptsForm.value).subscribe({
      next: (blob) => { this.downloadFile(blob, 'Reporte_Recibos_Emitidos.pdf'); this.isLoading = false; },
      error: () => this.handleError(),
    });
  }
}
