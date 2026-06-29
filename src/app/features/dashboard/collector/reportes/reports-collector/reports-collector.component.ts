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
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ReportsService } from '@app/core/services/reports.service';
import { HasPermissionPipe } from '@app/shared/pipes/has-permission.pipe';
import { Permissions } from '@app/shared/enums/app-permission.enum';

@Component({
  selector: 'app-reports-collector',
  standalone: true,
  templateUrl: './reports-collector.component.html',
  styleUrl: './reports-collector.component.scss',
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
    HasPermissionPipe,
  ],
})
export class ReportsCollectorComponent implements OnInit {
  protected readonly Permissions = Permissions;
  private reportsService = inject(ReportsService);
  private snackBar = inject(MatSnackBar);

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

  public depositsForm = new FormGroup({
    startDate: new FormControl<Date | null>(null),
    endDate: new FormControl<Date | null>(null),
    collectorNum: new FormControl(''),
  });

  public liquidationForm = new FormGroup({
    month: new FormControl(''),
    year: new FormControl(''),
    collectorNum: new FormControl(''),
  });

  ngOnInit(): void {
    this.generateYears();
    const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
    this.liquidationForm.patchValue({ month: currentMonth, year: String(this.currentYear) });
  }

  private generateYears(): void {
    for (let i = this.currentYear - 5; i <= this.currentYear + 5; i++) {
      this.years.push(i);
    }
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

  downloadDepositsReport(): void {
    if (this.depositsForm.invalid) return;
    this.isLoading = true;
    this.reportsService.collectorDepositsReport(this.depositsForm.value).subscribe({
      next: (blob) => { this.downloadFile(blob, 'Reporte_Depositos_Colector.pdf'); this.isLoading = false; },
      error: () => this.handleError(),
    });
  }

  downloadLiquidationReportPdf(): void {
    if (this.liquidationForm.invalid) return;
    this.isLoading = true;
    this.reportsService.collectorLiquidationReportPdf(this.liquidationForm.value).subscribe({
      next: (blob) => { this.downloadFile(blob, 'Reporte_Liquidacion_Colector.pdf'); this.isLoading = false; },
      error: () => this.handleError(),
    });
  }

  downloadLiquidationReportExcel(): void {
    if (this.liquidationForm.invalid) return;
    this.isLoading = true;
    this.reportsService.collectorLiquidationReportExcel(this.liquidationForm.value).subscribe({
      next: (blob) => { this.downloadFile(blob, 'Reporte_Liquidacion_Colector.xlsx'); this.isLoading = false; },
      error: () => this.handleError(),
    });
  }
}
