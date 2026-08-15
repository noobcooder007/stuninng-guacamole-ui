import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import {
  BeneficientReceiptLine,
  BeneficientReportItem,
  BeneficientsByCollectorFilter,
  BeneficientsByCollectorReport,
  ReportsService,
} from '@app/core/services/reports.service';
import { CollectorListItem, CollectorService } from '@app/core/services/collector.service';
import { HasPermissionPipe } from '@app/shared/pipes/has-permission.pipe';
import { Permissions } from '@app/shared/enums/app-permission.enum';

const MONTH_LABELS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

interface ReceiptRow extends BeneficientReceiptLine {
  periodMonth: number;
  periodYear: number;
}

@Component({
  selector: 'app-reports-beneficients-by-collector',
  standalone: true,
  templateUrl: './reports-beneficients-by-collector.component.html',
  styleUrl: './reports-beneficients-by-collector.component.scss',
  imports: [
    CurrencyPipe,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatChipsModule,
    MatCheckboxModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTableModule,
    HasPermissionPipe,
  ],
})
export class ReportsBeneficientsByCollectorComponent implements OnInit {
  protected readonly Permissions = Permissions;
  private readonly reportsService = inject(ReportsService);
  private readonly collectorService = inject(CollectorService);

  public isLoading = signal(false);
  public isDownloading = signal(false);
  public report = signal<BeneficientsByCollectorReport | null>(null);

  public readonly displayedColumns = ['period', 'type', 'folio', 'amount', 'status'];

  public readonly months = MONTH_LABELS.map((label, i) => ({ value: i + 1, label }));

  public currentYear = new Date().getFullYear();
  public years: number[] = [];

  public filterForm = new FormGroup({
    fromMonth: new FormControl<number | null>(null, Validators.required),
    fromYear: new FormControl<number | null>(null, Validators.required),
    toMonth: new FormControl<number | null>(null, Validators.required),
    toYear: new FormControl<number | null>(null, Validators.required),
    includeSpecial: new FormControl(true, { nonNullable: true }),
    collectorNumber: new FormControl<number | null>(null),
  });

  public filteredCollectors = signal<CollectorListItem[]>([]);
  public collectorCtrl = new FormControl<CollectorListItem | string | null>('');

  displayCollector = (c: CollectorListItem | string | null) =>
    c && typeof c !== 'string' ? `${c.collectorNumber} - ${c.firstname} ${c.firstLastname} ${c.secondLastname ?? ''}`.trim() : '';

  ngOnInit(): void {
    this.generateYears();
    const currentMonth = new Date().getMonth() + 1;
    this.filterForm.patchValue({
      fromMonth: currentMonth,
      fromYear: this.currentYear,
      toMonth: currentMonth,
      toYear: this.currentYear,
    });

    this.collectorCtrl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(v => this.collectorService.getActiveList(typeof v === 'string' ? v : undefined)),
    ).subscribe(items => this.filteredCollectors.set(items));

    this.consultar();
  }

  onCollectorSelected(event: MatAutocompleteSelectedEvent): void {
    const collector = event.option.value as CollectorListItem;
    this.filterForm.patchValue({ collectorNumber: collector.collectorNumber });
  }

  clearCollector(): void {
    this.collectorCtrl.setValue('');
    this.filterForm.patchValue({ collectorNumber: null });
  }

  private generateYears(): void {
    for (let i = this.currentYear - 5; i <= this.currentYear + 5; i++) {
      this.years.push(i);
    }
  }

  private buildFilters(): BeneficientsByCollectorFilter {
    const { fromMonth, fromYear, toMonth, toYear, includeSpecial, collectorNumber } = this.filterForm.getRawValue();
    const filters: BeneficientsByCollectorFilter = {
      fromMonth: fromMonth!,
      fromYear: fromYear!,
      toMonth: toMonth!,
      toYear: toYear!,
      includeSpecial,
    };
    if (collectorNumber) filters.collectorNumber = collectorNumber;
    return filters;
  }

  periodLabel(month: number, year: number): string {
    return `${MONTH_LABELS[month - 1] ?? ''} ${year}`;
  }

  receiptRows(beneficient: BeneficientReportItem): ReceiptRow[] {
    return beneficient.periods.flatMap(p =>
      p.receipts.map(r => ({ ...r, periodMonth: p.periodMonth, periodYear: p.periodYear })),
    );
  }

  consultar(): void {
    if (this.filterForm.invalid) return;
    this.isLoading.set(true);
    this.reportsService.beneficientsByCollectorReport(this.buildFilters()).subscribe({
      next: (report) => {
        this.report.set(report);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  descargarPdf(): void {
    if (this.filterForm.invalid) return;
    this.isDownloading.set(true);
    this.reportsService.beneficientsByCollectorReportPdf(this.buildFilters()).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        this.isDownloading.set(false);
      },
      error: () => this.isDownloading.set(false),
    });
  }
}
