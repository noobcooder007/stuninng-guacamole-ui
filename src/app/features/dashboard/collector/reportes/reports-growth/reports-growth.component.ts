import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { GrowthReport, ProcessesService } from '@app/core/services/processes.service';
import { Permissions } from '@app/shared/enums/app-permission.enum';
import { HasPermissionPipe } from '@app/shared/pipes/has-permission.pipe';

@Component({
  selector: 'app-reports-growth',
  standalone: true,
  templateUrl: './reports-growth.component.html',
  styleUrl: './reports-growth.component.scss',
  imports: [
    CurrencyPipe,
    DecimalPipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    HasPermissionPipe,
  ],
})
export class ReportsGrowthComponent implements OnInit {
  protected readonly Permissions = Permissions;
  private readonly processesService = inject(ProcessesService);

  public isLoading = signal(false);
  public report = signal<GrowthReport | null>(null);
  public currentYear = new Date().getFullYear();
  public years: number[] = [];

  public readonly months = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' },
  ];

  public filterForm = new FormGroup({
    month: new FormControl<number | null>(null, Validators.required),
    year: new FormControl<number | null>(null, Validators.required),
  });

  ngOnInit(): void {
    this.generateYears();
    this.filterForm.patchValue({
      month: new Date().getMonth() + 1,
      year: this.currentYear,
    });
    this.consultar();
  }

  private generateYears(): void {
    for (let i = this.currentYear - 5; i <= this.currentYear + 5; i++) {
      this.years.push(i);
    }
  }

  monthLabel(month: number): string {
    return this.months.find(m => m.value === month)?.label ?? '';
  }

  consultar(): void {
    if (this.filterForm.invalid) return;
    const { month, year } = this.filterForm.getRawValue();
    this.isLoading.set(true);
    this.processesService.getGrowthReport(month!, year!).subscribe({
      next: (report) => {
        this.report.set(report);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }
}
