import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import {
  CollectorEfficiencyByPeriod,
  CollectorEfficiencyByYear,
  CollectorService,
  CollectorsEfficiencyReport,
} from '@app/core/services/collector.service';
import { Permissions } from '@app/shared/enums/app-permission.enum';
import { HasPermissionPipe } from '@app/shared/pipes/has-permission.pipe';

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

@Component({
  selector: 'app-reports-efficiency-consolidated',
  standalone: true,
  templateUrl: './reports-efficiency-consolidated.component.html',
  styleUrl: './reports-efficiency-consolidated.component.scss',
  imports: [
    CurrencyPipe,
    DecimalPipe,
    NgTemplateOutlet,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressBarModule,
    MatSelectModule,
    MatTableModule,
    MatTabsModule,
    HasPermissionPipe,
  ],
})
export class ReportsEfficiencyConsolidatedComponent implements OnInit {
  protected readonly Permissions = Permissions;
  private readonly collectorService = inject(CollectorService);

  public isLoading = signal(false);
  public report = signal<CollectorsEfficiencyReport | null>(null);

  public selectedPeriodId = signal<string | null>(null);
  public selectedYear = signal<number | null>(null);

  public readonly displayedColumns = [
    'collectorNumber', 'collectorName', 'assignedAmount', 'collectedAmount', 'pendingAmount', 'collectionRate',
  ];

  public readonly selectedPeriod = computed<CollectorEfficiencyByPeriod | null>(() => {
    const periods = this.report()?.byPeriod ?? [];
    return periods.find(p => p.periodId === this.selectedPeriodId()) ?? periods[0] ?? null;
  });

  public readonly selectedYearReport = computed<CollectorEfficiencyByYear | null>(() => {
    const years = this.report()?.byYear ?? [];
    return years.find(y => y.year === this.selectedYear()) ?? years[0] ?? null;
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.isLoading.set(true);
    this.collectorService.getEfficiencyReport().subscribe({
      next: (report) => {
        this.report.set(report);
        this.selectedPeriodId.set(report.byPeriod[0]?.periodId ?? null);
        this.selectedYear.set(report.byYear[0]?.year ?? null);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  periodLabel(p: CollectorEfficiencyByPeriod): string {
    return `${MONTHS[p.month - 1] ?? ''} ${p.year} · ${p.periodStatus}`;
  }
}
